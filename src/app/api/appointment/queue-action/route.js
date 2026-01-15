import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Appointment from '@/models/appointment';
import { adminDb } from '@/config/firebaseAdmin'; 
import { auth } from '@/auth';

export async function POST(req) {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session || !['doctor', 'receptionist'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, appointmentId, notes, statusType, statusMessage, hospitalId, doctorId } = body;
    // action: 'START', 'COMPLETE', 'SKIP', 'RECALL', 'SET_STATUS'

    await connectDB();

    // --- BRANCH 1: HANDLING STATUS UPDATES ---
    if (action === 'SET_STATUS') {
      const targetDoctorId = session.user.role === 'doctor' ? session.user.id : doctorId;
      const targetHospitalId = hospitalId;

      if (!targetDoctorId || !targetHospitalId) {
         return NextResponse.json({ error: 'Missing doctor or hospital ID' }, { status: 400 });
      }

      const queueRef = adminDb.ref(`queues/${targetHospitalId}/${targetDoctorId}`);
      const isLive = statusType === 'OPD'; 

      // ✅ NEW: INTELLIGENT TOKEN CALCULATION
      // When setting status, we must know what the current token is
      let currentToken = 0;
      
      // Get today's start and end
      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

      // Check for ACTIVE patient first
      const ongoingApt = await Appointment.findOne({
        doctorId: targetDoctorId,
        hospitalId: targetHospitalId,
        status: 'IN_CONSULTATION',
        scheduledTime: { $gte: startOfDay, $lte: endOfDay }
      });

      if (ongoingApt) {
        currentToken = ongoingApt.tokenNumber;
      } else {
        // If no one is active, get the last completed one today
        const lastCompleted = await Appointment.findOne({
           doctorId: targetDoctorId,
           hospitalId: targetHospitalId,
           status: 'COMPLETED',
           scheduledTime: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ updatedAt: -1 }); // Get most recently updated
        
        currentToken = lastCompleted ? lastCompleted.tokenNumber : 0;
      }

      const updatePayload = {
        status: statusType, // 'OPD', 'REST', 'MEETING', 'EMERGENCY'
        statusMessage: statusMessage || '',
        isLive: isLive,
        currentToken: currentToken, // ✅ Now accurate!
        lastUpdated: Date.now()
      };

      try {
        await queueRef.update(updatePayload);
        return NextResponse.json({ success: true, status: statusType, currentToken });
      } catch (fbError) {
        console.error('Firebase Status Update Failed:', fbError);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
      }
    }

    // --- BRANCH 2: HANDLING APPOINTMENT ACTIONS ---
    if (!appointmentId) {
        return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Security Check
    if (appointment.doctorId.toString() !== session.user.id && session.user.role !== 'receptionist') {
       return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const now = new Date();

    switch (action) {
      case 'START':
        const activeApt = await Appointment.findOne({
          doctorId: session.user.id,
          status: 'IN_CONSULTATION',
          _id: { $ne: appointmentId }
        });
        
        if (activeApt) {
          return NextResponse.json({ 
            error: 'Finish the current consultation first.',
            activeAppointmentId: activeApt._id 
          }, { status: 409 });
        }

        appointment.status = 'IN_CONSULTATION';
        appointment.consultationStartTime = now;
        break;

      case 'COMPLETE':
        if (appointment.status !== 'IN_CONSULTATION') return NextResponse.json({ error: 'Appointment not in progress' }, { status: 400 });
        appointment.status = 'COMPLETED';
        appointment.consultationEndTime = now;
        if (notes) appointment.notes = notes;
        break;

      case 'SKIP':
        appointment.status = 'SKIPPED';
        appointment.skipCount = (appointment.skipCount || 0) + 1;
        appointment.lastSkippedAt = now;
        if (notes) appointment.notes = notes;
        break;

      case 'RECALL':
        if (appointment.status !== 'SKIPPED') return NextResponse.json({ error: 'Only skipped appointments can be recalled' }, { status: 400 });
        appointment.status = 'CHECKED_IN';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    await appointment.save();

    // 3. FIREBASE REALTIME UPDATE
    if (action === 'START') {
      const hospitalId = appointment.hospitalId; 
      const doctorId = session.user.id;
      const currentToken = appointment.tokenNumber;

      if (hospitalId && doctorId) {
        try {
          const queueRef = adminDb.ref(`queues/${hospitalId}/${doctorId}`);
          await queueRef.update({
            currentToken: currentToken,
            isLive: true,
            status: 'OPD', 
            statusMessage: '',
            lastUpdated: Date.now()
          });
        } catch (fbError) {
          console.error('Firebase Update Failed:', fbError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: appointment._id,
        status: appointment.status,
        startTime: appointment.consultationStartTime,
        endTime: appointment.consultationEndTime
      }
    });

  } catch (error) {
    console.error('Queue Action API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
