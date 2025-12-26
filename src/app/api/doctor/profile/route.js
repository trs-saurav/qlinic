// app/api/doctor/profile/route.js
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// GET - Fetch doctor profile
export async function GET(req) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const doctor = await User.findOne({ clerkId: userId, role: 'doctor' })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    console.log('✅ Doctor profile loaded:', doctor._id, doctor.email) // DEBUG

    return NextResponse.json({ success: true, doctor: doctor }) // ✅ CHANGED from 'profile' to 'doctor'
  } catch (error) {
    console.error('Error fetching doctor profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update doctor profile
export async function POST(req) {
  try {
    const { userId } = await auth()
    if (!userId) {
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

    // Handle profile photo upload
    const profilePhoto = formData.get('profilePhoto')
    if (profilePhoto && profilePhoto.size > 0) {
      const bytes = await profilePhoto.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload to Cloudinary
      const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'doctor_profiles', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(buffer)
      })

      profileData.profileImage = uploadResponse.secure_url
    }

    // Get existing doctor to merge data
    const existingDoctor = await User.findOne({ clerkId: userId, role: 'doctor' })
    if (!existingDoctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Merge existing doctorProfile with new data
    const mergedDoctorProfile = {
      ...existingDoctor.doctorProfile?.toObject?.() || {},
      ...doctorProfileData
    }

    // Update the doctor profile
    const doctor = await User.findOneAndUpdate(
      { clerkId: userId, role: 'doctor' },
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

    console.log('✅ Doctor profile updated:', doctor._id) // DEBUG

    return NextResponse.json({ success: true, doctor: doctor }) // ✅ CHANGED from 'profile' to 'doctor'
  } catch (error) {
    console.error('Error updating doctor profile:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
