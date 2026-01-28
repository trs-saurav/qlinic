import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import { adminDb } from '@/config/firebaseAdmin' 

// Use PATCH for partial updates
export async function PATCH(req, { params }) {
  try {
    await connectDB()
    
    const { id } = params // Get Appointment ID from URL
    const body = await req.json()
    const { vitals, paymentStatus } = body

    console.log(`🔍 Update Request for ${id}:`, { paymentStatus, vitals })

    const appointment = await Appointment.findById(id)
    
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // ============================================================
    // 1. UPDATE VITALS (Merge Strategy)
    // ============================================================
    if (vitals) {
       appointment.vitals = {
          // Keep existing values
          ...appointment.vitals, 
          // Overwrite with new non-empty string values
          temperature: vitals.temperature?.toString() ?? appointment.vitals?.temperature,
          weight: vitals.weight?.toString() ?? appointment.vitals?.weight,
          bpSystolic: vitals.bpSystolic?.toString() ?? appointment.vitals?.bpSystolic,
          bpDiastolic: vitals.bpDiastolic?.toString() ?? appointment.vitals?.bpDiastolic,
          spo2: vitals.spo2?.toString() ?? appointment.vitals?.spo2,
          heartRate: vitals.heartRate?.toString() ?? appointment.vitals?.heartRate
       }
       appointment.markModified('vitals');
    }

    // ============================================================
    // 2. UPDATE PAYMENT STATUS
    // ============================================================
    if (paymentStatus) {
       // Convert 'paid' -> 'PAID' to satisfy Mongoose Enum validation
       appointment.paymentStatus = paymentStatus.toUpperCase();
    }

    await appointment.save()
    console.log(`✅ Appointment Updated: ${id}`)

    // ============================================================
    // 3. FIREBASE SYNC (Notify Doctor of Changes)
    // ============================================================
    const hospitalId = appointment.hospitalId?.toString();
    const doctorId = appointment.doctorId?.toString();

    if (hospitalId && doctorId) {
       try {
          const queueRef = adminDb.ref(`queues/${hospitalId}/${doctorId}`);
          await queueRef.update({ lastUpdated: Date.now() });
       } catch (e) {
          console.error('⚠️ Firebase sync error:', e)
       }
    }

    return NextResponse.json({ 
      success: true, 
      appointment 
    })

  } catch (error) {
    console.error('❌ Update Error:', error)
    return NextResponse.json({ 
        error: error.message || 'Update failed' 
    }, { status: 500 })
  }
}
