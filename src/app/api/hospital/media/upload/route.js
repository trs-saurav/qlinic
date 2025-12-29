// app/api/hospital/media/upload/route.js
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import cloudinary from '@/lib/cloudinary'

export async function POST(req) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const type = formData.get('type')
    const hospitalId = formData.get('hospitalId')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: 'No type provided' }, { status: 400 })
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only images allowed.' 
      }, { status: 400 })
    }

    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size must be less than 3MB' 
      }, { status: 400 })
    }

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const fileStr = `data:${file.type};base64,${base64}`

    // Folder structure
    const validHospitalId = hospitalId && hospitalId !== 'null' ? hospitalId : 'temp'
    const folder = `qlinic/hospitals/${validHospitalId}`

    // Optimized transformations
    const transformations = {
      logo: {
        width: 200,
        height: 200,
        crop: 'fill',
        gravity: 'center',
        quality: 'auto:good'
      },
      coverPhoto: {
        width: 1000,
        height: 300,
        crop: 'fill',
        gravity: 'center',
        quality: 'auto:eco'
      },
      facilityPhoto: {
        width: 600,
        height: 450,
        crop: 'fill',
        gravity: 'center',
        quality: 'auto:eco'
      }
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileStr, {
      folder: folder,
      resource_type: 'image',
      transformation: transformations[type] || transformations.facilityPhoto,
      quality: 'auto:eco',
      format: 'webp',
    })

    console.log('✅ Upload successful:', {
      publicId: result.public_id,
      size: `${(result.bytes / 1024).toFixed(2)} KB`,
      format: result.format
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
      format: result.format
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json({ 
      error: 'Upload failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
