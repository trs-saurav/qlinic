import { NextResponse } from 'next/server'
import  connectDB  from '@/config/db'
import User from '@/models/user'
import Appointment from '@/models/appointment'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { auth } from '@/auth'
import { startOfDay, endOfDay, format, isSameDay } from 'date-fns'

export async function POST(req) {
  try {
    await connectDB()
    const session = await auth()

    // 1. Authorization Check
    // Allow Hospital Admins OR Doctors to create walk-ins
    // Also allow 'user' if you plan to support self-booking here later, but for now stick to staff
    if (!session || !['hospital_admin', 'doctor', 'staff'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }

    // 2. Parse Request
    const body = await req.json()
    const { 
      patientId,      // If existing patient selected
      patientData,    // If new patient being created
      doctorId, 
      appointmentType, // 'WALK_IN' or 'SCHEDULED'
      date,            // YYYY-MM-DD (for future)
      timeSlot,        // "HH:mm" (for future)
      isEmergency,
      paymentStatus,
      paymentMethod
    } = body

    if (!doctorId) return NextResponse.json({ error: 'Doctor ID required' }, { status: 400 })

    // 3. Resolve Patient (Find or Create)
    let finalPatientId = patientId
    let generatedCredentials = null

    if (!finalPatientId && patientData) {
      // Robust Check: Search by Phone OR Email
      const phoneInput = patientData.phone
      const emailInput = patientData.email && patientData.email.trim() !== '' 
          ? patientData.email.toLowerCase() 
          : `${phoneInput}@qlinic.app`

      const existingUser = await User.findOne({
        $or: [
          { phoneNumber: phoneInput },
          { email: emailInput }
        ]
      })
      
      if (existingUser) {
        finalPatientId = existingUser._id
      } else {
        // Create Shadow User
        const randomPass = Math.random().toString(36).slice(-8)
        
        const newUser = await User.create({
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          phoneNumber: patientData.phone,
          email: emailInput,
          role: 'user',
          isWalkInCreated: true, // Marks as shadow user
          password: randomPass, 
          gender: patientData.gender || 'other',
          age: patientData.age
        })
        
        finalPatientId = newUser._id
        generatedCredentials = { password: randomPass }
        console.log('✅ Created shadow user:', newUser._id)
      }
    }

    if (!finalPatientId) {
      return NextResponse.json({ error: 'Patient identification failed' }, { status: 400 })
    }

    // 4. Resolve Hospital & Affiliation
    // Link to the specific doctor's affiliation with the hospital
    const affiliation = await HospitalAffiliation.findOne({
      doctorId: doctorId,
      status: 'APPROVED'
    }).populate('hospitalId')

    if (!affiliation) {
      return NextResponse.json({ error: 'Doctor is not affiliated with this hospital' }, { status: 400 })
    }

    const hospitalId = affiliation.hospitalId._id

    // 5. Determine Timing, Status & Tokens
    let scheduledTime = new Date()
    let status = 'CHECKED_IN' // Default for immediate
    let finalTokenNumber = null
    let finalType = isEmergency ? 'EMERGENCY' : (appointmentType || 'WALK_IN')

    // Handle Mongoose Enum for 'type' (Map SCHEDULED -> REGULAR if needed, or keep SCHEDULED if supported)
    // Assuming your Schema supports: ['WALK_IN', 'EMERGENCY', 'REGULAR', 'FOLLOW_UP']
    if (finalType === 'SCHEDULED') finalType = 'REGULAR'

    const isFutureBooking = appointmentType === 'SCHEDULED' && date && timeSlot

    if (isFutureBooking) {
      // --- FUTURE BOOKING LOGIC ---
      scheduledTime = new Date(`${date}T${timeSlot}:00`)
      
      // Check if the "Future" date is actually TODAY
      if (isSameDay(scheduledTime, new Date())) {
         // It's today, so treat as a Check-In (with token)
         status = 'CHECKED_IN'
         finalType = 'WALK_IN' // Or keep as REGULAR/SCHEDULED based on preference
      } else {
         // It is truly in the future
         status = 'BOOKED'
         finalTokenNumber = null // No token for future dates yet
      }

    } else {
      // --- IMMEDIATE WALK-IN LOGIC ---
      scheduledTime = new Date()
      status = 'CHECKED_IN'
    }

    // Generate Token ONLY if checking in now (Today)
    if (status === 'CHECKED_IN') {
      const start = startOfDay(new Date())
      const end = endOfDay(new Date())
      
      const lastToken = await Appointment.findOne({
        hospitalId,
        doctorId,
        scheduledTime: { $gte: start, $lte: end },
        tokenNumber: { $exists: true, $ne: null }
      }).sort({ tokenNumber: -1 })

      finalTokenNumber = (lastToken?.tokenNumber || 0) + 1
    }

    // 6. Create Appointment
    const newAppointment = await Appointment.create({
      patientId: finalPatientId,
      patientModel: 'User',
      doctorId,
      hospitalId,
      affiliationId: affiliation._id,
      scheduledTime,
      timeSlot: timeSlot || format(scheduledTime, 'HH:mm'),
      type: finalType,
      status, // 'BOOKED' for future, 'CHECKED_IN' for today
      tokenNumber: finalTokenNumber,
      paymentStatus: paymentStatus || 'PENDING',
      paymentMethod: paymentMethod || null,
      reason: isEmergency ? 'Emergency Walk-in' : 'Reception Booking',
      checkInTime: status === 'CHECKED_IN' ? new Date() : null,
      synced: false
    })

    console.log(`✅ Appointment Created: ${newAppointment._id} | Status: ${status} | Token: ${finalTokenNumber}`)

    // 7. Return Response
    return NextResponse.json({
      success: true,
      appointment: newAppointment,
      generatedCredentials, // Only present if new account created
      tokenNumber: finalTokenNumber
    })

  } catch (error) {
    console.error('❌ Appointment Creation Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create appointment' 
    }, { status: 500 })
  }
}
