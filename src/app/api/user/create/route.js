// src/app/api/user/create/route.js
import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import PatientProfile from '@/models/PatientProfile'
import DoctorProfile from '@/models/DoctorProfile'
import HospitalAdminProfile from '@/models/HospitalAdminProfile'

export async function POST(req) {
  let requestBody = null;
  let createdUser = null;
  
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
    try {
      createdUser = await User.create({
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
        email: email.toLowerCase().trim(),
        password,
        role,
        isProfileComplete: false,
      })
      console.log('[USER_CREATE] User created successfully:', { id: createdUser._id, email: createdUser.email, role });
    } catch (createError) {
      console.error('[USER_CREATE] User creation failed:', createError.message);
      throw new Error(`User creation failed: ${createError.message}`)
    }
    
    // Create role-specific profile
    let profile = null

    if (role === 'user') {
      try {
        profile = await PatientProfile.create({
          userId: createdUser._id,
          dateOfBirth: profileData.dateOfBirth || null,
          gender: profileData.gender || null,
          bloodGroup: profileData.bloodGroup || null,
          address: profileData.address || {},
        })
        console.log('[USER_CREATE] Patient profile created:', { id: profile._id });
      } catch (profileError) {
        console.error('[USER_CREATE] PatientProfile creation failed:', profileError.message);
        throw new Error(`PatientProfile creation failed: ${profileError.message}`)
      }
    }

    if (role === 'doctor') {
      try {
        profile = await DoctorProfile.create({
          userId: createdUser._id,
          specialization: profileData.specialization || 'General Medicine',
          qualifications: profileData.qualifications || [],
          experience: profileData.experience || 0,
          consultationFee: profileData.consultationFee || 0,
        })
        console.log('[USER_CREATE] Doctor profile created:', { id: profile._id });
      } catch (profileError) {
        console.error('[USER_CREATE] DoctorProfile creation failed:', profileError.message);
        throw new Error(`DoctorProfile creation failed: ${profileError.message}`)
      }
    }

    if (role === 'hospital_admin') {
      try {
        profile = await HospitalAdminProfile.create({
          userId: createdUser._id,
          hospitalId: profileData.hospitalId || null,  // ✅ Allow null
          designation: profileData.designation || '',
          department: profileData.department || '',
        })
        console.log('[USER_CREATE] Hospital admin profile created:', { id: profile._id });
        
      } catch (profileError) {
        console.error('[USER_CREATE] HospitalAdminProfile creation failed:', profileError.message);
        throw new Error(`HospitalAdminProfile creation failed: ${profileError.message}`)
      }
    }

    console.log('[USER_CREATE] User and profile created successfully');
    return NextResponse.json({
      success: true,
      user: {
        id: createdUser._id,
        email: createdUser.email,
        name: createdUser.fullName,
        role: createdUser.role,
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
    console.error('[USER_CREATE] Error:', error.message);
    
    // Rollback user if profile creation failed
    if (createdUser && requestBody?.email) {
      try {
        console.log('[USER_CREATE] Rolling back user creation');
        await User.findByIdAndDelete(createdUser._id)
        console.log('[USER_CREATE] User rolled back successfully');
      } catch (rollbackError) {
        console.error('[USER_CREATE] Rollback failed:', rollbackError.message);
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
