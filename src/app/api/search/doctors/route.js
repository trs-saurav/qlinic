import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import User from "@/models/user";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Search for doctors by name, specialization, or email
    const doctors = await User.find({
      role: "doctor",
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { "doctorProfile.specialization": { $regex: query, $options: "i" } },
      ],
    })
      .select("firstName lastName email phone profileImage doctorProfile")
      .limit(20)
      .lean();

    return NextResponse.json(
      {
        success: true,
        doctors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Search doctors error:", error);
    return NextResponse.json(
      { error: "Failed to search doctors", details: error.message },
      { status: 500 }
    );
  }
}
