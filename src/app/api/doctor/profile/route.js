import { auth } from '@/auth'
import connectDB from '@/config/db'
import cloudinary from '@/lib/cloudinary'
import User from '@/models/user'
import { NextResponse } from 'next/server'

// GET - Fetch doctor profile
export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const doctor = await User.findOne({ email: session.user.email, role: 'doctor' })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    console.log('✅ Doctor profile loaded:', doctor._id, doctor.email)

    return NextResponse.json({ success: true, doctor: doctor })
  } catch (error) {
    console.error('Error fetching doctor profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update doctor profile
export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const formData = await req.formData()
    
    // Root level profile data
    const profileData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phoneNumber: formData.get('phone'),
      isProfileComplete: true
    }

    // Parse languages from comma-separated string
    const languagesString = formData.get('languages')
    const languagesArray = languagesString 
      ? languagesString.split(',').map(l => l.trim()).filter(l => l)
      : []

    // Doctor profile nested data
    const doctorProfileData = {
      specialization: formData.get('specialization'),
      experience: parseInt(formData.get('experience')),
      qualification: formData.get('qualification'),
      licenseNumber: formData.get('registrationNumber'),
      consultationFee: parseFloat(formData.get('consultationFee')),
      about: formData.get('about'),
      languages: languagesArray
    }

    // Get existing doctor first
    const existingDoctor = await User.findOne({ email: session.user.email, role: 'doctor' })
    if (!existingDoctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Handle profile photo upload
    const profilePhoto = formData.get('profilePhoto')
    if (profilePhoto && profilePhoto instanceof File && profilePhoto.size > 0) {
      console.log('📸 Uploading profile photo:', profilePhoto.name, profilePhoto.size, 'bytes')

      try {
        const bytes = await profilePhoto.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // ✅ Get cloudinary instance (already configured via @/lib/cloudinary)
        const cloudinaryInstance = cloudinary

        // ✅ Upload to Cloudinary
        const uploadResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinaryInstance.uploader.upload_stream(
            {
              folder: 'qlinic/doctor_profiles',
              resource_type: 'image',
              public_id: `doctor_${existingDoctor._id}_${Date.now()}`,
              overwrite: true,
              transformation: [
                { width: 500, height: 500, crop: 'fill', gravity: 'face' },
                { quality: 'auto:good' }
              ]
            },
            (error, result) => {
              if (error) {
                console.error('❌ Cloudinary upload error:', error)
                reject(error)
              } else {
                console.log('✅ Cloudinary upload success:', result.secure_url)
                resolve(result)
              }
            }
          )

          uploadStream.end(buffer)
        })

        profileData.profileImage = uploadResponse.secure_url
        console.log('✅ Profile image uploaded:', uploadResponse.secure_url)

      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError)
        return NextResponse.json({ 
          error: 'Failed to upload profile photo: ' + uploadError.message 
        }, { status: 500 })
      }
    }

    // Merge existing doctorProfile with new data
    const mergedDoctorProfile = {
      ...existingDoctor.doctorProfile?.toObject?.() || {},
      ...doctorProfileData
    }

    // Update the doctor profile
    const doctor = await User.findOneAndUpdate(
      { email: session.user.email, role: 'doctor' },
      { 
        $set: {
          ...profileData,
          doctorProfile: mergedDoctorProfile
        }
      },
      { new: true, runValidators: true }
    )

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    console.log('✅ Doctor profile updated:', doctor._id)

    return NextResponse.json({ success: true, doctor: doctor })
  } catch (error) {
    console.error('Error updating doctor profile:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}
