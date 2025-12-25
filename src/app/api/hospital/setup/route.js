import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db"; // ✅ Fix import path
import User from "@/models/user";
import Hospital from "@/models/hospital";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = await auth(); // ✅ Ensure await

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "hospital_admin") {
      return NextResponse.json(
        { error: "Not authorized as hospital admin" },
        { status: 403 }
      );
    }

    // ✅ Check if hospital already exists
    if (user.hospitalAdminProfile?.hospitalId) {
      const existing = await Hospital.findById(user.hospitalAdminProfile.hospitalId);
      if (existing) {
        console.log('✅ Hospital already exists:', existing.name);
        return NextResponse.json(
          { 
            success: true,
            message: "Hospital already exists",
            hospital: existing,
            redirect: "/hospital-admin" // ✅ Add redirect path
          },
          { status: 200 }
        );
      }
    }

    const body = await req.json();
    const { name, phone, email, city, state, street, pincode, description } = body;

    // Validate
    if (!name || !phone || !city || !state) {
      return NextResponse.json(
        { error: "Name, phone, city, and state are required" },
        { status: 400 }
      );
    }

    console.log('📝 Creating hospital:', name);

    // ✅ Create hospital with proper email handling
    const hospital = new Hospital({
      name,
      description: description || "",
      contactDetails: {
        phone,
        email: email || user.email, // Fallback to user email
      },
      address: {
        street: street || "",
        city,
        state,
        country: "India",
        pincode: pincode || "",
      },
      operatingHours: {
        Monday: { open: "09:00", close: "18:00", isOpen: true },
        Tuesday: { open: "09:00", close: "18:00", isOpen: true },
        Wednesday: { open: "09:00", close: "18:00", isOpen: true },
        Thursday: { open: "09:00", close: "18:00", isOpen: true },
        Friday: { open: "09:00", close: "18:00", isOpen: true },
        Saturday: { open: "09:00", close: "14:00", isOpen: true },
        Sunday: { open: "09:00", close: "18:00", isOpen: false },
        isOpen24x7: false,
      },
      departments: [],
      specialties: [], // ✅ Fixed typo from specializations
      facilities: [],
      amenities: [],
      accreditations: [],
      createdBy: user._id,
      adminUsers: [user._id],
      isActive: true,
      isVerified: false,
      isProfileComplete: false,
    });

    await hospital.save();

    console.log('✅ Hospital created with ID:', hospital._id);

    // ✅ Update user with hospital ID
    user.hospitalAdminProfile = {
      hospitalId: hospital._id,
      designation: "Admin",
      joinedAt: new Date(),
      permissions: {
        canManageAppointments: true,
        canManageDoctors: true,
        canViewReports: true,
        canManageInventory: true,
        canManageStaff: true,
        canManageSettings: true,
      },
    };

    user.isProfileComplete = false;
    
    await user.save();

    // ✅ Verify it was saved
    const updatedUser = await User.findById(user._id).select('hospitalAdminProfile');
    console.log('✅ User updated. Hospital ID:', updatedUser.hospitalAdminProfile?.hospitalId);

    return NextResponse.json(
      {
        success: true,
        message: "Hospital created successfully",
        hospital: {
          _id: hospital._id,
          name: hospital.name,
          address: hospital.address,
        },
        redirect: "/hospital-admin" // ✅ Add redirect path
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Hospital setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to create hospital",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
