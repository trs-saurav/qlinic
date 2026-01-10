import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import { startOfDay, endOfDay } from 'date-fns'

export async function POST(req) {
  // Note: This endpoint is usually called by the Receptionist or Kiosk
  await connectDB()
  const { appointmentId } = await req.json()

  try {
    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

    // Only allow check-in if currently BOOKED
    if (appointment.status !== 'BOOKED') {
      return NextResponse.json({ error: `Cannot check in. Current status: ${appointment.status}` }, { status: 400 })
    }

    // 1. GENERATE TOKEN (The "Arrival-Based" Logic)
    // Find the highest token number assigned TODAY for this doctor+hospital
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    const lastTokenAppt = await Appointment.findOne({
      hospitalId: appointment.hospitalId,
      doctorId: appointment.doctorId,
      scheduledTime: { $gte: todayStart, $lte: todayEnd },
      tokenNumber: { $ne: null } // Only count appointments that have tokens
    }).sort({ tokenNumber: -1 }) // Get the highest one

    const nextToken = (lastTokenAppt?.tokenNumber || 0) + 1

    // 2. Update Appointment
    appointment.status = 'CHECKED_IN' // <--- Triggers State 2
    appointment.tokenNumber = nextToken
    appointment.checkInTime = new Date()
    
    await appointment.save()

    return NextResponse.json({ 
      success: true, 
      tokenNumber: nextToken,
      status: 'CHECKED_IN',
      message: `Checked in successfully. Your Token is #${nextToken}`
    })

  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 })
  }
}
