import { getHospitalAdmin } from "@/lib/hospitalAuth";
import Appointment from "@/models/appointment";
import User from "@/models/user";
import { NextResponse } from "next/server";

export async function GET() {
  const { hospitalId, error, status } = await getHospitalAdmin();

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Parallel queries for better performance
    const [
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      confirmedAppointments,
      totalDoctors,
      totalPatients,
    ] = await Promise.all([
      Appointment.countDocuments({ hospitalId }),
      Appointment.countDocuments({
        hospitalId,
        appointmentDate: { $gte: today, $lt: tomorrow },
      }),
      Appointment.countDocuments({ hospitalId, status: "pending" }),
      Appointment.countDocuments({ hospitalId, status: "confirmed" }),
      User.countDocuments({
        role: "doctor",
        "doctorProfile.affiliatedHospitals": hospitalId,
      }),
      Appointment.distinct("patientId", { hospitalId }).then(
        (ids) => ids.length
      ),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        confirmedAppointments,
        totalDoctors,
        totalPatients,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch statistics",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
