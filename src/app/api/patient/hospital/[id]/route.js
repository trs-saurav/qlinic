import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Hospital from '@/models/hospital'
import User from '@/models/user'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import mongoose from 'mongoose'

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  try {
    await connectDB()
    
    // 1. Await params (Next.js 15 requirement)
    const { id } = await params

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid Hospital ID" }, { status: 400 })
    }

    // 2. Fetch Hospital Details
    // Using lean() for better performance since we just need the JSON
    const hospital = await Hospital.findById(id)
      .select('-adminUsers -verificationRequest -createdBy')
      .lean()

    if (!hospital) {
      return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 })
    }

    // 3. Fetch Approved Doctors linked to this hospital
    // We fetch the affiliation first, then populate the user data
    const affiliations = await HospitalAffiliation.find({
      hospitalId: id,
      status: 'APPROVED'
    }).populate({
      path: 'doctorId',
      model: User, // Explicitly pass the model to avoid registration errors
      select: 'firstName lastName profileImage doctorProfile.specialization doctorProfile.rating doctorProfile.experience doctorProfile.consultationFee doctorProfile.about'
    }).lean()

    // 4. Format the doctors data safely
    const doctors = affiliations
      .filter(a => a.doctorId && a.doctorId._id) // Ensure doctor exists and is populated
      .map(a => ({
        _id: a.doctorId._id,
        firstName: a.doctorId.firstName,
        lastName: a.doctorId.lastName,
        profileImage: a.doctorId.profileImage,
        specialization: a.doctorId.doctorProfile?.specialization || 'General',
        rating: a.doctorId.doctorProfile?.rating || 0,
        experience: a.doctorId.doctorProfile?.experience || 0,
        about: a.doctorId.doctorProfile?.about || '',
        // Use the specific fee set for this affiliation, fallback to doctor's default
        consultationFee: a.consultationFee ?? a.doctorId.doctorProfile?.consultationFee ?? 0,
        affiliationDetails: {
           roomNumber: a.consultationRoomNumber,
           schedule: a.weeklySchedule || []
        }
      }))

    return NextResponse.json({ 
      success: true, 
      data: { 
        hospital, 
        doctors 
      } 
    })

  } catch (error) {
    console.error("Hospital fetch error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    }, { status: 500 })
  }
}
