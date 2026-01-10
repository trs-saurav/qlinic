import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const appointmentId = searchParams.get('appointmentId')

  if (!appointmentId) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await connectDB()

  try {
    const myAppointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'firstName lastName')
      .populate('hospitalId', 'name address')
    
    if (!myAppointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // --- STATE 1: PRE-ARRIVAL ("Relax" Mode) ---
    if (myAppointment.status === 'BOOKED') {
      return NextResponse.json({
        success: true,
        mode: 'RELAX',
        data: {
          status: 'BOOKED',
          message: 'Appointment Confirmed',
          safeArrivalTime: myAppointment.scheduledTime, // "Reach by 10:30 AM"
          tokenNumber: null
        }
      })
    }

    // --- STATE 3: SKIPPED ("Panic" Mode) ---
    if (myAppointment.status === 'SKIPPED') {
      return NextResponse.json({
        success: true,
        mode: 'PANIC',
        data: {
          status: 'SKIPPED',
          message: 'You missed your turn.',
          instruction: 'Please contact Reception immediately to re-join.'
        }
      })
    }

    // --- STATE 2: LIVE QUEUE ("Active" Mode) ---
    // (Status is CHECKED_IN or IN_CONSULTATION)
    
    // 1. Get Affiliation to find Slot Duration
    const affiliation = await HospitalAffiliation.findOne({
      doctorId: myAppointment.doctorId._id,
      hospitalId: myAppointment.hospitalId._id
    })
    const slotDuration = affiliation?.slotDuration || 15 // Default 15 mins

    // 2. Find Current Token (Who is with the doctor?)
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    const currentServing = await Appointment.findOne({
      doctorId: myAppointment.doctorId._id,
      hospitalId: myAppointment.hospitalId._id,
      scheduledTime: { $gte: todayStart, $lte: todayEnd },
      status: 'IN_CONSULTATION'
    })

    // If nobody is IN_CONSULTATION, the current token is effectively the last COMPLETED + 1
    let currentToken = 0
    if (currentServing) {
      currentToken = currentServing.tokenNumber
    } else {
       const lastCompleted = await Appointment.findOne({
        doctorId: myAppointment.doctorId._id,
        hospitalId: myAppointment.hospitalId._id,
        scheduledTime: { $gte: todayStart, $lte: todayEnd },
        status: 'COMPLETED'
       }).sort({ tokenNumber: -1 })
       
       currentToken = lastCompleted ? lastCompleted.tokenNumber : 0
       // If 0 completed and 0 in consult, current "serving" is technically 0 (start of day)
    }

    // 3. Calculate Est. Wait Time
    // Wait = (MyToken - CurrentToken) * MinutesPerPatient
    // Note: If I am token 25 and current is 12, I have 12 people ahead of me (13 to 24).
    // If I am IN_CONSULTATION, wait is 0.
    
    let estWaitMins = 0
    if (myAppointment.status === 'CHECKED_IN') {
      const tokensAhead = (myAppointment.tokenNumber - currentToken) - 1
      // If tokensAhead < 0, it means the queue is moving fast or just started.
      // We assume at least 1 slot wait if currentToken is far behind.
      const multiplier = Math.max(0, tokensAhead) 
      estWaitMins = multiplier * slotDuration
    }

    return NextResponse.json({
      success: true,
      mode: 'ACTIVE',
      data: {
        status: myAppointment.status, // CHECKED_IN or IN_CONSULTATION
        myToken: myAppointment.tokenNumber,
        currentToken: currentToken || 'Not Started',
        estWait: `${estWaitMins} Mins`,
        isNext: (myAppointment.tokenNumber - currentToken) === 1, // Trigger "Get Ready" alert
        doctorName: `${myAppointment.doctorId.firstName} ${myAppointment.doctorId.lastName}`,
        hospitalName: myAppointment.hospitalId.name
      }
    })

  } catch (error) {
    console.error('Queue stats error:', error)
    return NextResponse.json({ error: 'Queue error' }, { status: 500 })
  }
}
