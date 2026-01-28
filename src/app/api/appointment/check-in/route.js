import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import { adminDb } from '@/config/firebaseAdmin' 
import { startOfDay, endOfDay } from 'date-fns'

export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()
    const { appointmentId, vitals, paymentStatus } = body 

    console.log('🔍 Check-in Request:', { appointmentId, paymentStatus })

    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

    // Only allow check-in if currently BOOKED
    if (appointment.status !== 'BOOKED') {
      return NextResponse.json({ error: `Cannot check in. Current status: ${appointment.status}` }, { status: 400 })
    }

    // ============================================================
    // 1. GENERATE TOKEN (Arrival Order)
    // ============================================================
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    // Find the last assigned token for this doctor & hospital today
    const lastTokenAppt = await Appointment.findOne({
      hospitalId: appointment.hospitalId,
      doctorId: appointment.doctorId,
      scheduledTime: { $gte: todayStart, $lte: todayEnd },
      tokenNumber: { $ne: null } 
    }).sort({ tokenNumber: -1 })

    const nextToken = (lastTokenAppt?.tokenNumber || 0) + 1

    // ============================================================
    // 2. UPDATE APPOINTMENT DETAILS
    // ============================================================
    appointment.status = 'CHECKED_IN'
    appointment.tokenNumber = nextToken
    appointment.checkInTime = new Date()
    
    // ✅ HANDLE VITALS
    if (vitals) {
      // We explicitly convert to strings to match Schema and avoid NaN issues
      appointment.vitals = {
        temperature: vitals.temperature?.toString() || '',
        weight: vitals.weight?.toString() || '',
        bpSystolic: vitals.bpSystolic?.toString() || '',
        bpDiastolic: vitals.bpDiastolic?.toString() || '',
        spo2: vitals.spo2?.toString() || '',
        heartRate: vitals.heartRate?.toString() || ''
      };
      appointment.markModified('vitals');
    }
    
    // ✅ HANDLE PAYMENT STATUS
    // Critical: Convert to Uppercase to match Mongoose Enum ['PENDING', 'PAID', 'REFUNDED']
    if (paymentStatus) {
      appointment.paymentStatus = paymentStatus.toUpperCase();
    }
    
    await appointment.save()
    console.log(`✅ Checked In: Token #${nextToken}, Payment: ${appointment.paymentStatus}`)

    // ============================================================
    // 3. FIREBASE SYNC (Notify Doctor)
    // ============================================================
    const hospitalId = appointment.hospitalId.toString();
    const doctorId = appointment.doctorId.toString();

    if (hospitalId && doctorId) {
       try {
          // Touching 'lastUpdated' forces the doctor's queue to refresh
          const queueRef = adminDb.ref(`queues/${hospitalId}/${doctorId}`);
          await queueRef.update({ lastUpdated: Date.now() });
       } catch (fbError) {
          console.error('⚠️ Firebase Sync Error:', fbError);
       }
    }

    return NextResponse.json({ 
      success: true, 
      tokenNumber: nextToken,
      status: 'CHECKED_IN',
      appointment: appointment.toObject() 
    })

  } catch (error) {
    console.error('❌ Check-in Error:', error)
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 })
  }
}
