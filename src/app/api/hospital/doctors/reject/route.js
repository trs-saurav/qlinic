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
    const { affiliationId, reason } = body;

    if (!affiliationId) {
      return NextResponse.json(
        { error: "Affiliation ID is required" },
        { status: 400 }
      );
    }

    const affiliation = await HospitalAffiliation.findById(affiliationId);

    if (!affiliation) {
      return NextResponse.json(
        { error: "Affiliation not found" },
        { status: 404 }
      );
    }

    // Verify authorization
    if (affiliation.hospitalId.toString() !== admin.hospitalAdminProfile.hospitalId.toString()) {
      return NextResponse.json(
        { error: "Not authorized to reject this request" },
        { status: 403 }
      );
    }

    // Update status
    affiliation.status = "REJECTED";
    affiliation.rejectedBy = admin._id;
    affiliation.rejectedAt = new Date();
    affiliation.rejectionReason = reason || "Not specified";
    await affiliation.save();

    // TODO: Send notification to doctor
    // await sendRejectionNotification(doctor.email, hospital.name, reason);

    return NextResponse.json(
      {
        success: true,
        message: "Request rejected",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Reject doctor error:", error);
    return NextResponse.json(
      { error: "Failed to reject request", details: error.message },
      { status: 500 }
    );
  }
}
