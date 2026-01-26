import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Appointment from '@/models/appointment';
import { requireRole } from '@/lib/apiAuth'; // Assuming this is the correct path

export async function PATCH(req, { params }) {
  try {
    const { id } = await params; // Await the params promise
    console.log('🔍 PATCH REQUEST RECEIVED for appointment ID:', id);
    
    const gate = await requireRole(['hospital_admin', 'doctor', 'user']);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
    
    const body = await req.json();
    console.log('📦 Request body received:', body);
    
    const { 
      status, scheduledTime, vitals, diagnosis, prescription, 
      prescriptionFileUrl, notes, nextVisit, skipCount, 
      lastSkippedAt, paymentStatus, reason, instructions 
    } = body;

    const isRescheduling = scheduledTime && !status;
    
    // Check if this is a rescheduling operation (only scheduledTime, no status)
    if (isRescheduling) {
      // For rescheduling, we still need validation but allow it without status
    } else if (!status) {
      // If not rescheduling, then status is required unless updating consultation details
      // Allow updates to consultation fields without changing status
      const hasConsultationUpdates = vitals !== undefined || diagnosis !== undefined || 
                                    prescription !== undefined || notes !== undefined || 
                                    nextVisit !== undefined;
                                    
      if (!hasConsultationUpdates) {
        return NextResponse.json({ 
          success: false, 
          error: 'Status or consultation data (vitals, diagnosis, etc.) is required' 
        }, { status: 400 });
      }
    }

    await connectDB();
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Appointment not found' 
      }, { status: 404 });
    }

    // Authorization checks
    // Only allow authorized users to update appointments
    const isDoctor = gate.me.role === 'doctor' && appointment.doctorId.toString() === gate.me._id.toString();
    const isAdmin = gate.me.role === 'hospital_admin';
    const isPatient = gate.me.role === 'user' && appointment.patientId.toString() === gate.me._id.toString();
    
    // Only doctors can update certain fields during consultation
    const hasConsultationFields = vitals !== undefined || diagnosis !== undefined || 
                                  prescription !== undefined || notes !== undefined || 
                                  nextVisit !== undefined;
                                  
    if (hasConsultationFields && !isDoctor) {
      return NextResponse.json({
        success: false,
        error: 'Only doctor can update consultation details'
      }, { status: 403 });
    }
    
    // Only admins or the appointment creator/patient can update general status
    if (!isDoctor && !isAdmin && !isPatient) {
      return NextResponse.json({
        success: false,
        error: 'Not authorized to update this appointment'
      }, { status: 403 });
    }

    // Update fields explicitly
    if (scheduledTime) {
      // Check for conflicts...
      appointment.scheduledTime = scheduledTime;
    }

    if (status) {
      appointment.status = status;
    }
    
    // Update vitals if provided - ensure proper type conversion for String fields
    if (vitals !== undefined) {
      console.log('📝 Processing vitals:', vitals);
      const processedVitals = {};
      
      // Convert numeric values to strings as expected by the schema
      if (vitals.temperature !== undefined && vitals.temperature !== null && vitals.temperature !== '') {
        const temp = parseFloat(vitals.temperature)
        if (!isNaN(temp)) {
          processedVitals.temperature = temp.toString();
          console.log('🌡️ Setting temperature:', processedVitals.temperature)
        } else if (typeof vitals.temperature === 'string') {
          processedVitals.temperature = vitals.temperature; // Use as-is if it's already a string
        }
      }
      if (vitals.weight !== undefined && vitals.weight !== null && vitals.weight !== '') {
        const weight = parseFloat(vitals.weight)
        if (!isNaN(weight)) {
          processedVitals.weight = weight.toString();
          console.log('⚖️ Setting weight:', processedVitals.weight)
        } else if (typeof vitals.weight === 'string') {
          processedVitals.weight = vitals.weight; // Use as-is if it's already a string
        }
      }
      if (vitals.bpSystolic !== undefined && vitals.bpSystolic !== null && vitals.bpSystolic !== '') {
        const bpSys = parseFloat(vitals.bpSystolic)
        if (!isNaN(bpSys)) {
          processedVitals.bpSystolic = bpSys.toString();
          console.log('🩸 Setting bpSystolic:', processedVitals.bpSystolic)
        } else if (typeof vitals.bpSystolic === 'string') {
          processedVitals.bpSystolic = vitals.bpSystolic; // Use as-is if it's already a string
        }
      }
      if (vitals.bpDiastolic !== undefined && vitals.bpDiastolic !== null && vitals.bpDiastolic !== '') {
        const bpDia = parseFloat(vitals.bpDiastolic)
        if (!isNaN(bpDia)) {
          processedVitals.bpDiastolic = bpDia.toString();
          console.log('🩸 Setting bpDiastolic:', processedVitals.bpDiastolic)
        } else if (typeof vitals.bpDiastolic === 'string') {
          processedVitals.bpDiastolic = vitals.bpDiastolic; // Use as-is if it's already a string
        }
      }
      if (vitals.spo2 !== undefined && vitals.spo2 !== null && vitals.spo2 !== '') {
        const spo2 = parseFloat(vitals.spo2)
        if (!isNaN(spo2)) {
          processedVitals.spo2 = spo2.toString();
          console.log('🫁 Setting spo2:', processedVitals.spo2)
        } else if (typeof vitals.spo2 === 'string') {
          processedVitals.spo2 = vitals.spo2; // Use as-is if it's already a string
        }
      }
      if (vitals.heartRate !== undefined && vitals.heartRate !== null && vitals.heartRate !== '') {
        const hr = parseFloat(vitals.heartRate)
        if (!isNaN(hr)) {
          processedVitals.heartRate = hr.toString();
          console.log('❤️ Setting heartRate:', processedVitals.heartRate)
        } else if (typeof vitals.heartRate === 'string') {
          processedVitals.heartRate = vitals.heartRate; // Use as-is if it's already a string
        }
      }
      
      // Only update vitals if we have valid data to update
      if (Object.keys(processedVitals).length > 0) {
        appointment.vitals = {
          ...appointment.vitals,
          ...processedVitals
        };
        console.log('📋 Final vitals object:', appointment.vitals)
        appointment.markModified('vitals'); // Ensure Mongoose knows the vitals object was modified
      } else {
        // If processedVitals is empty but original vitals object was provided, 
        // assign the original vitals as-is
        appointment.vitals = vitals;
        appointment.markModified('vitals');
        console.log('📋 Using original vitals as-is:', vitals)
      }
    }
    
    // Update diagnosis if provided
    if (diagnosis !== undefined) {
      appointment.diagnosis = diagnosis;
      appointment.markModified('diagnosis');
      console.log('📋 Diagnosis updated to:', diagnosis);
    }
    
    // Update notes if provided
    if (notes !== undefined) {
      appointment.notes = notes;
      appointment.markModified('notes');
      console.log('📝 Notes updated to:', notes);
    }
    
    // Update prescription if provided
    if (prescription !== undefined) {
      appointment.prescription = prescription;
      appointment.markModified('prescription');
      console.log('💊 Prescription updated to:', prescription);
    }
    
    // Update nextVisit if provided
    if (nextVisit !== undefined) {
      appointment.nextVisit = nextVisit;
      appointment.markModified('nextVisit');
      console.log('📅 Next visit updated to:', nextVisit);
    }
    
    // Update prescriptionFileUrl if provided
    if (prescriptionFileUrl !== undefined) {
      appointment.prescriptionFileUrl = prescriptionFileUrl;
      appointment.markModified('prescriptionFileUrl');
      console.log('📄 Prescription file URL updated to:', prescriptionFileUrl);
    }
    
    // Update skipCount if provided
    if (skipCount !== undefined) {
      appointment.skipCount = skipCount;
      appointment.markModified('skipCount');
      console.log('⏭️ Skip count updated to:', skipCount);
    }
    
    // Update lastSkippedAt if provided
    if (lastSkippedAt !== undefined) {
      appointment.lastSkippedAt = lastSkippedAt;
      appointment.markModified('lastSkippedAt');
      console.log('🕒 Last skipped at updated to:', lastSkippedAt);
    }
    
    // Update paymentStatus if provided
    if (paymentStatus !== undefined) {
      appointment.paymentStatus = paymentStatus;
      appointment.markModified('paymentStatus');
      console.log('💳 Payment status updated to:', paymentStatus);
    }
    
    // Update reason and instructions explicitly
    if (reason !== undefined) {
      appointment.reason = reason;
      appointment.markModified('reason');
      console.log('💬 Reason updated to:', reason);
    }
    
    if (instructions !== undefined) {
      appointment.instructions = instructions;
      appointment.markModified('instructions');
      console.log('📝 Instructions updated to:', instructions);
    }
    
    // Update other fields if provided
    if (body.type !== undefined) {
      appointment.type = body.type;
      appointment.markModified('type');
      console.log('🏷️ Type updated to:', body.type);
    }
    
    if (body.cancelReason !== undefined) {
      appointment.cancelReason = body.cancelReason;
      appointment.markModified('cancelReason');
      console.log('❌ Cancel reason updated to:', body.cancelReason);
    }

    console.log('💾 Saving appointment...');
    await appointment.save();
    
    // Fetch fresh data to verify
    const updatedAppointment = await Appointment.findById(id)
      .populate('doctorId', 'firstName lastName')
      .populate('hospitalId', 'name');
    
    console.log('✅ Appointment saved:', {
      reason: updatedAppointment.reason,
      instructions: updatedAppointment.instructions
    });
    
    return NextResponse.json({ 
      success: true, 
      data: updatedAppointment 
    });
  } catch (error) {
    console.error('💥 Error updating appointment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server Error' 
    }, { status: 500 });
  }
}