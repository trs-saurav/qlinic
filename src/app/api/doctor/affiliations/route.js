// app/api/doctor/affiliations/route.js
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { NextResponse } from 'next/server'

// GET - Fetch all affiliations and pending requests
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

    // Fetch accepted affiliations
    const affiliations = await HospitalAffiliation.find({
      doctorId: doctor._id,
      status: 'accepted'
    }).populate('hospitalId', 'name address phone email')

    // Fetch pending requests
    const pendingRequests = await HospitalAffiliation.find({
      doctorId: doctor._id,
      status: 'pending'
    }).populate('hospitalId', 'name address phone email')

    return NextResponse.json({
      success: true,
      affiliations,
      pendingRequests
    })
  } catch (error) {
    console.error('Error fetching affiliations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
