import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/user';
import Appointment from '@/models/appointment';

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== 'doctor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get('hospitalId');
    const status = searchParams.get('status');

    const query = { doctorId: user._id };
    if (hospitalId) query.hospitalId = hospitalId;
    if (status && status !== 'ALL') query.status = status;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName email phoneNumber patientProfile')
      .populate('hospitalId', 'name')
      .sort({ scheduledTime: -1 })
      .limit(100);

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
