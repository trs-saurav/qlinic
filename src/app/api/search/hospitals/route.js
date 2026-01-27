import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Hospital from '@/models/hospital'
import { auth } from '@/auth'

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const city = searchParams.get('city')
    const limit = parseInt(searchParams.get('limit') || '20')

    await connectDB()

    // If query is empty, return empty array
    if (!query.trim()) {
      return NextResponse.json({ hospitals: [] }, { status: 200 })
    }

    const filter = {
      isActive: true,
    }

    // Check if query is exactly 8 chars (potential short ID search)
    if (query.length === 8) {
      const allHospitals = await Hospital.find(filter)
        .select('name contactDetails address specialties facilities')
        .lean()

      // Filter by shortId (last 8 chars of _id)
      const matchingHospitals = allHospitals.filter(hosp => 
        hosp._id.toString().slice(-8).toUpperCase() === query.toUpperCase()
      )
      
      if (matchingHospitals.length > 0) {
        // Add shortId virtual field manually
        const hospitalsWithShortId = matchingHospitals.map(hosp => ({
          ...hosp,
          shortId: hosp._id.toString().slice(-8).toUpperCase(),
          email: hosp.contactDetails?.email,
          phone: hosp.contactDetails?.phone,
        }))
        return NextResponse.json({ hospitals: hospitalsWithShortId }, { status: 200 })
      }
    }

    // Regular text search
    filter.$or = [
      { name: new RegExp(query, 'i') },
      { 'contactDetails.email': new RegExp(query, 'i') },
      { 'address.city': new RegExp(query, 'i') },
      { 'address.state': new RegExp(query, 'i') },
      { specialties: new RegExp(query, 'i') },
      { type: new RegExp(query, 'i') },
    ]

    if (city) {
      filter['address.city'] = new RegExp(city, 'i')
    }

    const hospitals = await Hospital.find(filter)
      .select('name contactDetails address specialties facilities type')
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()

    // Add shortId and flatten contactDetails to each hospital
    const hospitalsWithShortId = hospitals.map(hosp => ({
      ...hosp,
      shortId: hosp._id.toString().slice(-8).toUpperCase(),
      email: hosp.contactDetails?.email,
      phone: hosp.contactDetails?.phone,
    }))

    return NextResponse.json({ hospitals: hospitalsWithShortId }, { status: 200 })
  } catch (error) {
    console.error('Search hospitals error:', error)
    return NextResponse.json({ error: 'Failed to search hospitals' }, { status: 500 })
  }
}