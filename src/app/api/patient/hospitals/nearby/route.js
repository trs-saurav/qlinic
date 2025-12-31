import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import  connectDB  from '@/config/db'
import Hospital from '@/models/hospital'

export async function GET(req) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const latitude = parseFloat(searchParams.get('latitude') || '0')
    const longitude = parseFloat(searchParams.get('longitude') || '0')
    const maxDistance = parseInt(searchParams.get('maxDistance') || '10000') // in meters
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!latitude || !longitude) {
      return NextResponse.json({ 
        error: 'Latitude and longitude are required' 
      }, { status: 400 })
    }

    // Find nearby hospitals using geospatial query
    const hospitals = await Hospital.find({
      isActive: true,
      isProfileComplete: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      }
    })
      .select('name address contactDetails type facilities departments totalBeds totalDoctors logo operatingHours rating totalReviews location')
      .limit(limit)

    console.log('✅ Fetched nearby hospitals:', hospitals.length)

    return NextResponse.json({ 
      success: true,
      hospitals,
      count: hospitals.length,
      searchCenter: { latitude, longitude },
      maxDistance
    })

  } catch (error) {
    console.error('❌ Error fetching nearby hospitals:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
