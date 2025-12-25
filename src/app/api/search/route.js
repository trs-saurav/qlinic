import { NextResponse } from "next/server";
import  connectDB  from "@/config/db";
import User from "@/models/user";
import Hospital from "@/models/hospital";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json(
        { doctors: [], hospitals: [] },
        { status: 200 }
      );
    }

    await connectDB();

    const regex = new RegExp(q, "i");

    const [doctors, hospitals] = await Promise.all([
      User.find(
        {
          role: "doctor",
          isActive: true,
          $or: [
            { firstName: regex },
            { lastName: regex },
            { "doctorProfile.specialization": regex },
            { "doctorProfile.expertise": regex },
          ],
        },
        {
          firstName: 1,
          lastName: 1,
          "doctorProfile.specialization": 1,
          "doctorProfile.experience": 1,
        }
      )
        .limit(50)
        .lean(),
      Hospital.find(
        {
          isActive: true,
          $or: [
            { name: regex },
            { "address.city": regex },
            { "address.state": regex },
            { specialties: regex },
          ],
        },
        {
          name: 1,
          address: 1,
          rating: 1,
          type: 1,
          specialties: 1,
        }
      )
        .limit(50)
        .lean(),
    ]);

    return NextResponse.json(
      {
        doctors: doctors.map((d) => ({
          id: d._id.toString(),
          name: `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Doctor",
          specialization: d.doctorProfile?.specialization || "",
          experience: d.doctorProfile?.experience || null,
        })),
        hospitals: hospitals.map((h) => ({
          id: h._id.toString(),
          name: h.name,
          city: h.address?.city || "",
          state: h.address?.state || "",
          rating: h.rating ?? 0,
          type: h.type || "",
          specialties: h.specialties || [],
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Search API error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
