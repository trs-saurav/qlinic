import { auth } from "@/auth";
import connectDB from "@/config/db";
import User from "@/models/user";
import HospitalAffiliation from "@/models/hospitalAffiliation";
import Appointment from "@/models/appointment";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Verify hospital admin
    const user = await User.findOne({ email: session.user.email });
    if (!user?.hospitalAdminProfile?.hospitalId) {
      return Response.json({ error: "Not a hospital admin" }, { status: 403 });
    }

    const { affiliationId } = await req.json();

    if (!affiliationId) {
      return Response.json({ error: "Affiliation ID is required" }, { status: 400 });
    }

    // Find affiliation and verify it belongs to this hospital
    const affiliation = await HospitalAffiliation.findOne({
      _id: affiliationId,
      hospitalId: user.hospitalAdminProfile.hospitalId,
    });

    if (!affiliation) {
      return Response.json({ error: "Affiliation not found" }, { status: 404 });
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

    return Response.json({
      success: true,
      message: "Doctor deaffiliated successfully",
      cancelledAppointments: cancelledAppointments.modifiedCount,
    });
  } catch (error) {
    console.error("Deaffiliate error:", error);
    return Response.json(
      { error: "Failed to deaffiliate doctor" },
      { status: 500 }
    );
  }
}
