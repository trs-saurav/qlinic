import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { requireRole } from '@/lib/apiAuth';

export async function POST(req) {
  try {
    // Only doctors can upload prescriptions
    const gate = await requireRole(['doctor']);
    
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only images and PDFs are allowed' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size exceeds 5MB limit' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'prescriptions',
          resource_type: 'auto',
          format: file.type === 'application/pdf' ? 'pdf' : undefined
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const result = await uploadPromise;

    return NextResponse.json({ 
      success: true, 
      url: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to upload file' 
    }, { status: 500 });
  }
}
