// app/api/doctor/affiliations/[id]/route.js
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/user';
import HospitalAffiliation from '@/models/hospitalAffiliation';

export async function PATCH(req, { params }) {
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

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const affiliation = await HospitalAffiliation.findOneAndUpdate(
      { _id: id, doctorId: user._id, requestType: 'HOSPITAL_TO_DOCTOR' },
      {
        status,
        respondedAt: new Date(),
        respondedBy: user._id
      },
      { new: true }
    );

    if (!affiliation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, affiliation });
  } catch (error) {
    console.error('Error updating affiliation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
