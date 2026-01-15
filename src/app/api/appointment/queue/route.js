import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const appointmentId = searchParams.get('appointmentId')
  const doctorId = searchParams.get('doctorId')
  const hospitalId = searchParams.get('hospitalId')

  await connectDB()

  try {
    let myAppointment = null
    
    // 1. Fetch User's Appointment Context (if provided)
    if (appointmentId) {
      myAppointment = await Appointment.findById(appointmentId)
        .populate('doctorId', 'firstName lastName')
        .populate('hospitalId', 'name address')
      
      if (!myAppointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // --- STATE 1: PRE-ARRIVAL ("Relax" Mode) ---
    if (myAppointment && myAppointment.status === 'BOOKED') {
      return NextResponse.json({
        success: true,
        mode: 'RELAX',
        data: {
          status: 'BOOKED',
          message: 'Appointment Confirmed',
          safeArrivalTime: myAppointment.scheduledTime, // Frontend formats this date
          tokenNumber: myAppointment.tokenNumber,
          doctorName: `${myAppointment.doctorId.firstName} ${myAppointment.doctorId.lastName}`,
          hospitalName: myAppointment.hospitalId.name
        }
      })
    }

    // --- STATE 2: SKIPPED ("Panic" Mode) ---
    if (myAppointment && myAppointment.status === 'SKIPPED') {
      return NextResponse.json({
        success: true,
        mode: 'PANIC',
        data: {
          status: 'SKIPPED',
          message: 'You missed your turn.',
          instruction: 'Please contact Reception immediately to re-join.',
          tokenNumber: myAppointment.tokenNumber
        }
      })
    }

    // --- STATE 3: LIVE QUEUE ("Connect" Mode) ---
    // Instead of calculating "current token" here, we return the CONFIG so frontend can listen to Firebase.
    
    const docId = myAppointment ? myAppointment.doctorId._id : doctorId
    const hospId = myAppointment ? myAppointment.hospitalId._id : hospitalId

    if (!docId || !hospId) {
        return NextResponse.json({ error: 'Missing Doctor or Hospital ID' }, { status: 400 })
    }

    // Get Slot Duration for "Wait Time" estimation on frontend
    const affiliation = await HospitalAffiliation.findOne({
      doctorId: docId,
      hospitalId: hospId
    })
    const slotDuration = affiliation?.slotDuration || 15 

    return NextResponse.json({
      success: true,
      mode: 'ACTIVE',
      config: {
        // Frontend will use these IDs to subscribe to: /queues/{hospitalId}/{doctorId}
        doctorId: docId,
        hospitalId: hospId,
        
        // Static info for display
        myToken: myAppointment?.tokenNumber || 0,
        averageConsultTime: slotDuration,
        doctorName: myAppointment ? `${myAppointment.doctorId.firstName} ${myAppointment.doctorId.lastName}` : 'Doctor',
        hospitalName: myAppointment ? myAppointment.hospitalId.name : 'Hospital'
      }
    })

  } catch (error) {
    console.error('Queue Setup API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
