import { getHospitalAdmin, handleHospitalAuthError } from "@/lib/hospitalAuth";
import connectDB from "@/config/db";
import Staff from "@/models/staff";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    const authResult = await getHospitalAdmin();
    const error = handleHospitalAuthError(authResult, NextResponse);
    if (error) return error;

    const { hospitalId } = authResult;

    await connectDB();

    const { id } = await params;

    const updateData = await req.json();

    // Validate role if provided
    const validRoles = [
      'nurse', 'technician', 'pharmacist', 'receptionist',
      'lab_assistant', 'radiologist', 'cleaner', 'security', 'admin',
    ];

    if (updateData.role && !validRoles.includes(updateData.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Build update object
    const updateFields = {};
    if (updateData.name) updateFields.name = updateData.name.trim();
    if (updateData.email) updateFields.email = updateData.email.trim().toLowerCase();
    if (updateData.phone) updateFields.phone = updateData.phone.trim();
    if (updateData.role) updateFields.role = updateData.role;
    if (updateData.department !== undefined) updateFields.department = updateData.department.trim();
    if (updateData.salary !== undefined && updateData.salary !== '') {
      updateFields.salary = parseFloat(updateData.salary);
    }

    // Update staff member
    const staff = await Staff.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        hospitalId,
      },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully",
      staff,
    });
  } catch (error) {
    console.error("Update staff error:", error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: "Validation error: " + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const authResult = await getHospitalAdmin();
    const error = handleHospitalAuthError(authResult, NextResponse);
    if (error) return error;

    const { hospitalId } = authResult;

    await connectDB();

    const { id } = await params;

    // Soft delete - mark as inactive
    const staff = await Staff.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        hospitalId,
      },
      {
        $set: {
          isActive: false,
        },
      },
      { new: true }
    );

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff member removed successfully",
    });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json(
      { error: "Failed to remove staff member" },
      { status: 500 }
    );
  }
}
