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
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const type = searchParams.get('type') || ''
    const specialization = searchParams.get('specialization') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    const query = { 
      isActive: true, 
      isProfileComplete: true 
    }

    // Search by name or address
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } },
        { 'address.area': { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by city
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' }
    }

    // Filter by hospital type
    if (type && type !== 'ALL') {
      query.type = type
    }

    // Filter by specialization
    if (specialization) {
      query.departments = { $regex: specialization, $options: 'i' }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const [hospitals, totalCount] = await Promise.all([
      Hospital.find(query)
        .select('name address contactDetails type facilities departments totalBeds totalDoctors logo operatingHours rating totalReviews')
        .limit(limit)
        .skip(skip)
        .sort({ rating: -1, name: 1 }),
      Hospital.countDocuments(query)
    ])

    console.log('✅ Fetched hospitals:', hospitals.length)

    return NextResponse.json({ 
      success: true,
      hospitals,
      count: hospitals.length,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + hospitals.length < totalCount
    })

  } catch (error) {
    console.error('❌ Error fetching hospitals:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
