import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import  connectDB  from '@/config/db'
import Hospital from '@/models/hospital'
import User from '@/models/user'

export async function GET(req, { params }) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const hospital = await Hospital.findOne({
      _id: params.id,
      isActive: true
    })

    if (!hospital) {
      return NextResponse.json({ 
        error: 'Hospital not found' 
      }, { status: 404 })
    }

    // Get doctors affiliated with this hospital
    const doctors = await User.find({
      role: 'doctor',
      isActive: true,
      'doctorProfile.affiliatedHospitals': params.id,
      'doctorProfile.isAvailable': true
    })
      .select('firstName lastName doctorProfile profileImage')
      .limit(20)

    console.log('✅ Fetched hospital:', hospital.name)

    return NextResponse.json({ 
      success: true,
      hospital,
      doctors,
      doctorCount: doctors.length
    })

  } catch (error) {
    console.error('❌ Error fetching hospital:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
