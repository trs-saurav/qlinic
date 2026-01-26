export async function PATCH(req, { params }) {
  try {
    const { id } = params; // Remove await here
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
    
    if (!status && !isRescheduling) {
      return NextResponse.json({ 
        success: false, 
        error: 'Status or scheduledTime is required' 
      }, { status: 400 });
    }

    await connectDB();
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Appointment not found' 
      }, { status: 404 });
    }

    // Authorization checks...
    // (keep your existing authorization logic)

    // Update fields explicitly
    if (scheduledTime) {
      // Check for conflicts...
      appointment.scheduledTime = scheduledTime;
    }

    if (status) {
      appointment.status = status;
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

    // ... other field updates

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
