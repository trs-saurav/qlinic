import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import { adminDb } from '@/config/firebaseAdmin' // Import Firebase Admin
import { startOfDay, endOfDay } from 'date-fns'

export async function POST(req) {
  // Note: This endpoint is usually called by the Receptionist or Kiosk
  await connectDB()
  const body = await req.json()
  const { appointmentId, vitals, paymentStatus } = body  // Added vitals and paymentStatus

  console.log('🔍 Check-in API received:', { appointmentId, vitals, paymentStatus })

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
    
    // Save vitals if provided - ensure proper type conversion for String fields
    if (vitals) {
      console.log('📝 Processing vitals:', vitals)
      console.log('📋 Original appointment vitals:', appointment.vitals)
      
      const processedVitals = {};
      
      // Convert numeric values to strings as expected by the schema
      if (vitals.temperature !== undefined && vitals.temperature !== null && vitals.temperature !== '') {
        const temp = parseFloat(vitals.temperature)
        if (!isNaN(temp)) {
          processedVitals.temperature = temp.toString();
          console.log('🌡️ Setting temperature:', processedVitals.temperature)
        } else if (typeof vitals.temperature === 'string') {
          processedVitals.temperature = vitals.temperature; // Use as-is if it's already a string
          console.log('🌡️ Using temperature as string:', processedVitals.temperature)
        }
      }
      if (vitals.weight !== undefined && vitals.weight !== null && vitals.weight !== '') {
        const weight = parseFloat(vitals.weight)
        if (!isNaN(weight)) {
          processedVitals.weight = weight.toString();
          console.log('⚖️ Setting weight:', processedVitals.weight)
        } else if (typeof vitals.weight === 'string') {
          processedVitals.weight = vitals.weight; // Use as-is if it's already a string
          console.log('⚖️ Using weight as string:', processedVitals.weight)
        }
      }
      if (vitals.bpSystolic !== undefined && vitals.bpSystolic !== null && vitals.bpSystolic !== '') {
        const bpSys = parseFloat(vitals.bpSystolic)
        if (!isNaN(bpSys)) {
          processedVitals.bpSystolic = bpSys.toString();
          console.log('🩸 Setting bpSystolic:', processedVitals.bpSystolic)
        } else if (typeof vitals.bpSystolic === 'string') {
          processedVitals.bpSystolic = vitals.bpSystolic; // Use as-is if it's already a string
          console.log('🩸 Using bpSystolic as string:', processedVitals.bpSystolic)
        }
      }
      if (vitals.bpDiastolic !== undefined && vitals.bpDiastolic !== null && vitals.bpDiastolic !== '') {
        const bpDia = parseFloat(vitals.bpDiastolic)
        if (!isNaN(bpDia)) {
          processedVitals.bpDiastolic = bpDia.toString();
          console.log('🩸 Setting bpDiastolic:', processedVitals.bpDiastolic)
        } else if (typeof vitals.bpDiastolic === 'string') {
          processedVitals.bpDiastolic = vitals.bpDiastolic; // Use as-is if it's already a string
          console.log('🩸 Using bpDiastolic as string:', processedVitals.bpDiastolic)
        }
      }
      if (vitals.spo2 !== undefined && vitals.spo2 !== null && vitals.spo2 !== '') {
        const spo2 = parseFloat(vitals.spo2)
        if (!isNaN(spo2)) {
          processedVitals.spo2 = spo2.toString();
          console.log('🫁 Setting spo2:', processedVitals.spo2)
        } else if (typeof vitals.spo2 === 'string') {
          processedVitals.spo2 = vitals.spo2; // Use as-is if it's already a string
          console.log('🫁 Using spo2 as string:', processedVitals.spo2)
        }
      }
      if (vitals.heartRate !== undefined && vitals.heartRate !== null && vitals.heartRate !== '') {
        const hr = parseFloat(vitals.heartRate)
        if (!isNaN(hr)) {
          processedVitals.heartRate = hr.toString();
          console.log('❤️ Setting heartRate:', processedVitals.heartRate)
        } else if (typeof vitals.heartRate === 'string') {
          processedVitals.heartRate = vitals.heartRate; // Use as-is if it's already a string
          console.log('❤️ Using heartRate as string:', processedVitals.heartRate)
        }
      }
      
      console.log('📋 Processed vitals keys:', Object.keys(processedVitals))
      console.log('📋 Processed vitals object:', processedVitals)
      
      // Always update vitals - even if processedVitals is empty, use original vitals
      appointment.vitals = {
        ...appointment.vitals, // Preserve any existing vitals
        ...processedVitals,    // Add processed values
        ...vitals              // Add original values (will override processed if conflicts)
      };
      
      console.log('📋 Final vitals object to save:', appointment.vitals)
      appointment.markModified('vitals'); // Ensure Mongoose knows the vitals object was modified
    } else {
      console.log('⚠️ No vitals provided')
    }
    
    // Save payment status if provided
    if (paymentStatus) {
      appointment.paymentStatus = paymentStatus;
    }
    
    console.log('💾 About to save appointment with vitals:', appointment.vitals);
    await appointment.save()
    console.log('💾 Appointment saved successfully with ID:', appointment._id)
    console.log('✅ Final appointment vitals after save:', appointment.vitals)

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

    console.log('✅ Check-in completed successfully')
    return NextResponse.json({ 
      success: true, 
      tokenNumber: nextToken,
      status: 'CHECKED_IN',
      message: `Checked in successfully. Your Token is #${nextToken}`,
      appointment: appointment.toObject()  // Return updated appointment with vitals
    })

  } catch (error) {
    console.error('❌ Check-in error:', error)
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 })
  }
}