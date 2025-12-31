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
    const lat = parseFloat(searchParams.get('lat'))
    const lng = parseFloat(searchParams.get('lng'))
    const radius = parseFloat(searchParams.get('radius')) || 10 // Default 10km
    const limit = parseInt(searchParams.get('limit')) || 10

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coordinates'
      }, { status: 400 })
    }

    // Find nearby hospitals
    const hospitals = await Hospital.find({
      isActive: true,
      'location.coordinates': { $exists: true }
    }).limit(limit * 2) // Get more than needed for filtering

    const hospitalsWithDistance = hospitals
      .map(hospital => {
        if (!hospital.location || !hospital.location.coordinates) return null
        
        const [hosLng, hosLat] = hospital.location.coordinates
        const distance = calculateDistance(lat, lng, hosLat, hosLng)
        
        if (distance > radius) return null

        return {
          id: hospital._id.toString(),
          type: 'hospital',
          name: hospital.name,
          city: hospital.city,
          state: hospital.state,
          address: hospital.address,
          image: hospital.logo,
          logo: hospital.logo,
          rating: hospital.rating || 0,
          totalReviews: hospital.totalReviews || 0,
          totalDoctors: hospital.totalDoctors || 0,
          specialties: hospital.specialties || [],
          services: hospital.services || [],
          phone: hospital.contactNumber,
          email: hospital.email,
          distance: distance,
          location: {
            latitude: hosLat,
            longitude: hosLng
          }
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    // Find nearby doctors from User model with role 'doctor'
    const doctors = await User.find({
      role: 'doctor',
      'doctorProfile.isAvailable': true,
      'doctorProfile.location.coordinates': { $exists: true }
    })
      .select('firstName lastName email phone profileImage doctorProfile shortId')
      .populate('doctorProfile.affiliatedHospitals', 'name logo')
      .limit(limit * 2)

    const doctorsWithDistance = doctors
      .map(user => {
        if (!user.doctorProfile || !user.doctorProfile.location || !user.doctorProfile.location.coordinates) return null
        
        const [docLng, docLat] = user.doctorProfile.location.coordinates
        const distance = calculateDistance(lat, lng, docLat, docLng)
        
        if (distance > radius) return null

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
          
          // Doctor Profile
          specialization: user.doctorProfile.specialization || 'General Medicine',
          qualification: user.doctorProfile.qualification || '',
          qualifications: user.doctorProfile.qualifications || [],
          experience: user.doctorProfile.experience || 0,
          consultationFee: user.doctorProfile.consultationFee || 0,
          about: user.doctorProfile.about || '',
          languages: user.doctorProfile.languages || [],
          expertise: user.doctorProfile.expertise || [],
          
          // Availability
          isAvailable: user.doctorProfile.isAvailable || false,
          availableDays: user.doctorProfile.availableDays || [],
          
          // Ratings
          rating: user.doctorProfile.rating || 0,
          totalReviews: user.doctorProfile.totalReviews || 0,
          
          // Hospital
          affiliatedHospitals: user.doctorProfile.affiliatedHospitals || [],
          consultationRoomNumber: user.doctorProfile.consultationRoomNumber || '',
          
          // Online
          isOnlineConsultationAvailable: user.doctorProfile.isOnlineConsultationAvailable || false,
          videoConsultationFee: user.doctorProfile.videoConsultationFee || 0,
          
          // Distance
          distance: distance,
          location: {
            latitude: docLat,
            longitude: docLng
          }
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      results: {
        doctors: doctorsWithDistance,
        hospitals: hospitalsWithDistance
      },
      location: {
        latitude: lat,
        longitude: lng,
        radius: radius
      }
    })

  } catch (error) {
    console.error('Nearby search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}
