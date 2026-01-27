import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/config/db'
import User from '@/models/user'
import PatientProfile from '@/models/PatientProfile'
import DoctorProfile from '@/models/DoctorProfile'
import HospitalAdminProfile from '@/models/HospitalAdminProfile'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    
    // Fetch User
    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Base response
    const responseData = {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        profileImage: user.profileImage,
        isProfileComplete: user.isProfileComplete,
        phoneNumber: user.phoneNumber,
        isWalkInCreated: user.isWalkInCreated,
        requiresPasswordChange: user.requiresPasswordChange
      },
      profile: null
    }

    // ============ Fetch Profile Based on Role ============
    
    if (user.role === 'user') {
      const patientProfile = await PatientProfile.findOne({ userId: user._id })
      
      if (patientProfile) {
        responseData.profile = {
          type: 'patient',
          id: patientProfile._id.toString(),
          qclinicId: patientProfile.qclinicId,
          dateOfBirth: patientProfile.dateOfBirth,
          gender: patientProfile.gender,
          bloodGroup: patientProfile.bloodGroup,
          address: patientProfile.address,
          emergencyContact: patientProfile.emergencyContact,
          medicalHistory: patientProfile.medicalHistory,
          allergies: patientProfile.allergies,
          chronicConditions: patientProfile.chronicConditions,
          currentMedications: patientProfile.currentMedications,
          insuranceProvider: patientProfile.insuranceProvider,
          insurancePolicyNumber: patientProfile.insurancePolicyNumber,
          totalVisits: patientProfile.totalVisits,
          lastVisitDate: patientProfile.lastVisitDate
        }
      }
    }

    if (user.role === 'doctor') {
      const doctorProfile = await DoctorProfile.findOne({ userId: user._id })
        .populate('affiliatedHospitals', 'name address city')
      
      if (doctorProfile) {
        responseData.profile = {
          type: 'doctor',
          id: doctorProfile._id.toString(),
          specialization: doctorProfile.specialization,
          qualifications: doctorProfile.qualifications,
          experience: doctorProfile.experience,
          licenseNumber: doctorProfile.licenseNumber,
          consultationFee: doctorProfile.consultationFee,
          about: doctorProfile.about,
          languages: doctorProfile.languages,
          expertise: doctorProfile.expertise,
          isAvailable: doctorProfile.isAvailable,
          rating: doctorProfile.rating,
          totalReviews: doctorProfile.totalReviews,
          totalConsultations: doctorProfile.totalConsultations,
          affiliatedHospitals: doctorProfile.affiliatedHospitals,
          isOnlineConsultationAvailable: doctorProfile.isOnlineConsultationAvailable,
          videoConsultationFee: doctorProfile.videoConsultationFee
        }
      }
    }

    if (user.role === 'hospital_admin') {
      const adminProfile = await HospitalAdminProfile.findOne({ userId: user._id })
        .populate('hospitalId', 'name address city')
      
      if (adminProfile) {
        responseData.profile = {
          type: 'hospital_admin',
          id: adminProfile._id.toString(),
          hospitalId: adminProfile.hospitalId,
          designation: adminProfile.designation,
          department: adminProfile.department,
          employeeId: adminProfile.employeeId,
          joinedAt: adminProfile.joinedAt,
          permissions: adminProfile.permissions
        }
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ Error syncing user:', error)
    return NextResponse.json(
      { error: 'Failed to sync user data' },
      { status: 500 }
    )
  }
}
