import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import User from "@/models/user";
import Staff from "@/models/staff";
import { NextResponse } from "next/server";

// PUT - Update staff member
export async function PUT(req, { params }) {
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

    const { staffId } = params;
    const body = await req.json();

    const staff = await Staff.findById(staffId);

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Verify staff belongs to admin's hospital
    if (staff.hospitalId.toString() !== admin.hospitalAdminProfile.hospitalId.toString()) {
      return NextResponse.json(
        { error: "Not authorized to update this staff member" },
        { status: 403 }
      );
    }

    // Update fields
    const allowedUpdates = ['name', 'email', 'phone', 'role', 'department', 'salary'];
    allowedUpdates.forEach((field) => {
      if (body[field] !== undefined) {
        staff[field] = body[field];
      }
    });

    await staff.save();

    return NextResponse.json(
      {
        success: true,
        message: "Staff member updated successfully",
        staff,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Update staff error:", error);
    return NextResponse.json(
      { error: "Failed to update staff member", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove staff member
export async function DELETE(req, { params }) {
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

    const { staffId } = params;

    const staff = await Staff.findById(staffId);

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Verify staff belongs to admin's hospital
    if (staff.hospitalId.toString() !== admin.hospitalAdminProfile.hospitalId.toString()) {
      return NextResponse.json(
        { error: "Not authorized to delete this staff member" },
        { status: 403 }
      );
    }

    // Soft delete
    staff.isActive = false;
    await staff.save();

    return NextResponse.json(
      {
        success: true,
        message: "Staff member removed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Delete staff error:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member", details: error.message },
      { status: 500 }
    );
  }
}
