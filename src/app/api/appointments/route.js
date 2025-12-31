import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import User from '@/models/user'

export async function GET(req) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    await connectDB()

    const user = await User.findById(userId)
    
    if (!user) {
      console.log('❌ User not found:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.isActive) {
      console.log('❌ User account inactive:', user.email)
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const doctorId = searchParams.get('doctorId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')

    let query = {}
    let appointments = []

    // Date range filter
    if (startDate || endDate) {
      query.scheduledTime = {}
      if (startDate) query.scheduledTime.$gte = new Date(startDate)
      if (endDate) query.scheduledTime.$lte = new Date(endDate)
    }

    // Type filter
    if (type && type !== 'ALL') {
      query.type = type
    }

    // Role-based filtering
    if (user.role === 'hospital_admin') {
      const hospitalId = user.hospitalAdminProfile?.hospitalId

      if (!hospitalId) {
        console.log('❌ No hospital ID for admin:', user.email)
        return NextResponse.json(
          { error: 'Hospital not found for this admin' },
          { status: 404 }
        )
      }

      query.hospitalId = hospitalId
      
      if (status && status !== 'ALL') query.status = status
      if (doctorId && doctorId !== 'ALL') query.doctorId = doctorId

      appointments = await Appointment.find(query)
        .populate('patientId', 'firstName lastName email phoneNumber patientProfile')
        .populate('doctorId', 'firstName lastName doctorProfile profileImage')
        .populate('hospitalId', 'name address contactDetails')
        .sort({ scheduledTime: 1 })
        .lean()

      console.log(`✅ Found ${appointments.length} appointments for hospital admin`)

    } else if (user.role === 'doctor') {
      query.doctorId = user._id
      
      if (status && status !== 'ALL') query.status = status

      appointments = await Appointment.find(query)
        .populate('patientId', 'firstName lastName email phoneNumber patientProfile profileImage')
        .populate('hospitalId', 'name address contactDetails')
        .sort({ scheduledTime: 1 })
        .lean()

      console.log(`✅ Found ${appointments.length} appointments for doctor`)

    } else if (user.role === 'patient') {
      query.patientId = user._id
      
      if (status && status !== 'ALL') query.status = status

      appointments = await Appointment.find(query)
        .populate('doctorId', 'firstName lastName doctorProfile profileImage')
        .populate('hospitalId', 'name address contactDetails')
        .sort({ scheduledTime: -1 })
        .lean()

      console.log(`✅ Found ${appointments.length} appointments for patient`)

    } else if (user.role === 'admin') {
      // Admin can see all appointments
      if (status && status !== 'ALL') query.status = status
      if (doctorId && doctorId !== 'ALL') query.doctorId = doctorId

      appointments = await Appointment.find(query)
        .populate('patientId', 'firstName lastName email phoneNumber')
        .populate('doctorId', 'firstName lastName doctorProfile')
        .populate('hospitalId', 'name address contactDetails')
        .sort({ scheduledTime: -1 })
        .lean()

      console.log(`✅ Found ${appointments.length} appointments for admin`)

    } else {
      console.log('❌ Invalid user role:', user.role)
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 403 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      appointments,
      count: appointments.length
    })

  } catch (error) {
    console.error('❌ Error fetching appointments:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    await connectDB()

    const user = await User.findById(userId)
    
    if (!user) {
      console.log('❌ User not found:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.isActive) {
      console.log('❌ User account inactive:', user.email)
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
    }

    const body = await req.json()

    // Hospital Admin creating appointment (walk-in patient)
    if (user.role === 'hospital_admin') {
      const { patientData, doctorId, isEmergency, scheduledTime } = body

      const hospitalId = user.hospitalAdminProfile?.hospitalId

      if (!hospitalId) {
        console.log('❌ No hospital ID for admin:', user.email)
        return NextResponse.json(
          { error: 'Hospital not found for this admin' },
          { status: 404 }
        )
      }

      // Validate required fields
      if (!patientData?.email || !patientData?.firstName || !doctorId) {
        return NextResponse.json(
          { error: 'Missing required fields: email, firstName, doctorId' },
          { status: 400 }
        )
      }

      // Verify doctor exists and is active
      const doctor = await User.findOne({ 
        _id: doctorId, 
        role: 'doctor',
        isActive: true
      })

      if (!doctor) {
        return NextResponse.json(
          { error: 'Doctor not found or inactive' },
          { status: 404 }
        )
      }

      // Create or find patient
      let patient = await User.findOne({ email: patientData.email.toLowerCase() })
      
      if (!patient) {
        // Create new patient account
        patient = await User.create({
          email: patientData.email.toLowerCase(),
          firstName: patientData.firstName,
          lastName: patientData.lastName || '',
          phoneNumber: patientData.phone,
          role: 'patient',
          isActive: true,
          patientProfile: {
            gender: patientData.gender,
            dateOfBirth: patientData.dateOfBirth,
          }
        })
        
        console.log('✅ New patient created:', patient.email)
      } else {
        console.log('✅ Existing patient found:', patient.email)
      }

      // Generate token number for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const lastAppointment = await Appointment.findOne({ 
        hospitalId,
        scheduledTime: { 
          $gte: today,
          $lt: tomorrow
        }
      }).sort({ tokenNumber: -1 })
      
      const tokenNumber = lastAppointment ? lastAppointment.tokenNumber + 1 : 101

      // Create appointment
      const appointment = await Appointment.create({
        patientId: patient._id,
        doctorId,
        hospitalId,
        tokenNumber,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
        status: 'CHECKED_IN',
        type: isEmergency ? 'EMERGENCY' : 'REGULAR',
        paymentStatus: 'PENDING',
        createdBy: user._id,
        notes: body.notes || '',
      })

      // Populate and return
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('patientId', 'firstName lastName email phoneNumber patientProfile')
        .populate('doctorId', 'firstName lastName doctorProfile profileImage')
        .populate('hospitalId', 'name address contactDetails')
        .lean()

      console.log('✅ Appointment created by hospital admin:', appointment._id)

      return NextResponse.json({ 
        success: true, 
        appointment: populatedAppointment,
        message: 'Appointment created successfully'
      }, { status: 201 })
    }

    // Patient booking appointment
    if (user.role === 'patient') {
      const { doctorId, hospitalId, scheduledTime, type, notes } = body

      // Validate required fields
      if (!doctorId || !hospitalId || !scheduledTime) {
        return NextResponse.json(
          { error: 'Missing required fields: doctorId, hospitalId, scheduledTime' },
          { status: 400 }
        )
      }

      // Verify doctor exists and is active
      const doctor = await User.findOne({ 
        _id: doctorId, 
        role: 'doctor',
        isActive: true
      })

      if (!doctor) {
        return NextResponse.json(
          { error: 'Doctor not found or inactive' },
          { status: 404 }
        )
      }

      // Verify hospital exists and is active
      const Hospital = require('@/models/hospital').default
      const hospital = await Hospital.findOne({ 
        _id: hospitalId,
        isActive: true
      })

      if (!hospital) {
        return NextResponse.json(
          { error: 'Hospital not found or inactive' },
          { status: 404 }
        )
      }

      // Check for duplicate appointment
      const appointmentDate = new Date(scheduledTime)
      const existingAppointment = await Appointment.findOne({
        patientId: user._id,
        doctorId,
        hospitalId,
        scheduledTime: {
          $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
          $lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
        },
        status: { $nin: ['CANCELLED', 'COMPLETED'] }
      })

      if (existingAppointment) {
        return NextResponse.json(
          { error: 'You already have an appointment with this doctor on this date' },
          { status: 409 }
        )
      }

      // Generate token number for the selected date
      const appointmentDateStart = new Date(scheduledTime)
      appointmentDateStart.setHours(0, 0, 0, 0)
      const appointmentDateEnd = new Date(appointmentDateStart)
      appointmentDateEnd.setDate(appointmentDateEnd.getDate() + 1)
      
      const lastAppointment = await Appointment.findOne({ 
        hospitalId,
        doctorId,
        scheduledTime: { 
          $gte: appointmentDateStart,
          $lt: appointmentDateEnd
        }
      }).sort({ tokenNumber: -1 })
      
      const tokenNumber = lastAppointment ? lastAppointment.tokenNumber + 1 : 1

      // Create appointment
      const appointment = await Appointment.create({
        patientId: user._id,
        doctorId,
        hospitalId,
        tokenNumber,
        scheduledTime: new Date(scheduledTime),
        status: 'BOOKED',
        type: type || 'REGULAR',
        paymentStatus: 'PENDING',
        notes: notes || '',
        createdBy: user._id,
      })

      // Populate and return
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('doctorId', 'firstName lastName doctorProfile profileImage')
        .populate('hospitalId', 'name address contactDetails')
        .lean()

      console.log('✅ Appointment created by patient:', appointment._id)

      return NextResponse.json({ 
        success: true, 
        appointment: populatedAppointment,
        message: 'Appointment booked successfully'
      }, { status: 201 })
    }

    console.log('❌ Invalid user role for creating appointment:', user.role)
    return NextResponse.json(
      { error: 'Only patients and hospital admins can create appointments' },
      { status: 403 }
    )

  } catch (error) {
    console.error('❌ Error creating appointment:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: messages.join(', ')
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
