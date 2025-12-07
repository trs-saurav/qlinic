// app/api/patient/records/[id]/route.js
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/user';
import MedicalRecord from '@/models/medicalRecord';

export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // ✅ FIXED: Await params (Next.js 15+ requirement)
    const { id } = await params;
    
    const record = await MedicalRecord.findOneAndUpdate(
      { _id: id, userId: user._id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!record) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting record:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete record' }, { status: 500 });
  }
}
