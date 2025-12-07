import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/user';
import Appointment from '@/models/appointment';

export async function GET(req) {
  console.log('🔵 Patient Appointments GET called');
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const appointments = await Appointment.find({ patientId: user._id })
      .populate('doctorId', 'firstName lastName doctorProfile')
      .populate('hospitalId', 'name address contactDetails')
      .sort({ scheduledTime: -1 });

    return NextResponse.json({ 
      success: true,
      appointments: appointments || []
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
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
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { doctorId, hospitalId, familyMemberId, scheduledTime, reason, type } = body;

    const patientId = familyMemberId || user._id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayAppointments = await Appointment.countDocuments({
      hospitalId,
      scheduledTime: { $gte: todayStart }
    });

    const tokenNumber = todayAppointments + 1;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      hospitalId,
      scheduledTime,
      reason,
      type: type || 'SCHEDULED',
      status: 'BOOKED',
      tokenNumber,
      paymentStatus: 'PENDING'
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctorId', 'firstName lastName doctorProfile')
      .populate('hospitalId', 'name address contactDetails');

    return NextResponse.json({ 
      success: true, 
      appointment: populatedAppointment 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create appointment',
      details: error.message 
    }, { status: 500 });
  }
}
