import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Appointment from '@/models/appointment';
import User from '@/models/user';
import Hospital from '@/models/hospital';
import { requireRole, getMyHospitalOrFail } from '@/lib/apiAuth';
import { startOfDay, endOfDay, isSameDay } from 'date-fns';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    // Allow both hospital_admin and user roles to create appointments
    const gate = await requireRole(['hospital_admin', 'user']);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
    
    await connectDB();
    const body = await req.json();
    
    // ==========================================
    // 🏥 HOSPITAL ADMIN FLOW (WALK-IN / RECEPTION)
    // ==========================================
    if (gate.me.role === 'hospital_admin') {
      const hospital = await getMyHospitalOrFail(gate.me);
      if (!hospital.ok) return NextResponse.json({ error: hospital.error }, { status: hospital.status });

      const { 
        patientId,      // Capture patientId if provided
        patientData,    // Can be null if patientId exists
        doctorId, 
        isEmergency, 
        appointmentType, 
        paymentStatus, 
        paymentMethod,
        date, 
        timeSlot 
      } = body;

      let patient;
      let generatedPassword = null;
      let phoneInput = null;

      // ✅ FIX 1: Check if we already have an ID (Existing Patient)
      if (patientId) {
        patient = await User.findById(patientId);
        if (!patient) {
          return NextResponse.json({ error: 'Selected patient not found' }, { status: 404 });
        }
        console.log('✅ Used existing patient ID:', patient._id);
      } 
      // ✅ FIX 2: Only access patientData if NO ID was provided (New Patient)
      else if (patientData) {
        phoneInput = patientData.phone;
        const emailInput = patientData.email && patientData.email.trim() !== '' 
          ? patientData.email.toLowerCase() 
          : `${phoneInput}@qlinic.app`;

        // Check duplicate by phone/email
        patient = await User.findOne({
          $or: [
            { phoneNumber: phoneInput },
            { email: emailInput }
          ]
        });

        if (!patient) {
          // Create New Patient
          const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          patient = await User.create({
            firstName: patientData.firstName,
            lastName: patientData.lastName,
            phoneNumber: phoneInput, 
            email: emailInput,
            age: patientData.age,
            gender: patientData.gender,
            role: 'user',
            password: hashedPassword,
            isProfileComplete: false
          });
          
          generatedPassword = randomPassword; 
          console.log('✅ New patient created:', patient._id);
        }
      } else {
        // Fallback if neither ID nor Data is sent
        return NextResponse.json({ error: 'Patient information missing' }, { status: 400 });
      }

      // 2. Determine Logic: Future vs Immediate
      const isFutureBooking = appointmentType === 'SCHEDULED' && date && timeSlot;
      
      let scheduledTime = new Date();
      let status = 'CHECKED_IN';
      let finalType = isEmergency ? 'EMERGENCY' : (appointmentType || 'WALK_IN');
      let finalTokenNumber = null;

      if (finalType === 'SCHEDULED') finalType = 'REGULAR'; 

      if (isFutureBooking) {
        scheduledTime = new Date(`${date}T${timeSlot}:00`);
        // If the date is actually today, treat as check-in
        if (isSameDay(scheduledTime, new Date())) {
            status = 'CHECKED_IN';
        } else {
            status = 'BOOKED';
        }
      } else {
        status = 'CHECKED_IN';
      }

      // 3. Generate Token (ONLY if Checking In)
      if (status === 'CHECKED_IN') {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const lastTokenAppt = await Appointment.findOne({
            hospitalId: hospital.hospital._id,
            doctorId: doctorId,
            scheduledTime: { $gte: todayStart, $lte: todayEnd },
            tokenNumber: { $ne: null }
        }).sort({ tokenNumber: -1 });

        finalTokenNumber = (lastTokenAppt?.tokenNumber || 0) + 1;
      }

      // 4. Create Appointment
      const newAppointment = await Appointment.create({
        patientId: patient._id,
        doctorId,
        hospitalId: hospital.hospital._id,
        scheduledTime: scheduledTime,
        status: status,
        tokenNumber: finalTokenNumber,
        type: finalType, 
        checkInTime: status === 'CHECKED_IN' ? new Date() : null,
        
        // ✅ CRITICAL FIX: Ensure Uppercase for Enum Validation ('paid' -> 'PAID')
        paymentStatus: (paymentStatus || 'PENDING').toUpperCase(), 
        
        // Keep lowercase for paymentMethod as per your schema ('cash', 'upi', etc.)
        paymentMethod: paymentMethod || 'cash' 
      });

      return NextResponse.json({ 
        success: true, 
        appointment: newAppointment,
        tokenNumber: finalTokenNumber,
        generatedCredentials: generatedPassword ? {
          phone: phoneInput,
          password: generatedPassword
        } : null
      });

    // ==========================================
    // 👤 USER FLOW (SELF BOOKING)
    // ==========================================
    } else if (gate.me.role === 'user') {
       const { 
        patientId, 
        patientModel, 
        doctorId, 
        hospitalId, 
        scheduledTime, 
        reason, 
        instructions, 
        type 
      } = body;

      if (patientId !== gate.me._id.toString() && patientModel !== 'User') {
        const familyMember = gate.me.familyMembers?.find(fm => fm._id.toString() === patientId);
        if (!familyMember) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      let userFinalType = type || 'FOLLOW_UP';
      if (userFinalType === 'SCHEDULED') userFinalType = 'REGULAR';

      const newAppointment = await Appointment.create({
        patientId,
        patientModel: patientModel || 'User',
        doctorId,
        hospitalId,
        scheduledTime: new Date(scheduledTime),
        status: 'BOOKED',
        type: userFinalType,
        reason: reason || 'Follow-up appointment',
        instructions: instructions || ''
      });

      return NextResponse.json({ success: true, appointment: newAppointment });
    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Server Error'
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    console.log('🔍 GET /api/appointment - Request received');
    
    await connectDB();
    
    let url;
    try {
      url = new URL(req.url);
    } catch (urlError) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    
    const role = url.searchParams.get('role');
    const doctorId = url.searchParams.get('doctorId');
    const patientId = url.searchParams.get('patientId');
    const filter = url.searchParams.get('filter');

    const gate = await requireRole(['doctor', 'hospital_admin', 'user']);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    let query = {};

    if (role === 'doctor' && doctorId) {
      if (!gate.me.role || gate.me.role !== 'doctor' || !gate.me._id || gate.me._id.toString() !== doctorId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      query.doctorId = doctorId;
    } else if (role === 'hospital_admin') {
      const hospital = await getMyHospitalOrFail(gate.me);
      if (!hospital.ok) return NextResponse.json({ error: hospital.error }, { status: hospital.status });
      query.hospitalId = hospital.hospital._id;
    } else if (role === 'patient' && patientId) {
       if (!gate.me.role || gate.me.role !== 'user' || !gate.me._id || gate.me._id.toString() !== patientId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      query.patientId = patientId;
    } else {
      if(gate.me.role === 'doctor' && gate.me._id) query.doctorId = gate.me._id;
      else if(gate.me.role === 'user' && gate.me._id) query.patientId = gate.me._id;
      else return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    if (filter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      switch (filter) {
        case 'today':
          query.scheduledTime = { $gte: today, $lt: tomorrow };
          break;
        case 'upcoming':
          query.scheduledTime = { $gte: now };
          break;
        case 'past':
          query.scheduledTime = { $lt: today };
          break;
        case 'next7days':
          query.scheduledTime = { $gte: today, $lt: sevenDaysFromNow };
          break;
      }
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName age gender profilePicture phoneNumber')
      .populate('doctorId', 'firstName lastName doctorProfile')
      .populate('hospitalId', 'name')
      .sort({ scheduledTime: 1, tokenNumber: 1 });

    const processedAppointments = appointments.map(apt => {
      const aptObj = apt.toObject();
      if (!aptObj.vitals) {
        aptObj.vitals = { temperature: '', weight: '', bpSystolic: '', bpDiastolic: '', spo2: '', heartRate: '' };
      }
      return aptObj;
    });

    return NextResponse.json({ success: true, appointments: processedAppointments }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
