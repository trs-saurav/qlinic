import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Appointment from '@/models/appointment';
import { requireRole } from '@/lib/apiAuth';

export async function PATCH(req, { params }) {
  try {
    const gate = await requireRole(['hospital_admin', 'doctor', 'user']);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { id } = await params;
    const body = await req.json();
    const { status, scheduledTime, vitals, diagnosis, prescription, prescriptionFileUrl, notes, nextVisit, skipCount, lastSkippedAt, paymentStatus, updatedByRole } = body;

    // Allow rescheduling if only scheduledTime is provided (patient reschedule)
    const isRescheduling = scheduledTime && !status;
    
    if (!status && !isRescheduling) {
      return NextResponse.json({ success: false, error: 'Status or scheduledTime is required' }, { status: 400 });
    }

    await connectDB();

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    // Authorization check
    if (gate.me.role === 'doctor' && appointment.doctorId.toString() !== gate.me._id.toString()) {
      return NextResponse.json({ error: 'You can only update your own appointments' }, { status: 403 });
    }

    // Patient can only reschedule their own appointments and only if BOOKED
    if (gate.me.role === 'user') {
      if (appointment.patientId.toString() !== gate.me._id.toString()) {
        return NextResponse.json({ error: 'You can only update your own appointments' }, { status: 403 });
      }
      if (isRescheduling && appointment.status !== 'BOOKED') {
        return NextResponse.json({ error: 'Can only reschedule booked appointments' }, { status: 400 });
      }
      if (!isRescheduling && status !== 'CANCELLED') {
        return NextResponse.json({ error: 'Patients can only cancel or reschedule appointments' }, { status: 403 });
      }
    }

    // Update scheduled time (reschedule)
    if (scheduledTime) {
      appointment.scheduledTime = scheduledTime;
    }

    // Update status
    if (status) {
      appointment.status = status;
    }
    
    // Update vitals if provided
    if (vitals) {
      appointment.vitals = { ...appointment.vitals, ...vitals };
    }
    
    // Update diagnosis if provided
    if (diagnosis) {
      appointment.diagnosis = diagnosis;
    }
    
    // Update prescription if provided
    if (prescription !== undefined) {
      appointment.prescription = prescription;
    }
    
    // Update prescription file URL if provided
    if (prescriptionFileUrl !== undefined) {
      appointment.prescriptionFileUrl = prescriptionFileUrl;
    }
    
    // Update notes if provided
    if (notes !== undefined) {
      appointment.notes = notes;
    }
    
    // Update next visit if provided
    if (nextVisit !== undefined) {
      appointment.nextVisit = nextVisit;
    }
    
    // Update skip count if provided
    if (skipCount !== undefined) {
      appointment.skipCount = skipCount;
    }
    
    // Update last skipped time if provided
    if (lastSkippedAt !== undefined) {
      appointment.lastSkippedAt = lastSkippedAt;
    }
    
    // Update payment status if provided (typically on check-in)
    if (paymentStatus !== undefined) {
      appointment.paymentStatus = paymentStatus;
    }
    
    // Track consultation times
    if (status === 'IN_CONSULTATION' && !appointment.consultationStartTime) {
      appointment.consultationStartTime = new Date();
    }
    
    if (status === 'COMPLETED' && !appointment.consultationEndTime) {
      appointment.consultationEndTime = new Date();
    }

    await appointment.save();

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
