import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import Hospital from '@/models/hospital'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import mongoose from 'mongoose'

export async function GET(req, { params }) {
  try {
    await connectDB()
    const { id } = await params;
    console.log("Received ID:", id);

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing Doctor ID" }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid Doctor ID" }, { status: 400 })
    }

    const doctor = await User.findOne({
      _id: id,
      role: 'doctor',
      isActive: true
    }).select('-password -oauthProviders -adminPermissions')

    // Fetch hospital affiliations using the normalized collection
    const affiliationsRaw = await HospitalAffiliation.find({
      doctorId: id,
      status: 'APPROVED'
    }).populate({
      path: 'hospitalId',
      model: 'Hospital',
      select: 'name address logo profileImage contactDetails rating totalReviews isVerified'
    })

    const affiliations = affiliationsRaw
      .filter(a => a.hospitalId) // ensure hospital exists
      .map(a => ({
        hospital: a.hospitalId,
        affiliation: {
          consultationFee: a.consultationFee ?? null,
          consultationRoomNumber: a.consultationRoomNumber ?? null,
          startDate: a.startDate ?? null,
          endDate: a.endDate ?? null,
          weeklySchedule: a.weeklySchedule ?? [],
          dateOverrides: a.dateOverrides ?? [],
          lastScheduleUpdatedAt: a.lastScheduleUpdatedAt ?? null,
          lastScheduleUpdatedBy: a.lastScheduleUpdatedBy ?? null,
          lastScheduleUpdatedByRole: a.lastScheduleUpdatedByRole ?? null,
        }
      }))

    if (!doctor) {
      return NextResponse.json({ success: false, message: "Doctor not found" }, { status: 404 })
    }

    if (!doctor.doctorProfile) {
      return NextResponse.json({ success: false, message: "Doctor profile not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { doctor, affiliations } })
  } catch (error) {
    console.error("Doctor fetch error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
