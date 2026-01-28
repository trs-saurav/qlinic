import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Appointment from '@/models/appointment';
import { requireRole } from '@/lib/apiAuth';
import { adminDb } from '@/config/firebaseAdmin'; // Ensure you have this import for sync

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    
    // Allow 'staff' role if you have one, otherwise just 'hospital_admin'
    const gate = await requireRole(['hospital_admin', 'doctor', 'user', 'staff']);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
    
    const body = await req.json();
    const { 
      status, scheduledTime, vitals, diagnosis, prescription, 
      prescriptionFileUrl, notes, nextVisit, skipCount, 
      lastSkippedAt, paymentStatus, reason, instructions 
    } = body;

    await connectDB();
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    // --- AUTHORIZATION LOGIC ---
    const isDoctor = gate.me.role === 'doctor' && appointment.doctorId.toString() === gate.me._id.toString();
    const isAdmin = ['hospital_admin', 'staff'].includes(gate.me.role); // Staff/Admins
    const isPatient = gate.me.role === 'user' && appointment.patientId.toString() === gate.me._id.toString();

    if (!isDoctor && !isAdmin && !isPatient) {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // --- FIELD PERMISSION CHECKS ---

    // 1. Clinical Data (Strictly Doctor Only)
    const hasClinicalFields = diagnosis !== undefined || prescription !== undefined || notes !== undefined || nextVisit !== undefined;
    
    if (hasClinicalFields && !isDoctor) {
       return NextResponse.json({ 
          success: false, 
          error: 'Only doctors can update clinical details (diagnosis, prescription, notes).' 
       }, { status: 403 });
    }

    // 2. Vitals & Payment (Doctor OR Admin/Staff)
    // We do NOT block admins from updating vitals anymore.
    const hasAdminFields = vitals !== undefined || paymentStatus !== undefined;
    
    if (hasAdminFields && (!isDoctor && !isAdmin)) {
       return NextResponse.json({ 
          success: false, 
          error: 'Unauthorized to update vitals or payment' 
       }, { status: 403 });
    }

    // --- UPDATE LOGIC ---

    // Status / Schedule
    if (scheduledTime) appointment.scheduledTime = scheduledTime;
    if (status) appointment.status = status;

    // Payment (Force Uppercase)
    if (paymentStatus) appointment.paymentStatus = paymentStatus.toUpperCase();

    // Vitals (Merge)
    if (vitals !== undefined) {
      const processedVitals = {};
      // Convert inputs to strings safely
      ['temperature', 'weight', 'bpSystolic', 'bpDiastolic', 'spo2', 'heartRate'].forEach(key => {
         if (vitals[key] !== undefined && vitals[key] !== null && vitals[key] !== '') {
             processedVitals[key] = vitals[key].toString();
         }
      });
      
      // Update logic: if we have new data, merge it. If empty but explicit, set it.
      if (Object.keys(processedVitals).length > 0) {
          appointment.vitals = { ...appointment.vitals, ...processedVitals };
          appointment.markModified('vitals');
      }
    }

    // Clinical Data (Doctor Only)
    if (isDoctor) {
        if (diagnosis !== undefined) appointment.diagnosis = diagnosis;
        if (prescription !== undefined) appointment.prescription = prescription;
        if (notes !== undefined) appointment.notes = notes;
        if (nextVisit !== undefined) appointment.nextVisit = nextVisit;
        if (prescriptionFileUrl !== undefined) appointment.prescriptionFileUrl = prescriptionFileUrl;
    }

    // General Fields
    if (skipCount !== undefined) appointment.skipCount = skipCount;
    if (lastSkippedAt !== undefined) appointment.lastSkippedAt = lastSkippedAt;
    if (reason !== undefined) appointment.reason = reason;
    if (instructions !== undefined) appointment.instructions = instructions;

    await appointment.save();

    // Firebase Sync
    const hospitalId = appointment.hospitalId?.toString();
    const doctorId = appointment.doctorId?.toString();
    if (hospitalId && doctorId) {
        try {
            const queueRef = adminDb.ref(`queues/${hospitalId}/${doctorId}`);
            await queueRef.update({ lastUpdated: Date.now() });
        } catch (e) {
            console.error('Firebase sync error:', e);
        }
    }
    
    return NextResponse.json({ success: true, data: appointment });

  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
