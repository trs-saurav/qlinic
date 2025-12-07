// app/api/doctors/route.js
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/user';

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId });
    if (!user || user.role !== 'hospital_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const doctors = await User.find({
      role: 'doctor',
      'doctorProfile.hospitalId': user.hospitalAdminProfile.hospitalId,
      isActive: true
    }).select('firstName lastName email doctorProfile');

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { doctorId, isAvailable } = await req.json();

    await User.findByIdAndUpdate(doctorId, {
      'doctorProfile.isAvailable': isAvailable
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating doctor status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
