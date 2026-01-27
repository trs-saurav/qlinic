import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiAuth'
import connectDB from '@/config/db'
import User from '@/models/user'
import PatientProfile from '@/models/PatientProfile'
import DoctorProfile from '@/models/DoctorProfile'
import HospitalAdminProfile from '@/models/HospitalAdminProfile'

export async function POST(req) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const { role, profileData } = await req.json()

    // Validate role
    const validRoles = ['user', 'doctor', 'hospital_admin', 'admin', 'sub_admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    console.log('🎯 Updating user role to:', role)

    await connectDB()

    // ============ STEP 1: Update User Role ============
    const updatedUser = await User.findOneAndUpdate(
      { email: user.email },
      { 
        role,
        isProfileComplete: false // Reset profile completion when role changes
      },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User role updated to:', updatedUser.role)

    // ============ STEP 2: Create Profile if Doesn't Exist ============
    let profile = null

    if (role === 'user') {
      // Check if PatientProfile exists
      profile = await PatientProfile.findOne({ userId: updatedUser._id })
      
      if (!profile) {
        console.log('🏥 Creating PatientProfile (role changed to user)...')
        profile = await PatientProfile.create({
          userId: updatedUser._id,
          dateOfBirth: profileData?.dateOfBirth || null,
          gender: profileData?.gender || null,
          totalVisits: 0
        })
        console.log('✅ PatientProfile created:', profile.qclinicId)
      }
    }

    if (role === 'doctor') {
      // Check if DoctorProfile exists
      profile = await DoctorProfile.findOne({ userId: updatedUser._id })
      
      if (!profile) {
        console.log('👨‍⚕️ Creating DoctorProfile (role changed to doctor)...')
        profile = await DoctorProfile.create({
          userId: updatedUser._id,
          specialization: profileData?.specialization || 'General Physician',
          qualifications: profileData?.qualifications || [],
          experience: profileData?.experience || 0,
          consultationFee: profileData?.consultationFee || 0,
          isAvailable: true
        })
        console.log('✅ DoctorProfile created')
      }
    }

    if (role === 'hospital_admin') {
      // Check if HospitalAdminProfile exists
      profile = await HospitalAdminProfile.findOne({ userId: updatedUser._id })
      
      if (!profile) {
        console.log('🏢 Creating HospitalAdminProfile (role changed to hospital_admin)...')
        
        if (!profileData?.hospitalId) {
          return NextResponse.json(
            { error: 'hospitalId is required for hospital_admin role' },
            { status: 400 }
          )
        }
        
        profile = await HospitalAdminProfile.create({
          userId: updatedUser._id,
          hospitalId: profileData.hospitalId,
          designation: profileData?.designation || 'Admin',
          permissions: {
            canManageDoctors: true,
            canManageStaff: true,
            canViewReports: true
          }
        })
        console.log('✅ HospitalAdminProfile created')
      }
    }

    return NextResponse.json({
      success: true,
      role: updatedUser.role,
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        role: updatedUser.role,
        fullName: updatedUser.fullName,
      },
      profileCreated: !!profile && profile.isNew
    })

  } catch (err) {
    console.error('❌ Error updating role:', err)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}
