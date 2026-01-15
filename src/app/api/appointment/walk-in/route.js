import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import Appointment from '@/models/appointment'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    await connectDB()
    const session = await auth()

    if (!session || session.user.role !== 'HOSPITAL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get hospital admin profile
    const hospitalAdmin = await User.findOne({ _id: session.user._id, role: 'HOSPITAL_ADMIN' })
      .populate('hospitalAdminProfile')

    if (!hospitalAdmin?.hospitalAdminProfile) {
      return NextResponse.json({ error: 'Hospital admin profile not found' }, { status: 404 })
    }

    const hospitalId = hospitalAdmin.hospitalAdminProfile._id

    // Parse request body
    const { patientData, doctorId, isEmergency } = await req.json()

    console.log('📋 Walk-in Request:', { patientData, doctorId, isEmergency })

    // Validate required fields
    if (!patientData?.firstName || !patientData?.lastName || !patientData?.phoneNumber) {
      return NextResponse.json({ 
        error: 'Missing required patient data' 
      }, { status: 400 })
    }

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID required' }, { status: 400 })
    }

    // 1. Check if patient exists by phone number
    let patient = await User.findOne({ 
      phoneNumber: patientData.phoneNumber,
      role: 'PATIENT'
    })

    let newAccountCreated = false
    let generatedPassword = null

    if (!patient) {
      // Generate random password for new patient
      generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(generatedPassword, 10)

      // Create new patient account
      patient = new User({
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        phoneNumber: patientData.phoneNumber,
        email: patientData.email || `${patientData.phoneNumber}@qlinic.temp`,
        password: hashedPassword, // ✅ Required field
        role: 'PATIENT',
        age: patientData.age,
        gender: patientData.gender
      })

      await patient.save()
      newAccountCreated = true
      
      console.log('✅ New patient created:', patient._id)
    } else {
      console.log('✅ Existing patient found:', patient._id)
    }

    // 2. Generate token number for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAppointments = await Appointment.countDocuments({
      hospitalId,
      doctorId,
      scheduledTime: { $gte: today, $lt: tomorrow }
    })

    const tokenNumber = todayAppointments + 1

    // 3. Create appointment
    const appointment = new Appointment({
      patientId: patient._id,
      doctorId,
      hospitalId,
      scheduledTime: new Date(), // Current time for walk-in
      type: 'WALK_IN',
      status: 'BOOKED',
      tokenNumber,
      isEmergency: isEmergency || false,
      bookingSource: 'HOSPITAL_RECEPTION',
      paymentStatus: 'PENDING'
    })

    await appointment.save()

    console.log('✅ Walk-in appointment created:', appointment._id, 'Token:', tokenNumber)

    // 4. Return success with credentials if new account
    return NextResponse.json({
      success: true,
      tokenNumber,
      appointmentId: appointment._id,
      patientId: patient._id,
      newAccount: newAccountCreated,
      password: newAccountCreated ? generatedPassword : undefined,
      message: newAccountCreated 
        ? 'Patient registered and appointment created' 
        : 'Appointment created for existing patient'
    })

  } catch (error) {
    console.error('❌ Walk-in appointment error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create walk-in appointment',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
