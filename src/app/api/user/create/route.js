// src/app/api/user/create/route.js
import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import PatientProfile from '@/models/PatientProfile'
import DoctorProfile from '@/models/DoctorProfile'
import HospitalAdminProfile from '@/models/HospitalAdminProfile'

export async function POST(req) {
  let requestBody = null;
  
  try {
    // Validate request exists
    if (!req.body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    // Parse JSON with error handling
    try {
      requestBody = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request' },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, password, role, profileData = {} } = requestBody
    
    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    
    // Create user
    let newUser
    try {
      newUser = await User.create({
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
        email: email.toLowerCase().trim(),
        password,
        role,
        isProfileComplete: false,
      })
    } catch (createError) {
      throw new Error(`User creation failed: ${createError.message}`)
    }
    
    // Create role-specific profile
    let profile = null

    if (role === 'user') {
      try {
        profile = await PatientProfile.create({
          userId: newUser._id,
          dateOfBirth: profileData.dateOfBirth || null,
          gender: profileData.gender || null,
          bloodGroup: profileData.bloodGroup || null,
          address: profileData.address || {},
        })
      } catch (profileError) {
        throw new Error(`PatientProfile creation failed: ${profileError.message}`)
      }
    }

    if (role === 'doctor') {
      try {
        profile = await DoctorProfile.create({
          userId: newUser._id,
          specialization: profileData.specialization || 'General Medicine',
          qualifications: profileData.qualifications || [],
          experience: profileData.experience || 0,
          consultationFee: profileData.consultationFee || 0,
        })
      } catch (profileError) {
        throw new Error(`DoctorProfile creation failed: ${profileError.message}`)
      }
    }

    if (role === 'hospital_admin') {
      try {
        profile = await HospitalAdminProfile.create({
          userId: newUser._id,
          hospitalId: profileData.hospitalId || null,  // ✅ Allow null
          designation: profileData.designation || '',
          department: profileData.department || '',
        })
        
      } catch (profileError) {
        throw new Error(`HospitalAdminProfile creation failed: ${profileError.message}`)
      }
    }

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
    // Rollback user if profile creation failed
    if (error.message && error.message.includes('Profile') && requestBody?.email) {
      try {
        await User.findOneAndDelete({ email: requestBody.email.toLowerCase() })
      } catch (rollbackError) {
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
