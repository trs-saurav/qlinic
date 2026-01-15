import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import { adminDb } from '@/config/firebaseAdmin' // Import Firebase Admin
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

    // ---------------------------------------------------------
    // 3. FIREBASE SYNC: Notify Doctor's Dashboard
    // ---------------------------------------------------------
    // We update 'lastUpdated' timestamp in Firebase. 
    // This forces the doctor's 'useRealtimeQueue' hook to re-fetch or notice a change.
    // We do NOT need to write the whole appointment data, just a signal.
    
    const hospitalId = appointment.hospitalId.toString();
    const doctorId = appointment.doctorId.toString();

    if (hospitalId && doctorId) {
       try {
          const queueRef = adminDb.ref(`queues/${hospitalId}/${doctorId}`);
          
          // We just touch the timestamp. The frontend will likely re-fetch the list 
          // via MongoDB based on this signal, OR simply see the count increase if you sync counts.
          // For now, let's update 'lastUpdated'.
          await queueRef.update({
             lastUpdated: Date.now()
          });
       } catch (fbError) {
          console.error('Firebase Sync Error on Check-in:', fbError);
          // Don't fail the request if Firebase fails, just log it.
       }
    }
    // ---------------------------------------------------------

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
