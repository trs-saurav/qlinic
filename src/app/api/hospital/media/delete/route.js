import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Hospital from '@/models/hospital'
import { verifyHospitalAdmin } from '@/lib/hospitalAuth'
import cloudinary from '@/lib/cloudinary'

export async function DELETE(req) {
  try {
    const authResult = await verifyHospitalAdmin()
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { hospitalId } = authResult

    await connectDB()

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
      if (isNaN(photoIndex) || photoIndex < 0 || photoIndex >= 10) {
        return NextResponse.json({ error: 'Invalid index' }, { status: 400 })
      }

      // Initialize array if needed
      if (!hospital.images) {
        hospital.images = []
      }

      // Ensure array has enough slots
      while (hospital.images.length <= photoIndex) {
        hospital.images.push(null)
      }

      // Delete from Cloudinary if photo exists at this index
      if (hospital.images[photoIndex]) {
        await deleteFromCloudinary(hospital.images[photoIndex])
        hospital.images[photoIndex] = null
        console.log('✅ Facility photo deleted at index', photoIndex)
      } else {
        console.log('⚠️ No photo at index', photoIndex)
      }

      // Clean up trailing nulls to keep array compact
      while (hospital.images.length > 0 && 
             hospital.images[hospital.images.length - 1] === null) {
        hospital.images.pop()
      }
      
      hospital.markModified('images')
      
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
        facilityPhotos: hospital.images || []
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
