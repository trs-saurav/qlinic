// app/api/hospital/profile/route.js
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/user';
import Hospital from '@/models/hospital';

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

    let hospital = null;
    if (user.hospitalAdminProfile?.hospitalId) {
      hospital = await Hospital.findById(user.hospitalAdminProfile.hospitalId);
    }

    return NextResponse.json({ user, hospital });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
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

    const body = await req.json();
    
    // Create hospital
    const hospital = await Hospital.create({
      ...body,
      createdBy: user._id,
      isProfileComplete: true
    });

    // Update user with hospital reference
    await User.findByIdAndUpdate(user._id, {
      'hospitalAdminProfile.hospitalId': hospital._id
    });

    return NextResponse.json({ success: true, hospital });
  } catch (error) {
    console.error('Error creating hospital:', error);
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

    const user = await User.findOne({ clerkId: userId });
    if (!user || user.role !== 'hospital_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!user.hospitalAdminProfile?.hospitalId) {
      return NextResponse.json({ error: 'No hospital found' }, { status: 404 });
    }

    const body = await req.json();

    const hospital = await Hospital.findByIdAndUpdate(
      user.hospitalAdminProfile.hospitalId,
      { ...body, isProfileComplete: true },
      { new: true }
    );

    return NextResponse.json({ success: true, hospital });
  } catch (error) {
    console.error('Error updating hospital:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
