// app/api/appointments/[id]/route.js
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Appointment from '@/models/appointment'
import User from '@/models/user'

export async function GET(req, { params }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params

    const appointment = await Appointment.findById(id)
      .populate('patientId', 'firstName lastName email phoneNumber patientProfile')
      .populate('doctorId', 'firstName lastName doctorProfile')
      .populate('hospitalId', 'name address phone')

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Authorization check
    const isAuthorized = 
      user.role === 'hospital_admin' ||
      (user.role === 'doctor' && appointment.doctorId._id.toString() === user._id.toString()) ||
      (user.role === 'patient' && appointment.patientId._id.toString() === user._id.toString())

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, appointment })
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    const body = await req.json()

    const appointment = await Appointment.findById(id)
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Role-based authorization and updates
    if (user.role === 'hospital_admin') {
      // Hospital admin can update any field
      const allowedUpdates = ['status', 'vitals', 'notes', 'paymentStatus', 'scheduledTime']
      const updates = {}
      
      allowedUpdates.forEach(field => {
        if (body[field] !== undefined) {
          updates[field] = body[field]
        }
      })

      updates.synced = false

      Object.assign(appointment, updates)
      await appointment.save()

    } else if (user.role === 'doctor') {
      // Doctor can update status, vitals, notes
      if (appointment.doctorId.toString() !== user._id.toString()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const allowedUpdates = ['status', 'vitals', 'notes']
      allowedUpdates.forEach(field => {
        if (body[field] !== undefined) {
          appointment[field] = body[field]
        }
      })

      // Add timestamps for status changes
      if (body.status === 'IN_CONSULTATION') {
        appointment.consultationStartTime = new Date()
      } else if (body.status === 'COMPLETED') {
        appointment.consultationEndTime = new Date()
      }

      await appointment.save()

    } else if (user.role === 'patient') {
      // Patient can only cancel
      if (appointment.patientId.toString() !== user._id.toString()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (body.status === 'CANCELLED') {
        appointment.status = 'CANCELLED'
        appointment.cancelledBy = 'patient'
        appointment.cancelledAt = new Date()
        appointment.cancelReason = body.cancelReason
        await appointment.save()
      } else {
        return NextResponse.json({ error: 'Patients can only cancel appointments' }, { status: 403 })
      }
    }

    const updatedAppointment = await Appointment.findById(id)
      .populate('patientId', 'firstName lastName email phoneNumber')
      .populate('doctorId', 'firstName lastName doctorProfile')
      .populate('hospitalId', 'name address phone')

    return NextResponse.json({ success: true, appointment: updatedAppointment })
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only hospital admin can delete appointments
    if (user.role !== 'hospital_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    
    const appointment = await Appointment.findById(id)
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Check if appointment belongs to admin's hospital
    if (appointment.hospitalId.toString() !== user.hospitalAdminProfile.hospitalId.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await Appointment.findByIdAndDelete(id)

    return NextResponse.json({ success: true, message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
