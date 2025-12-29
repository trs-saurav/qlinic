// app/api/hospital/media/delete/route.js
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import Hospital from '@/models/hospital'
import User from '@/models/user'
import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function DELETE(req) {
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

    const hospital = await Hospital.findById(hospitalId)
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const index = searchParams.get('index')

    console.log('🗑️ Delete request:', { type, index })

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

    if (type === 'logo') {
      await deleteFromCloudinary(hospital.logo)
      hospital.logo = null
      console.log('✅ Logo deleted')

    } else if (type === 'coverPhoto') {
      await deleteFromCloudinary(hospital.coverPhoto)
      hospital.coverPhoto = null
      console.log('✅ Cover photo deleted')

    } else if (type === 'facilityPhoto') {
      const photoIndex = parseInt(index)
      if (isNaN(photoIndex) || photoIndex < 0 || photoIndex >= 6) {
        return NextResponse.json({ error: 'Invalid index' }, { status: 400 })
      }

      // Initialize array if needed
      if (!hospital.facilityPhotos) {
        hospital.facilityPhotos = []
      }

      // **FIX: Create array with 6 slots, keeping positions**
      // First, ensure array has 6 slots
      while (hospital.facilityPhotos.length < 6) {
        hospital.facilityPhotos.push(null)
      }

      // Delete from Cloudinary if photo exists at this index
      if (hospital.facilityPhotos[photoIndex]) {
        await deleteFromCloudinary(hospital.facilityPhotos[photoIndex])
        hospital.facilityPhotos[photoIndex] = null
        console.log('✅ Facility photo deleted at index', photoIndex)
      } else {
        console.log('⚠️ No photo at index', photoIndex)
      }

      // Clean up trailing nulls to keep array compact
      while (hospital.facilityPhotos.length > 0 && 
             hospital.facilityPhotos[hospital.facilityPhotos.length - 1] === null) {
        hospital.facilityPhotos.pop()
      }
      
      hospital.markModified('facilityPhotos')
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    await hospital.save()

    console.log('✅ Media deleted and saved successfully')

    return NextResponse.json({
      message: 'Media deleted successfully',
      media: {
        logo: hospital.logo || null,
        coverPhoto: hospital.coverPhoto || null,
        facilityPhotos: hospital.facilityPhotos || []
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Delete media error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete media',
      details: error.message
    }, { status: 500 })
  }
}
