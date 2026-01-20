import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Hospital from '@/models/hospital'
import User from '@/models/user'

export const dynamic = 'force-dynamic' // Ensure this doesn't get cached incorrectly

export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get('lat'))
    const lng = parseFloat(searchParams.get('lng'))
    const radius = parseFloat(searchParams.get('radius')) || 10 // km
    const limit = parseInt(searchParams.get('limit')) || 10

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ success: false, error: 'Invalid coordinates' }, { status: 400 })
    }

    // Convert Radius (km) to Meters for MongoDB
    const maxDistanceMeters = radius * 1000

    // 1. FAST Search: Hospitals using MongoDB $near
    // This leverages the '2dsphere' index on the 'location' field we added to the model
    const hospitals = await Hospital.find({
      isActive: true,
      'location': {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxDistanceMeters
        }
      }
    })
    .select('name address city state logo rating totalReviews totalDoctors specialties contactDetails location slug') // Select only needed fields
    .limit(limit)

    // Format Hospital Data for UI
    const formattedHospitals = hospitals.map(h => {
      // Calculate distance for display (optional, but helpful for UI)
      // Since $near already sorted them by distance, we just recalculate roughly for the badge
      const distanceKm = calculateDistance(lat, lng, h.location.coordinates[1], h.location.coordinates[0]);
      
      return {
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
        phone: h.contactDetails?.phone || '',
        distance: distanceKm,
        location: {
          latitude: h.location.coordinates[1],
          longitude: h.location.coordinates[0]
        }
      }
    })

    // 2. FAST Search: Doctors
    // Assuming User model has a similar 'doctorProfile.location' GeoJSON structure
    // If not, we fallback to finding all active doctors and filtering (hybrid approach)
    let doctors = []
    try {
      doctors = await User.find({
        role: 'doctor',
        'doctorProfile.isAvailable': true,
        // Attempt to use geospatial query if index exists
        'doctorProfile.location': {
           $near: {
             $geometry: { type: 'Point', coordinates: [lng, lat] },
             $maxDistance: maxDistanceMeters
           }
        }
      })
      .select('firstName lastName email phone profileImage doctorProfile shortId')
      .limit(limit)
    } catch (err) {
      // Fallback: If Doctor model doesn't have 2dsphere index yet, standard find + filter
      console.warn("Doctor geospatial index missing, falling back to manual filter")
      const allDoctors = await User.find({
        role: 'doctor',
        'doctorProfile.isAvailable': true,
        'doctorProfile.location.coordinates': { $exists: true }
      }).limit(100) // Safety limit

      doctors = allDoctors.filter(doc => {
        const [dLng, dLat] = doc.doctorProfile.location.coordinates;
        return calculateDistance(lat, lng, dLat, dLng) <= radius;
      }).slice(0, limit);
    }

    const formattedDoctors = doctors.map(user => {
      const [docLng, docLat] = user.doctorProfile?.location?.coordinates || [0,0];
      const dist = calculateDistance(lat, lng, docLat, docLng);

      return {
        id: user._id.toString(),
        type: 'doctor',
        name: `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim(),
        image: user.profileImage,
        specialization: user.doctorProfile?.specialization || 'General',
        experience: user.doctorProfile?.experience || 0,
        rating: user.doctorProfile?.rating || 0,
        consultationFee: user.doctorProfile?.consultationFee || 0,
        hospitalName: user.doctorProfile?.affiliatedHospitals?.[0]?.name || '', // simplified
        availableNow: true, // You can add real logic here
        distance: dist
      }
    })

    return NextResponse.json({
      success: true,
      results: {
        doctors: formattedDoctors,
        hospitals: formattedHospitals
      },
      location: { latitude: lat, longitude: lng }
    })

  } catch (error) {
    console.error('❌ Nearby API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error' 
    }, { status: 500 })
  }
}

// Helper: Haversine Formula (Only used for display distance calculation now, not filtering)
function calculateDistance(lat1, lon1, lat2, lon2) {
  if ((lat1 == lat2) && (lon1 == lon2)) return 0;
  const radlat1 = Math.PI * lat1 / 180;
  const radlat2 = Math.PI * lat2 / 180;
  const theta = lon1 - lon2;
  const radtheta = Math.PI * theta / 180;
  let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) dist = 1;
  dist = Math.acos(dist);
  dist = dist * 180 / Math.PI;
  dist = dist * 60 * 1.1515;
  dist = dist * 1.609344; // Convert to Kilometers
  return dist;
}