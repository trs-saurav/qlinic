// app/api/hospital/media/route.js
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import Hospital from '@/models/hospital'
import User from '@/models/user'
import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

// GET - Fetch hospital's media
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ clerkId: userId })
    if (!user || user.role !== 'hospital_admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const hospitalId = user.hospitalAdminProfile?.hospitalId
    if (!hospitalId) {
      return NextResponse.json({ error: 'Hospital ID not found' }, { status: 404 })
    }

    const hospital = await Hospital.findById(hospitalId).select(
      '_id name logo coverPhoto facilityPhotos'
    )

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    return NextResponse.json({
      media: {
        logo: hospital.logo || null,
        coverPhoto: hospital.coverPhoto || null,
        facilityPhotos: hospital.facilityPhotos || []
      },
      hospitalId: hospital._id.toString(),
      hospitalName: hospital.name
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Fetch hospital media error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch media',
      details: error.message 
    }, { status: 500 })
  }
}

// PATCH - Update hospital's media (SIMPLIFIED VERSION)
export async function PATCH(req) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.error('❌ No userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ clerkId: userId })
    if (!user || user.role !== 'hospital_admin') {
      console.error('❌ User not authorized:', { userId, role: user?.role })
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const hospitalId = user.hospitalAdminProfile?.hospitalId
    if (!hospitalId) {
      console.error('❌ No hospital ID for user:', userId)
      return NextResponse.json({ error: 'Hospital ID not found' }, { status: 404 })
    }

    const hospital = await Hospital.findById(hospitalId)
    if (!hospital) {
      console.error('❌ Hospital not found:', hospitalId)
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const body = await req.json()
    const { type, url, index } = body

    console.log('📝 Update request:', { type, url, index, hospitalId })

    if (!type || !url) {
      console.error('❌ Missing fields:', { type, url })
      return NextResponse.json({ 
        error: 'Missing required fields: type and url' 
      }, { status: 400 })
    }

    // Helper to delete from Cloudinary
    const deleteFromCloudinary = async (imageUrl) => {
      if (!imageUrl) return
      try {
        const urlParts = imageUrl.split('/')
        const publicIdWithExt = urlParts.slice(urlParts.indexOf('qlinic')).join('/')
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '')
        await cloudinary.uploader.destroy(publicId)
        console.log('✅ Deleted from Cloudinary:', publicId)
      } catch (err) {
        console.log('⚠️ Cloudinary delete failed:', err.message)
      }
    }

    // **SIMPLIFIED: Just store URLs directly in schema**
    if (type === 'logo') {
      await deleteFromCloudinary(hospital.logo)
      hospital.logo = url
      console.log('✅ Logo updated')

    } else if (type === 'coverPhoto') {
      await deleteFromCloudinary(hospital.coverPhoto)
      hospital.coverPhoto = url
      console.log('✅ Cover photo updated')

    } else if (type === 'facilityPhoto') {
      if (index === undefined || index < 0 || index >= 6) {
        console.error('❌ Invalid index:', index)
        return NextResponse.json({ 
          error: 'Invalid index. Must be 0-5' 
        }, { status: 400 })
      }

      // Initialize array if needed
      if (!hospital.facilityPhotos) {
        hospital.facilityPhotos = []
      }

      // Delete old photo at this index if exists
      if (hospital.facilityPhotos[index]) {
        await deleteFromCloudinary(hospital.facilityPhotos[index])
      }

      // Set new photo URL
      hospital.facilityPhotos[index] = url
      
      // Mark as modified for Mongoose
      hospital.markModified('facilityPhotos')
      
      console.log('✅ Facility photo updated at index', index)

    } else {
      console.error('❌ Invalid type:', type)
      return NextResponse.json({ 
        error: 'Invalid type. Must be: logo, coverPhoto, or facilityPhoto' 
      }, { status: 400 })
    }

    // Save hospital
    hospital.updatedAt = new Date()
    await hospital.save()

    console.log('✅ Hospital saved successfully')

    // Return updated media
    const responseData = {
      message: 'Media updated successfully',
      media: {
        logo: hospital.logo || null,
        coverPhoto: hospital.coverPhoto || null,
        facilityPhotos: hospital.facilityPhotos || []
      }
    }
    
    console.log('📤 Sending response:', responseData)

    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('❌ Update hospital media error:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json({ 
      error: 'Failed to update media',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
