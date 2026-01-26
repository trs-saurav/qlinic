import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Appointment from '@/models/appointment';
import User from '@/models/user';
import Hospital from '@/models/hospital';
import { requireRole, getMyHospitalOrFail } from '@/lib/apiAuth';
import { startOfDay, endOfDay } from 'date-fns';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    // Allow both hospital_admin and user roles to create appointments
    // hospital_admin for walk-ins, user for self-booked appointments
    const gate = await requireRole(['hospital_admin', 'user']);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
    
    await connectDB();

    const body = await req.json();
    
    // Different handling based on user role
    if (gate.me.role === 'hospital_admin') {
      // Hospital admin creating walk-in appointment
      const hospital = await getMyHospitalOrFail(gate.me);
      if (!hospital.ok) return NextResponse.json({ error: hospital.error }, { status: hospital.status });

      const { patientData, doctorId, isEmergency, appointmentType } = body;

      // 1. Find or create patient
      let patient = await User.findOne({ phone: patientData.phone });
      let generatedPassword = null;

      if (!patient) {
        // ✅ Generate random password for new patient
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        patient = new User({
          ...patientData,
          role: 'user',
          email: patientData.email || `${patientData.phone}@qlinic.app`,
          password: hashedPassword // ✅ FIX: Add hashed password
        });
        
        await patient.save();
        generatedPassword = randomPassword; // Store plain password to return to user
        
        console.log('✅ New patient created with ID:', patient._id);
      }

      // 2. Generate Token
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());

      const lastTokenAppt = await Appointment.findOne({
        hospitalId: hospital.hospital._id,
        doctorId: doctorId,
        scheduledTime: { $gte: todayStart, $lte: todayEnd },
        tokenNumber: { $ne: null }
      }).sort({ tokenNumber: -1 });

      const nextToken = (lastTokenAppt?.tokenNumber || 0) + 1;

      // 3. Create Appointment
      const newAppointment = await Appointment.create({
        patientId: patient._id,
        doctorId,
        hospitalId: hospital.hospital._id,
        scheduledTime: new Date(), // Walk-in is for now
        status: 'CHECKED_IN',
        tokenNumber: nextToken,
        type: isEmergency ? 'EMERGENCY' : (appointmentType || 'WALKIN'),
        checkInTime: new Date(),
      });

      console.log('✅ Walk-in appointment created. Token:', nextToken);

      return NextResponse.json({ 
        success: true, 
        appointment: newAppointment,
        tokenNumber: nextToken,
        generatedCredentials: generatedPassword ? {
          phone: patientData.phone,
          password: generatedPassword
        } : null
      });
    } else if (gate.me.role === 'user') {
      // Regular user booking their own appointment
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

      // Validate that user is booking for themselves or their family member
      if (patientId !== gate.me._id.toString() && patientModel !== 'User') {
        // Check if it's a family member they have access to
        const familyMember = gate.me.familyMembers?.find(fm => fm._id.toString() === patientId);
        if (!familyMember) {
          return NextResponse.json({ 
            error: 'Unauthorized to book appointment for this patient' 
          }, { status: 403 });
        }
      }

      // Create the appointment
      const newAppointment = await Appointment.create({
        patientId,
        patientModel: patientModel || 'User',
        doctorId,
        hospitalId,
        scheduledTime: new Date(scheduledTime),
        status: 'BOOKED',
        type: type || 'FOLLOW_UP',
        reason: reason || 'Follow-up appointment',
        instructions: instructions || ''
      });

      console.log('✅ User appointment booked successfully:', newAppointment._id);

      return NextResponse.json({ 
        success: true, 
        appointment: newAppointment
      });
    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Server Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    console.log('🔍 GET /api/appointment - Request received');
    
    await connectDB();
    console.log('✅ Database connected');

    // Safely parse URL to prevent errors
    let url;
    try {
      url = new URL(req.url);
    } catch (urlError) {
      console.error('❌ Invalid URL:', urlError);
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    
    const role = url.searchParams.get('role');
    const doctorId = url.searchParams.get('doctorId');
    const patientId = url.searchParams.get('patientId');
    const filter = url.searchParams.get('filter');

    console.log('🔍 GET /api/appointment params:', { role, doctorId, patientId, filter });

    const gate = await requireRole(['doctor', 'hospital_admin', 'user']);
    if (!gate.ok) {
      console.log('❌ Auth failed:', gate.error);
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    console.log('✅ User authenticated:', { userId: gate.me?._id, role: gate.me?.role });
    
    // Check if gate.me exists and has required properties
    if (!gate.me) {
      console.error('❌ gate.me is undefined');
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
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
      // Fallback for generic queries based on logged-in user
      if(gate.me.role === 'doctor' && gate.me._id) query.doctorId = gate.me._id;
      else if(gate.me.role === 'user' && gate.me._id) query.patientId = gate.me._id;
      else {
        return NextResponse.json({ error: 'Invalid query parameters for your role' }, { status: 400 });
      }
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

    // Ensure all appointment objects have proper structure for frontend
    const processedAppointments = appointments.map(apt => {
      const aptObj = apt.toObject();
      
      // Ensure vitals object exists and has proper structure
      if (!aptObj.vitals) {
        aptObj.vitals = {
          temperature: '',
          weight: '',
          bpSystolic: '',
          bpDiastolic: '',
          spo2: '',
          heartRate: ''
        };
      }
      
      console.log(`📋 Appointment ${aptObj._id}:`, {
        status: aptObj.status,
        hasVitals: !!aptObj.vitals,
        vitalsKeys: aptObj.vitals ? Object.keys(aptObj.vitals) : [],
        vitalsValues: aptObj.vitals
      });
      return aptObj;
    });

    console.log('✅ Appointments found:', appointments.length, 'for query:', query);
    
    // Ensure appointments is always an array
    const appointmentsArray = Array.isArray(processedAppointments) ? processedAppointments : [];
    
    return NextResponse.json({ success: true, appointments: appointmentsArray }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: 'Server Error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}
