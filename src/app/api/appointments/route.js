// app/api/appointments/route.js
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import User from '@/models/user'

export async function GET(req) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const doctorId = searchParams.get('doctorId')

    let query = {}
    let appointments = []

    // Role-based filtering
    if (user.role === 'hospital_admin') {
      query.hospitalId = user.hospitalAdminProfile.hospitalId
      if (status && status !== 'ALL') query.status = status
      if (doctorId && doctorId !== 'ALL') query.doctorId = doctorId

      appointments = await Appointment.find(query)
        .populate('patientId', 'firstName lastName email phoneNumber')
        .populate('doctorId', 'firstName lastName doctorProfile')
        .populate('hospitalId', 'name address')
        .sort({ scheduledTime: 1 })

    } else if (user.role === 'doctor') {
      query.doctorId = user._id
      if (status && status !== 'ALL') query.status = status

      appointments = await Appointment.find(query)
        .populate('patientId', 'firstName lastName email phoneNumber patientProfile')
        .populate('hospitalId', 'name address phone')
        .sort({ scheduledTime: 1 })

    } else if (user.role === 'patient') {
      query.patientId = user._id
      if (status && status !== 'ALL') query.status = status

      appointments = await Appointment.find(query)
        .populate('doctorId', 'firstName lastName doctorProfile')
        .populate('hospitalId', 'name address phone')
        .sort({ scheduledTime: -1 })
    }

    return NextResponse.json({ success: true, appointments })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()

    // Hospital Admin creating appointment
    if (user.role === 'hospital_admin') {
      const { patientData, doctorId, isEmergency, scheduledTime } = body

      // Create or find patient
      let patient = await User.findOne({ email: patientData.email })
      if (!patient) {
        patient = await User.create({
          clerkId: `temp_${Date.now()}`,
          email: patientData.email,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          phoneNumber: patientData.phone,
          role: 'patient',
          patientProfile: {
            gender: patientData.gender,
            dateOfBirth: patientData.dateOfBirth
          }
        })
      }

      // Generate token number
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const lastAppointment = await Appointment.findOne({ 
        hospitalId: user.hospitalAdminProfile.hospitalId,
        scheduledTime: { $gte: today }
      }).sort({ tokenNumber: -1 })
      
      const tokenNumber = lastAppointment ? lastAppointment.tokenNumber + 1 : 101

      const appointment = await Appointment.create({
        patientId: patient._id,
        doctorId,
        hospitalId: user.hospitalAdminProfile.hospitalId,
        tokenNumber,
        scheduledTime: scheduledTime || new Date(),
        status: 'CHECKED_IN',
        type: isEmergency ? 'EMERGENCY' : 'REGULAR',
        paymentStatus: 'PENDING'
      })

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('patientId', 'firstName lastName email phoneNumber')
        .populate('doctorId', 'firstName lastName doctorProfile')

      return NextResponse.json({ success: true, appointment: populatedAppointment })
    }

    // Patient booking appointment
    if (user.role === 'patient') {
      const { doctorId, hospitalId, scheduledTime, type, notes } = body

      if (!doctorId || !hospitalId || !scheduledTime) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Generate token number
      const appointmentDate = new Date(scheduledTime)
      appointmentDate.setHours(0, 0, 0, 0)
      
      const lastAppointment = await Appointment.findOne({ 
        hospitalId,
        doctorId,
        scheduledTime: { $gte: appointmentDate }
      }).sort({ tokenNumber: -1 })
      
      const tokenNumber = lastAppointment ? lastAppointment.tokenNumber + 1 : 1

      const appointment = await Appointment.create({
        patientId: user._id,
        doctorId,
        hospitalId,
        tokenNumber,
        scheduledTime,
        status: 'BOOKED',
        type: type || 'REGULAR',
        paymentStatus: 'PENDING',
        notes
      })

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('doctorId', 'firstName lastName doctorProfile')
        .populate('hospitalId', 'name address phone')

      return NextResponse.json({ success: true, appointment: populatedAppointment })
    }

    return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })

  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
