import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import User from "@/models/user";
import HospitalAffiliation from "@/models/hospitalAffiliation";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const admin = await User.findOne({ clerkId: userId });

    if (!admin || admin.role !== "hospital_admin") {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { affiliationId } = body;

    if (!affiliationId) {
      return NextResponse.json(
        { error: "Affiliation ID is required" },
        { status: 400 }
      );
    }

    // Find and update affiliation
    const affiliation = await HospitalAffiliation.findById(affiliationId);

    if (!affiliation) {
      return NextResponse.json(
        { error: "Affiliation not found" },
        { status: 404 }
      );
    }

    // Verify this affiliation belongs to the admin's hospital
    if (affiliation.hospitalId.toString() !== admin.hospitalAdminProfile.hospitalId.toString()) {
      return NextResponse.json(
        { error: "Not authorized to approve this request" },
        { status: 403 }
      );
    }

    // Update status
    affiliation.status = "APPROVED";
    affiliation.approvedBy = admin._id;
    affiliation.approvedAt = new Date();
    await affiliation.save();

    // Add hospital to doctor's affiliations
    const doctor = await User.findById(affiliation.doctorId);
    if (doctor) {
      if (!doctor.doctorProfile.affiliatedHospitals) {
        doctor.doctorProfile.affiliatedHospitals = [];
      }
      
      if (!doctor.doctorProfile.affiliatedHospitals.includes(affiliation.hospitalId)) {
        doctor.doctorProfile.affiliatedHospitals.push(affiliation.hospitalId);
        await doctor.save();
      }
    }

    // TODO: Send notification to doctor
    // await sendApprovalNotification(doctor.email, hospital.name);

    return NextResponse.json(
      {
        success: true,
        message: "Doctor approved successfully",
        affiliation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Approve doctor error:", error);
    return NextResponse.json(
      { error: "Failed to approve doctor", details: error.message },
      { status: 500 }
    );
  }
}
