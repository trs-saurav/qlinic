import { NextResponse } from "next/server";
import  connectDB  from "@/config/db";
import User from "@/models/user";
import Hospital from "@/models/hospital";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) return NextResponse.json([], { status: 200 });

    await connectDB();

    const regex = new RegExp(q, "i");

    // STRICT: only users with role 'doctor'
    const doctors = await User.find(
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
      }
    )
      .limit(5)
      .lean();

    const hospitals = await Hospital.find(
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
      }
    )
      .limit(5)
      .lean();

    const doctorItems = doctors.map((d) => ({
      id: d._id.toString(),
      name: `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Doctor",
      type: "doctor",
      extra: d.doctorProfile?.specialization || "",
    }));

    const hospitalItems = hospitals.map((h) => ({
      id: h._id.toString(),
      name: h.name,
      type: "hospital",
      extra: h.address?.city || h.address?.state || "",
    }));

    const all = [...doctorItems, ...hospitalItems].slice(0, 10);

    return NextResponse.json(all, { status: 200 });
  } catch (err) {
    console.error("Suggestions error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
