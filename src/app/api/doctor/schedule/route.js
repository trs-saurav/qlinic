// app/api/doctor/schedule/route.js
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import { NextResponse } from 'next/server'

// GET - Fetch doctor's schedule
export async function GET(req) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const doctor = await User.findOne({ clerkId: userId, role: 'doctor' })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    const schedules = doctor.workSchedule || []

    return NextResponse.json({ success: true, schedules })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update doctor's schedule
export async function POST(req) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const doctor = await User.findOne({ clerkId: userId, role: 'doctor' })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    const scheduleData = await req.json()
    const { hospitalId, workingDays } = scheduleData

    if (!hospitalId || !workingDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update or add schedule for this hospital
    const existingScheduleIndex = doctor.workSchedule?.findIndex(
      s => s.hospitalId.toString() === hospitalId
    )

    if (existingScheduleIndex >= 0) {
      doctor.workSchedule[existingScheduleIndex] = { hospitalId, workingDays }
    } else {
      if (!doctor.workSchedule) doctor.workSchedule = []
      doctor.workSchedule.push({ hospitalId, workingDays })
    }

    await doctor.save()

    return NextResponse.json({ success: true, schedules: doctor.workSchedule })
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
