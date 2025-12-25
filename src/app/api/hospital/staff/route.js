import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import User from "@/models/user";
import Staff from "@/models/staff";
import { NextResponse } from "next/server";

// GET - Fetch all staff
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

    const staff = await Staff.find({ hospitalId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        staff,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Get staff error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Add new staff member
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

    const hospitalId = admin.hospitalAdminProfile?.hospitalId;

    if (!hospitalId) {
      return NextResponse.json(
        { error: "No hospital profile found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, email, phone, role, department, salary } = body;

    // Validate required fields
    if (!name || !phone || !role) {
      return NextResponse.json(
        { error: "Name, phone, and role are required" },
        { status: 400 }
      );
    }

    // Check if staff with same phone already exists
    const existingStaff = await Staff.findOne({ hospitalId, phone });

    if (existingStaff) {
      return NextResponse.json(
        { error: "Staff member with this phone number already exists" },
        { status: 400 }
      );
    }

    // Create new staff member
    const staff = new Staff({
      hospitalId,
      name,
      email: email || null,
      phone,
      role,
      department: department || null,
      salary: salary ? parseFloat(salary) : null,
      addedBy: admin._id,
      isActive: true,
    });

    await staff.save();

    return NextResponse.json(
      {
        success: true,
        message: "Staff member added successfully",
        staff,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Add staff error:", error);
    return NextResponse.json(
      { error: "Failed to add staff member", details: error.message },
      { status: 500 }
    );
  }
}
