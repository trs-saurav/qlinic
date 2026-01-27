import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/config/db'
import User from '@/models/user'
import PatientProfile from '@/models/PatientProfile'

// GET: Fetch User Profile
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const user = await User.findById(session.user.id).select('-password').lean()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch patient profile if user is a patient
    let patientProfile = null
    if (user.role === 'user' || user.role === 'patient') {
      patientProfile = await PatientProfile.findOne({ userId: user._id }).lean()
      
      if (patientProfile) {
        user.patientProfile = patientProfile
      }
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Fetch Profile Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT: Update User Profile
export async function PUT(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      dateOfBirth, 
      gender, 
      bloodGroup, 
      address,
      profileImage
    } = body

    await connectDB()

    // Update User model
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        profileImage,
        isProfileComplete: true 
      },
      { new: true, runValidators: true }
    ).select('-password')

    // Update PatientProfile
    await PatientProfile.findOneAndUpdate(
      { userId: session.user.id },
      {
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        address
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true, user: updatedUser })

  } catch (error) {
    console.error('Update Profile Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
