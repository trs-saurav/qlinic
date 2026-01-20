import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Hospital from '@/models/hospital'
import User from '@/models/user'

// Force dynamic to ensure search params are always fresh
export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    
    // Parse Location Params
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null
    const radius = parseFloat(searchParams.get('radius')) || 20 // Default 20km for general text search
    const limit = parseInt(searchParams.get('limit')) || 10

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 2 characters'
      }, { status: 400 })
    }

    const searchRegex = new RegExp(query.trim(), 'i')
    const maxDistanceMeters = radius * 1000
    
    let results = { doctors: [], hospitals: [] }

    // --- 1. OPTIMIZED HOSPITAL SEARCH ---
    if (type === 'all' || type === 'hospitals') {
      const hospitalQuery = {
        isActive: true,
        $or: [
          { name: searchRegex },
          { 'address.city': searchRegex },
          { specialties: searchRegex },
          { services: searchRegex }
        ]
      }

      // ✅ optimization: If lat/lng provided, MongoDB filters by distance automatically
      if (lat && lng) {
        hospitalQuery.location = {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: maxDistanceMeters
          }
        }
      }

      const hospitals = await Hospital.find(hospitalQuery)
        .select('name address city state logo rating totalReviews specialties location')
        .limit(limit)
        .lean()

      results.hospitals = hospitals.map(h => ({
        id: h._id.toString(),
        type: 'hospital',
        name: h.name,
        city: h.address?.city || h.city,
        state: h.address?.state || h.state,
        address: h.address,
        logo: h.logo,
        rating: h.rating || 0,
        totalReviews: h.totalReviews || 0,
        specialties: h.specialties || [],
        // Calculate display distance
        distance: (lat && lng && h.location?.coordinates) 
          ? calculateDistance(lat, lng, h.location.coordinates[1], h.location.coordinates[0]) 
          : null
      }))
    }

    // --- 2. SEARCH DOCTORS ---
    if (type === 'all' || type === 'doctors') {
      const doctorQuery = {
        role: 'doctor',
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { 'doctorProfile.specialization': searchRegex }
        ]
      }

      // Fetch doctors matching the text query
      const doctors = await User.find(doctorQuery)
        .select('firstName lastName email profileImage doctorProfile')
        .limit(limit * 2) // Fetch extra to allow for manual distance filtering if needed
        .lean()

      const processedDoctors = doctors.map(d => {
        const docLoc = d.doctorProfile?.location?.coordinates
        let distance = null

        if (lat && lng && docLoc) {
          distance = calculateDistance(lat, lng, docLoc[1], docLoc[0])
        }

        // If user wants distance filtering, exclude far doctors
        if (lat && lng && distance !== null && distance > radius) {
          return null
        }

        return {
          id: d._id.toString(),
          type: 'doctor',
          name: `Dr. ${d.firstName} ${d.lastName}`,
          specialization: d.doctorProfile?.specialization || 'General',
          image: d.profileImage,
          rating: d.doctorProfile?.rating || 0,
          experience: d.doctorProfile?.experience || 0,
          distance: distance
        }
      })
      .filter(Boolean) // Remove nulls
      .sort((a, b) => {
        // Sort by distance if available, otherwise by rating
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance
        return b.rating - a.rating
      })
      .slice(0, limit)

      results.doctors = processedDoctors
    }

    return NextResponse.json({
      success: true,
      results: results,
      count: results.doctors.length + results.hospitals.length
    })

  } catch (error) {
    console.error('Search API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 })
  }
}

// Helper: Haversine Formula (Used for display distance calculation)
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 6371 // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return parseFloat((R * c).toFixed(1))
}