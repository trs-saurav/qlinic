import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import HospitalAffiliation from '@/models/hospitalAffiliation'

export async function POST(req) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { doctorId, hospitalId, scheduledTime, reason, type } = await req.json()

  try {
    // 1. Validate Doctor Availability (Affiliation)
    const affiliation = await HospitalAffiliation.findOne({ 
      doctorId, 
      hospitalId, 
      status: 'APPROVED' 
    })
    
    if (!affiliation) {
      return NextResponse.json({ error: 'Doctor not affiliated with this hospital' }, { status: 400 })
    }

    // 2. Prevent Double Booking for this specific time slot
    const existing = await Appointment.findOne({
      doctorId,
      scheduledTime: new Date(scheduledTime),
      status: { $nin: ['CANCELLED', 'SKIPPED'] }
    })

    if (existing) {
      return NextResponse.json({ error: 'Slot already booked' }, { status: 409 })
    }

    // 3. Create Appointment (NO TOKEN ASSIGNED YET)
    // State 1: Pre-Arrival ("Relax" Mode)
    const newAppointment = await Appointment.create({
      patientId: session.user.id,
      doctorId,
      hospitalId,
      scheduledTime: new Date(scheduledTime),
      status: 'BOOKED', // <--- Triggers State 1
      reason,
      type: type || 'CONSULTATION'
    })

    return NextResponse.json({ 
      success: true, 
      appointmentId: newAppointment._id,
      message: 'Booking confirmed. Token will be assigned upon arrival.' 
    })

  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 })
  }
}
