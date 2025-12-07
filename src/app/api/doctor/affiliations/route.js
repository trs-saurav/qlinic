// app/api/doctor/affiliations/route.js
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/user';
import HospitalAffiliation from '@/models/hospitalAffiliation';
import Hospital from '@/models/hospital';

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId });
    if (!user || user.role !== 'doctor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const affiliations = await HospitalAffiliation.find({ doctorId: user._id })
      .populate('hospitalId', 'name address city state')
      .sort({ createdAt: -1 });

    return NextResponse.json({ affiliations });
  } catch (error) {
    console.error('Error fetching affiliations:', error);
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
    if (!user || user.role !== 'doctor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { hospitalId, consultationFee, availableDays, notes } = body;

    // Check if already exists
    const existing = await HospitalAffiliation.findOne({
      doctorId: user._id,
      hospitalId,
      status: { $in: ['PENDING', 'APPROVED'] }
    });

    if (existing) {
      return NextResponse.json({ error: 'Request already exists' }, { status: 400 });
    }

    const affiliation = await HospitalAffiliation.create({
      doctorId: user._id,
      hospitalId,
      requestType: 'DOCTOR_TO_HOSPITAL',
      consultationFee,
      availableDays,
      notes
    });

    return NextResponse.json({ success: true, affiliation });
  } catch (error) {
    console.error('Error creating affiliation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
