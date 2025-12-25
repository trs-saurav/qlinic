import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import User from "@/models/user";
import HospitalAffiliation from "@/models/hospitalAffiliation";
import { NextResponse } from "next/server";

export async function GET(req) {
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

    const hospitalId = admin.hospitalAdminProfile?.hospitalId;

    if (!hospitalId) {
      return NextResponse.json(
        { error: "No hospital profile found" },
        { status: 404 }
      );
    }

    // Get approved affiliations (active doctors)
    const approvedAffiliations = await HospitalAffiliation.find({
      hospitalId,
      status: "APPROVED",
    })
      .populate({
        path: "doctorId",
        select: "firstName lastName email phone profileImage doctorProfile",
      })
      .lean();

    const doctors = approvedAffiliations
      .map((aff) => aff.doctorId)
      .filter((doc) => doc !== null);

    // Get pending requests (doctor requested to join)
    const pendingRequests = await HospitalAffiliation.find({
      hospitalId,
      status: "PENDING",
      requestedBy: "DOCTOR",
    })
      .populate({
        path: "doctorId",
        select: "firstName lastName email phone profileImage doctorProfile",
      })
      .sort({ requestedAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        doctors,
        pendingRequests,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Get doctors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors", details: error.message },
      { status: 500 }
    );
  }
}
