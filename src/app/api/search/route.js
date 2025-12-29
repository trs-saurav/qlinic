// app/api/search/route.js - FIXED VERSION
import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import Hospital from '@/models/hospital'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim() || ''
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit')) || 10
    const lat = parseFloat(searchParams.get('lat'))
    const lng = parseFloat(searchParams.get('lng'))
    const radius = parseFloat(searchParams.get('radius')) || 20

    // Return empty results if no query
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: { doctors: [], hospitals: [] }
      })
    }

    await connectDB()

    const regex = new RegExp(query, 'i')
    const results = { doctors: [], hospitals: [] }

    // Parallel search for better performance
    const searchPromises = []

    // Search Doctors
    if (type === 'all' || type === 'doctors') {
      searchPromises.push(
        User.find({
          role: 'doctor',
          isActive: true,
          $or: [
            { firstName: regex },
            { lastName: regex },
            { 'doctorProfile.specialization': regex },
            { 'doctorProfile.expertise': regex },
            { 'doctorProfile.qualifications': regex }
          ]
        })
        .select('firstName lastName email profileImage doctorProfile')
        .populate({
          path: 'doctorProfile.affiliatedHospitals',
          select: 'name address',
          options: { limit: 1 }
        })
        .limit(limit)
        .lean()
        .then(doctors => {
          results.doctors = doctors.map(doc => {
            // Get primary hospital from affiliatedHospitals array
            const hospital = doc.doctorProfile?.affiliatedHospitals?.[0]
            let distance = null

            // Calculate distance using doctor's location
            if (lat && lng && doc.doctorProfile?.location?.coordinates) {
              const [lng2, lat2] = doc.doctorProfile.location.coordinates
              distance = calculateDistance(lat, lng, lat2, lng2)
            }
            // Or use hospital location if doctor location not available
            else if (lat && lng && hospital?.address?.coordinates) {
              distance = calculateDistance(
                lat,
                lng,
                hospital.address.coordinates.latitude,
                hospital.address.coordinates.longitude
              )
            }

            // Skip if outside radius
            if (distance !== null && distance > radius) {
              return null
            }

            return {
              id: doc._id.toString(),
              type: 'doctor',
              name: `Dr. ${doc.firstName} ${doc.lastName}`,
              firstName: doc.firstName,
              lastName: doc.lastName,
              profileImage: doc.profileImage,
              image: doc.profileImage,
              specialization: doc.doctorProfile?.specialization || 'General Physician',
              experience: doc.doctorProfile?.experience || 0,
              consultationFee: doc.doctorProfile?.consultationFee || 500,
              rating: doc.doctorProfile?.rating || 0,
              totalReviews: doc.doctorProfile?.totalReviews || 0,
              availableNow: doc.doctorProfile?.isAvailable || false,
              hospitalName: hospital?.name,
              distance: distance
            }
          }).filter(Boolean)

          // Sort by distance if location provided
          if (lat && lng) {
            results.doctors.sort((a, b) => {
              if (a.distance === null) return 1
              if (b.distance === null) return -1
              return a.distance - b.distance
            })
          } else {
            // Sort by rating if no location
            results.doctors.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          }
        })
      )
    }

    // Search Hospitals
    if (type === 'all' || type === 'hospitals') {
      searchPromises.push(
        Hospital.find({
          isActive: true,
          $or: [
            { name: regex },
            { 'address.city': regex },
            { 'address.state': regex },
            { specialties: regex },
            { type: regex }
          ]
        })
        .select('name logo coverPhoto address contactDetails specialties type rating totalReviews')
        .limit(limit)
        .lean()
        .then(hospitals => {
          results.hospitals = hospitals.map(hosp => {
            let distance = null

            // Calculate distance if location provided
            if (lat && lng && hosp.address?.coordinates) {
              distance = calculateDistance(
                lat,
                lng,
                hosp.address.coordinates.latitude,
                hosp.address.coordinates.longitude
              )
            }

            // Skip if outside radius
            if (distance !== null && distance > radius) {
              return null
            }

            return {
              id: hosp._id.toString(),
              type: 'hospital',
              name: hosp.name,
              logo: hosp.logo,
              image: hosp.logo || hosp.coverPhoto,
              city: hosp.address?.city || '',
              state: hosp.address?.state || '',
              rating: hosp.rating || 0,
              totalReviews: hosp.totalReviews || 0,
              specialties: hosp.specialties || [],
              distance: distance
            }
          }).filter(Boolean)

          // Sort by distance if location provided
          if (lat && lng) {
            results.hospitals.sort((a, b) => {
              if (a.distance === null) return 1
              if (b.distance === null) return -1
              return a.distance - b.distance
            })
          } else {
            // Sort by rating if no location
            results.hospitals.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          }
        })
      )
    }

    // Wait for all searches to complete
    await Promise.all(searchPromises)

    return NextResponse.json({
      success: true,
      query,
      results,
      total: {
        doctors: results.doctors.length,
        hospitals: results.hospitals.length,
        all: results.doctors.length + results.hospitals.length
      }
    })

  } catch (error) {
    console.error('❌ Search API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Search failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 10) / 10
}

function toRad(degrees) {
  return degrees * (Math.PI / 180)
}
