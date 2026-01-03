import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/config/db'
import User from '@/models/user'

// GET: Fetch User Profile
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findById(session.user.id).select('-password')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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
    
    // ✅ ADDED profileImage to destructuring
    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      dateOfBirth, 
      gender, 
      bloodGroup, 
      address,
      profileImage // <--- Critical addition
    } = body

    await connectDB()

    // Handle empty enums safely
    const safeGender = gender === '' ? null : gender
    const safeBloodGroup = bloodGroup === '' ? null : bloodGroup

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        profileImage, // <--- Add to update object
        
        // Update patientProfile fields
        'patientProfile.gender': safeGender,
        'patientProfile.bloodGroup': safeBloodGroup,
        'patientProfile.address': address,
        isProfileComplete: true 
      },
      { new: true, runValidators: true }
    ).select('-password')

    return NextResponse.json({ success: true, user: updatedUser })

  } catch (error) {
    console.error('Update Profile Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
