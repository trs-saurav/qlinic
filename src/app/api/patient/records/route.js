import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/user';
import MedicalRecord from '@/models/medicalRecord';
import FamilyMember from '@/models/familyMember';
import cloudinary from '@/lib/cloudinary';

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const records = await MedicalRecord.find({ 
      userId: user._id,
      isActive: true 
    })
      .populate('familyMemberId', 'firstName lastName relationship')
      .sort({ date: -1 });

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Error fetching records:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const title = formData.get('title')?.trim();
    const type = formData.get('type');
    const familyMemberId = formData.get('familyMemberId');
    const date = formData.get('date');
    const notes = formData.get('notes');

    // VALIDATION
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ success: false, error: 'Type is required' }, { status: 400 });
    }
    if (!familyMemberId) {
      return NextResponse.json({ success: false, error: 'Family member is required' }, { status: 400 });
    }

    // VALIDATE FAMILY MEMBER BELONGS TO USER
    const familyMember = await FamilyMember.findOne({
      _id: familyMemberId,
      userId: user._id
    });
    if (!familyMember) {
      return NextResponse.json({ success: false, error: 'Invalid family member' }, { status: 400 });
    }

    // FILE SIZE VALIDATION (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Get cloudinary instance
    const cloudinaryInstance = cloudinary;

    // CLOUDINARY UPLOAD
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinaryInstance.uploader.upload_stream(
        {
          folder: 'qlinic/medical-records',
          resource_type: 'auto',
          public_id: `record-${user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });

    if (!uploadResult?.secure_url) {
      return NextResponse.json({ success: false, error: 'File upload to storage failed' }, { status: 500 });
    }

    // DATE VALIDATION
    const recordDate = new Date(date);
    if (isNaN(recordDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid date format' }, { status: 400 });
    }

    // CREATE RECORD
    const record = await MedicalRecord.create({
      userId: user._id,
      familyMemberId,
      title,
      type,
      fileUrl: uploadResult.secure_url,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      date: recordDate,
      notes,
      uploadedBy: 'Patient',
      isActive: true
    });

    // POPULATE FOR FRONTEND
    const populatedRecord = await MedicalRecord.findById(record._id)
      .populate('familyMemberId', 'firstName lastName relationship');

    return NextResponse.json({ 
      success: true, 
      record: populatedRecord 
    });

  } catch (error) {
    console.error('Error uploading record:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to upload file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
