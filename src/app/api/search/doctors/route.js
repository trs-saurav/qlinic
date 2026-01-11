import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import { auth } from '@/auth'

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const specialization = searchParams.get('specialization')
    const limit = parseInt(searchParams.get('limit') || '20')

    await connectDB()

    // If query is empty, return empty array
    if (!query.trim()) {
      return NextResponse.json({ doctors: [] }, { status: 200 })
    }

    // Build search filter
    const filter = {
      role: 'doctor',
      isActive: true,
    }

    // Check if query is exactly 8 chars (potential short ID search)
    if (query.length === 8) {
      const allDoctors = await User.find(filter)
        .select('firstName lastName email profileImage doctorProfile')
        .lean()

      // Filter by shortId (last 8 chars of _id)
      const matchingDoctors = allDoctors.filter(doc => 
        doc._id.toString().slice(-8).toUpperCase() === query.toUpperCase()
      )
      
      if (matchingDoctors.length > 0) {
        // Add shortId virtual field manually
        const doctorsWithShortId = matchingDoctors.map(doc => ({
          ...doc,
          shortId: doc._id.toString().slice(-8).toUpperCase()
        }))
        return NextResponse.json({ doctors: doctorsWithShortId }, { status: 200 })
      }
    }

    // Regular text search
    filter.$or = [
      { email: new RegExp(query, 'i') },
      { firstName: new RegExp(query, 'i') },
      { lastName: new RegExp(query, 'i') },
      { 'doctorProfile.specialization': new RegExp(query, 'i') },
      { 'doctorProfile.qualification': new RegExp(query, 'i') },
    ]

    if (specialization) {
      filter['doctorProfile.specialization'] = new RegExp(specialization, 'i')
    }

    const doctors = await User.find(filter)
      .select('firstName lastName email profileImage doctorProfile')
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()

    // Add shortId to each doctor
    const doctorsWithShortId = doctors.map(doc => ({
      ...doc,
      shortId: doc._id.toString().slice(-8).toUpperCase()
    }))

    return NextResponse.json({ doctors: doctorsWithShortId }, { status: 200 })
  } catch (error) {
    console.error('Search doctors error:', error)
    return NextResponse.json({ error: 'Failed to search doctors' }, { status: 500 })
  }
}