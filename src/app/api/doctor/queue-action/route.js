// src/app/api/doctor/queue-action/route.js
import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import { requireRole } from '@/lib/apiAuth'

export async function POST(req) {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  await connectDB()
  
  try {
    const { appointmentId, action, notes } = await req.json()

    if (!appointmentId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const appointment = await Appointment.findById(appointmentId)
    
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Verify this appointment belongs to the logged-in doctor
    if (appointment.doctorId.toString() !== gate.me._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized to modify this appointment' }, { status: 403 })
    }

    const timestamp = new Date()

    switch (action) {
      case 'START_CONSULTATION':
        if (appointment.status !== 'CHECKED_IN') {
          return NextResponse.json({ error: 'Patient must be CHECKED_IN first' }, { status: 400 })
        }
        appointment.status = 'IN_CONSULTATION'
        appointment.consultationStartTime = timestamp
        break

      case 'COMPLETE':
        if (appointment.status !== 'IN_CONSULTATION') {
          return NextResponse.json({ error: 'Consultation must be active to complete' }, { status: 400 })
        }
        appointment.status = 'COMPLETED'
        appointment.consultationEndTime = timestamp
        if (notes) appointment.notes = notes
        break

      case 'SKIP':
        // Can skip from booked, checked_in, or in_consultation
        appointment.status = 'SKIPPED'
        appointment.notes = notes || 'Skipped by doctor'
        appointment.cancelledBy = 'doctor'
        appointment.cancelledAt = timestamp
        break
        
      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
    }

    await appointment.save()

    return NextResponse.json({ 
      success: true, 
      appointment,
      message: `Appointment ${action.toLowerCase()} successfully`
    })

  } catch (error) {
    console.error('Queue action error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
