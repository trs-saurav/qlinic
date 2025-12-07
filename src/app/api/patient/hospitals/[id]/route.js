// app/api/patient/hospitals/[id]/route.js
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Hospital from '@/models/hospital';
import User from '@/models/user';

export async function GET(req, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const hospital = await Hospital.findById(id);
    
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    // Get doctors working at this hospital
    const doctors = await User.find({
      role: 'doctor',
      isActive: true,
      'doctorProfile.hospitalId': id
    }).select('firstName lastName email profileImage doctorProfile');

    return NextResponse.json({ 
      success: true,
      hospital, 
      doctors 
    });

  } catch (error) {
    console.error('Error fetching hospital details:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
