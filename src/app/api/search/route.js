import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Hospital from '@/models/hospital'
import User from '@/models/user'

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')) : null
    const limit = parseInt(searchParams.get('limit')) || 10

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 2 characters'
      }, { status: 400 })
    }

    const searchRegex = new RegExp(query.trim(), 'i')
    let results = { doctors: [], hospitals: [] }

    // Search Doctors (from User model with role 'doctor')
    if (type === 'all' || type === 'doctors') {
      const doctorQuery = {
        role: 'doctor',
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { 'doctorProfile.specialization': searchRegex },
          { 'doctorProfile.qualification': searchRegex },
          { 'doctorProfile.qualifications': searchRegex },
          { 'doctorProfile.about': searchRegex },
          { 'doctorProfile.languages': searchRegex },
          { 'doctorProfile.expertise': searchRegex },
          { 'doctorProfile.licenseNumber': searchRegex },
          { 'doctorProfile.registrationNumber': searchRegex }
        ]
      }

      const doctors = await User.find(doctorQuery)
        .select('firstName lastName email phone profileImage doctorProfile shortId')
        .populate('doctorProfile.affiliatedHospitals', 'name logo city')
        .limit(limit)
        .lean()

      results.doctors = doctors
        .map(user => {
          // Skip if no doctorProfile
          if (!user.doctorProfile) return null

          let distance = null

          // Calculate distance if location provided
          if (lat && lng && user.doctorProfile.location?.coordinates) {
            const [docLng, docLat] = user.doctorProfile.location.coordinates
            distance = calculateDistance(lat, lng, docLat, docLng)
            
            // Filter by radius if specified
            if (radius && distance > radius) return null
          }

          return {
            id: user._id.toString(),
            type: 'doctor',
            shortId: user.shortId,
            name: `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim(),
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            profileImage: user.profileImage,
            image: user.profileImage,
            email: user.email,
            phone: user.phone,
            
            // Doctor Profile Fields
            specialization: user.doctorProfile.specialization || 'General Medicine',
            qualification: user.doctorProfile.qualification || '',
            qualifications: user.doctorProfile.qualifications || [],
            experience: user.doctorProfile.experience || 0,
            licenseNumber: user.doctorProfile.licenseNumber || '',
            registrationNumber: user.doctorProfile.registrationNumber || '',
            registrationCouncil: user.doctorProfile.registrationCouncil || '',
            consultationFee: user.doctorProfile.consultationFee || 0,
            about: user.doctorProfile.about || '',
            languages: user.doctorProfile.languages || [],
            expertise: user.doctorProfile.expertise || [],
            awards: user.doctorProfile.awards || [],
            publications: user.doctorProfile.publications || [],
            
            // Availability
            availableDays: user.doctorProfile.availableDays || [],
            timeSlots: user.doctorProfile.timeSlots || [],
            isAvailable: user.doctorProfile.isAvailable || false,
            
            // Ratings & Stats
            rating: user.doctorProfile.rating || 0,
            totalReviews: user.doctorProfile.totalReviews || 0,
            totalConsultations: user.doctorProfile.totalConsultations || 0,
            
            // Hospital Affiliation
            affiliatedHospitals: user.doctorProfile.affiliatedHospitals || [],
            consultationRoomNumber: user.doctorProfile.consultationRoomNumber || '',
            
            // Online Consultation
            isOnlineConsultationAvailable: user.doctorProfile.isOnlineConsultationAvailable || false,
            videoConsultationFee: user.doctorProfile.videoConsultationFee || 0,
            
            // Location
            distance: distance,
            location: user.doctorProfile.location ? {
              latitude: user.doctorProfile.location.coordinates[1],
              longitude: user.doctorProfile.location.coordinates[0]
            } : null
          }
        })
        .filter(Boolean)

      // Sort by distance if location provided
      if (lat && lng) {
        results.doctors.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
      } else {
        // Sort by rating if no location
        results.doctors.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      }
    }

    // Search Hospitals
    if (type === 'all' || type === 'hospitals') {
      const hospitalQuery = {
        isActive: true,
        $or: [
          { name: searchRegex },
          { city: searchRegex },
          { state: searchRegex },
          { address: searchRegex },
          { specialties: searchRegex },
          { services: searchRegex },
          { description: searchRegex }
        ]
      }

      const hospitals = await Hospital.find(hospitalQuery)
        .limit(limit)
        .lean()

      results.hospitals = hospitals
        .map(hospital => {
          let distance = null

          // Calculate distance if location provided
          if (lat && lng && hospital.location?.coordinates) {
            const [hosLng, hosLat] = hospital.location.coordinates
            distance = calculateDistance(lat, lng, hosLat, hosLng)
            
            // Filter by radius if specified
            if (radius && distance > radius) return null
          }

          return {
            id: hospital._id.toString(),
            type: 'hospital',
            name: hospital.name,
            address: hospital.address,
            city: hospital.city,
            state: hospital.state,
            pincode: hospital.pincode,
            image: hospital.logo,
            logo: hospital.logo,
            rating: hospital.rating || 0,
            totalReviews: hospital.totalReviews || 0,
            totalDoctors: hospital.totalDoctors || 0,
            specialties: hospital.specialties || [],
            services: hospital.services || [],
            phone: hospital.contactNumber,
            email: hospital.email,
            website: hospital.website,
            description: hospital.description,
            distance: distance,
            location: hospital.location ? {
              latitude: hospital.location.coordinates[1],
              longitude: hospital.location.coordinates[0]
            } : null
          }
        })
        .filter(Boolean)

      // Sort by distance if location provided
      if (lat && lng) {
        results.hospitals.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
      } else {
        // Sort by rating if no location
        results.hospitals.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      }
    }

    return NextResponse.json({
      success: true,
      results: results,
      query: query,
      totalResults: results.doctors.length + results.hospitals.length,
      filters: {
        type: type,
        location: lat && lng ? { latitude: lat, longitude: lng } : null,
        radius: radius
      }
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}
