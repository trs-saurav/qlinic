// src/app/api/hospital/doctors/route.js
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import Affiliation from '@/models/hospitalAffiliation'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Find hospital admin user
    const user = await User.findOne({ clerkId: userId })

    if (!user || user.role !== 'hospital_admin') {
      return NextResponse.json(
        { error: 'Not authorized as hospital admin' },
        { status: 403 }
      )
    }

    // Find all approved affiliations for this hospital
    const affiliations = await Affiliation.find({
      hospitalId: user.hospitalId,
      status: 'APPROVED'
    }).populate({
      path: 'doctorId',
      select: 'firstName lastName email phoneNumber profileImage doctorProfile'
    }).lean()

    // Extract doctor details
    const doctors = affiliations
      .map(aff => aff.doctorId)
      .filter(doc => doc !== null)

    return NextResponse.json({
      success: true,
      doctors,
      count: doctors.length
    })

  } catch (error) {
    console.error('Hospital doctors fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { doctorEmail } = body

    if (!doctorEmail) {
      return NextResponse.json(
        { error: 'Doctor email is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findOne({ clerkId: userId })

    if (!user || user.role !== 'hospital_admin') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Find doctor by email
    const doctor = await User.findOne({ 
      email: doctorEmail,
      role: 'doctor'
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      )
    }

    // Check if affiliation already exists
    const existingAffiliation = await Affiliation.findOne({
      doctorId: doctor._id,
      hospitalId: user.hospitalId
    })

    if (existingAffiliation) {
      return NextResponse.json(
        { error: 'Affiliation request already exists' },
        { status: 400 }
      )
    }

    // Create affiliation request
    const affiliation = await Affiliation.create({
      doctorId: doctor._id,
      hospitalId: user.hospitalId,
      status: 'PENDING',
      requestedBy: 'hospital'
    })

    return NextResponse.json({
      success: true,
      message: 'Affiliation request sent to doctor',
      affiliation
    })

  } catch (error) {
    console.error('Add doctor error:', error)
    return NextResponse.json(
      { error: 'Failed to add doctor' },
      { status: 500 }
    )
  }
}
