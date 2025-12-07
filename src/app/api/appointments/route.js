// app/api/appointments/route.js
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Appointment from '@/models/appointment';
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const doctorId = searchParams.get('doctorId');

    const query = { hospitalId: user.hospitalAdminProfile.hospitalId };
    if (status && status !== 'ALL') query.status = status;
    if (doctorId && doctorId !== 'ALL') query.doctorId = doctorId;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName email phoneNumber')
      .populate('doctorId', 'firstName lastName doctorProfile')
      .sort({ scheduledTime: 1 });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
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
    const { patientData, doctorId, isEmergency } = body;

    // Create patient if new
    let patient = await User.findOne({ email: patientData.email });
    if (!patient) {
      patient = await User.create({
        clerkId: `temp_${Date.now()}`,
        email: patientData.email,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        phoneNumber: patientData.phone,
        role: 'patient',
        patientProfile: {
          gender: patientData.gender,
          dateOfBirth: patientData.dateOfBirth
        }
      });
    }

    // Generate token number
    const lastAppointment = await Appointment.findOne({ 
      hospitalId: user.hospitalAdminProfile.hospitalId 
    }).sort({ tokenNumber: -1 });
    
    const tokenNumber = lastAppointment ? lastAppointment.tokenNumber + 1 : 101;

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      hospitalId: user.hospitalAdminProfile.hospitalId,
      tokenNumber,
      scheduledTime: new Date(),
      status: 'CHECKED_IN',
      type: isEmergency ? 'EMERGENCY' : 'REGULAR',
      paymentStatus: 'PENDING'
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';

export async function GET(req) {
  return NextResponse.json({ 
    message: 'Appointments route is working!' 
  });
}
