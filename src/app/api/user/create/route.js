// src/app/api/user/create/route.js
import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import PatientProfile from '@/models/PatientProfile'
import DoctorProfile from '@/models/DoctorProfile'
import HospitalAdminProfile from '@/models/HospitalAdminProfile'

export async function POST(req) {
  console.log('📝 === USER CREATE API CALLED ===')
  
  try {
    const body = await req.json()
    const { firstName, lastName, email, password, role, profileData = {} } = body
    
    console.log('📦 Request body:', {
      firstName,
      lastName,
      email,
      password: '***',
      role,
      profileData
    })

    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      )
    }

    console.log('🔌 Connecting to MongoDB...')
    await connectDB()
    console.log('✅ MongoDB connected')

    // Check if user already exists
    console.log('🔍 Checking for existing user...')
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    
    if (existingUser) {
      console.log('❌ User already exists')
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    
    console.log('✅ Email available')

    // Create user
    console.log('👤 Creating new user...')
    const newUser = await User.create({
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      email: email.toLowerCase().trim(),
      password,
      role,
      isProfileComplete: false,
    })
    
    console.log(`✅ User created: ${newUser._id}`)

    // Create role-specific profile
    let profile = null

    if (role === 'user') {
      console.log('🏥 Creating PatientProfile...')
      profile = await PatientProfile.create({
        userId: newUser._id,
        dateOfBirth: profileData.dateOfBirth || null,
        gender: profileData.gender || null,
        bloodGroup: profileData.bloodGroup || null,
        address: profileData.address || {},
      })
      console.log(`✅ PatientProfile created: ${profile.qlinicId}`)
    }

    if (role === 'doctor') {
      console.log('👨‍⚕️ Creating DoctorProfile...')
      profile = await DoctorProfile.create({
        userId: newUser._id,
        specialization: profileData.specialization || 'General Medicine',
        qualifications: profileData.qualifications || [],
        experience: profileData.experience || 0,
        consultationFee: profileData.consultationFee || 0,
      })
      console.log(`✅ DoctorProfile created: ${profile._id}`)
    }

    if (role === 'hospital_admin') {
      console.log('🏢 Creating HospitalAdminProfile...')
      profile = await HospitalAdminProfile.create({
        userId: newUser._id,
        hospitalId: profileData.hospitalId || null,  // ✅ Allow null
        designation: profileData.designation || '',
        department: profileData.department || '',
      })
      console.log(`✅ HospitalAdminProfile created: ${profile._id}`)
      
      // Mark as incomplete if no hospital assigned
      if (!profileData.hospitalId) {
        console.log('⚠️ Profile incomplete - no hospital assigned')
      }
    }

    console.log('📤 Sending response: success')
    
    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.fullName,
        role: newUser.role,
      },
      profile: profile ? {
        id: profile._id,
        ...(role === 'user' && { qlinicId: profile.qlinicId }),
        ...(role === 'hospital_admin' && { 
          hospitalId: profile.hospitalId,
          needsHospitalSetup: !profile.hospitalId 
        }),
      } : null,
    }, { status: 201 })

  } catch (error) {
    console.error('❌ ====== ERROR IN USER CREATE ======')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('=====================================')

    // Rollback user if profile creation failed
    if (error.message && error.message.includes('Profile')) {
      try {
        const email = (await req.json()).email
        if (email) {
          console.log('⚠️ Rolling back: Deleting user due to profile creation failure')
          await User.findOneAndDelete({ email: email.toLowerCase() })
        }
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError)
      }
    }

    return NextResponse.json(
      { 
        error: error.message || 'Failed to create user',
        details: error.name 
      },
      { status: 500 }
    )
  }
}
