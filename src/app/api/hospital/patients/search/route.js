import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import { requireRole } from '@/lib/apiAuth'

export async function GET(req) {
  try {
    // 1. Auth Check
    const gate = await requireRole(['hospital_admin', 'doctor', 'staff'])
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    await connectDB()

    // 2. Parse Query
    const url = new URL(req.url)
    const phoneQuery = url.searchParams.get('phone')

    if (!phoneQuery || phoneQuery.length < 3) {
      return NextResponse.json({ error: 'Phone number must be at least 3 characters' }, { status: 400 })
    }

    // 3. Search Logic (Partial Match)
    // We use a regex to find any user whose phoneNumber CONTAINS the search string
    const patient = await User.findOne({
      role: 'user', // Ensure we only find patients
      phoneNumber: { $regex: phoneQuery, $options: 'i' } 
    }).select('firstName lastName phoneNumber email gender age') 
    // ^ Select only necessary fields to return

    if (!patient) {
      return NextResponse.json({ patient: null, message: 'No patient found' })
    }

    return NextResponse.json({ 
      success: true, 
      patient: patient 
    })

  } catch (error) {
    console.error('Patient Search Error:', error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}
