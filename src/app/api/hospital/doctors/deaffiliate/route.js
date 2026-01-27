import { getHospitalAdmin, handleHospitalAuthError } from "@/lib/hospitalAuth";
import connectDB from "@/config/db";
import HospitalAffiliation from "@/models/hospitalAffiliation";
import Appointment from "@/models/appointment";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const authResult = await getHospitalAdmin();
    const error = handleHospitalAuthError(authResult, NextResponse);
    if (error) return error;

    const { hospitalId } = authResult;

    await connectDB();

    const { affiliationId } = await req.json();

    if (!affiliationId) {
      return NextResponse.json({ error: "Affiliation ID is required" }, { status: 400 });
    }

    // Find affiliation and verify it belongs to this hospital
    const affiliation = await HospitalAffiliation.findOne({
      _id: affiliationId,
      hospitalId,
    });

    if (!affiliation) {
      return NextResponse.json({ error: "Affiliation not found" }, { status: 404 });
    }

    // Delete the affiliation
    await HospitalAffiliation.findByIdAndDelete(affiliationId);

    // Cancel all future appointments for this doctor at this hospital
    const cancelledAppointments = await Appointment.updateMany(
      {
        doctorId: affiliation.doctorId,
        hospitalId: affiliation.hospitalId,
        appointmentDate: { $gte: new Date() },
        status: { $in: ["pending", "confirmed"] },
      },
      {
        $set: {
          status: "cancelled",
          cancellationReason: "Doctor deaffiliated from hospital",
          cancelledAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Doctor deaffiliated successfully",
      cancelledAppointments: cancelledAppointments.modifiedCount,
    });
  } catch (error) {
    console.error("Deaffiliate error:", error);
    return NextResponse.json(
      { error: "Failed to deaffiliate doctor" },
      { status: 500 }
    );
  }
}
