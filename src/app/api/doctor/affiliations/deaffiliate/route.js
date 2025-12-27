import { auth } from "@clerk/nextjs/server";
import  connectDB  from "@/config/db";
import User from "@/models/uer";
import HospitalAffiliation from "@/models/hospitalAffiliation";
import Appointment from "@/models/appointment";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Verify doctor
    const user = await User.findOne({ clerkId: userId });
    if (!user?.doctorProfile) {
      return Response.json({ error: "Not a doctor" }, { status: 403 });
    }

    const { affiliationId } = await req.json();

    if (!affiliationId) {
      return Response.json({ error: "Affiliation ID is required" }, { status: 400 });
    }

    // Find affiliation and verify it belongs to this doctor
    const affiliation = await HospitalAffiliation.findOne({
      _id: affiliationId,
      doctorId: user._id,
      status: 'APPROVED'
    });

    if (!affiliation) {
      return Response.json({ error: "Active affiliation not found" }, { status: 404 });
    }

    // Delete the affiliation
    await HospitalAffiliation.findByIdAndDelete(affiliationId);

    // Cancel all future appointments for this doctor at this hospital
    const cancelledAppointments = await Appointment.updateMany(
      {
        doctorId: user._id,
        hospitalId: affiliation.hospitalId,
        appointmentDate: { $gte: new Date() },
        status: { $in: ["pending", "confirmed"] },
      },
      {
        $set: {
          status: "cancelled",
          cancellationReason: "Doctor ended affiliation with hospital",
          cancelledAt: new Date(),
          cancelledBy: user._id
        },
      }
    );

    return Response.json({
      success: true,
      message: "Successfully left hospital",
      cancelledAppointments: cancelledAppointments.modifiedCount,
    });
  } catch (error) {
    console.error("Deaffiliate error:", error);
    return Response.json(
      { error: "Failed to leave hospital" },
      { status: 500 }
    );
  }
}
