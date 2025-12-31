import { auth } from "@/auth";
import connectDB from "@/config/db";
import User from "@/models/user";
import Hospital from "@/models/hospital";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "hospital_admin") {
      return NextResponse.json(
        { error: "Not authorized as hospital admin" },
        { status: 403 }
      );
    }

    const hospitalId = user.hospitalAdminProfile?.hospitalId;

    if (!hospitalId) {
      return NextResponse.json(
        { error: "Hospital not found" },
        { status: 404 }
      );
    }

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return NextResponse.json(
        { error: "Hospital not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (hospital.isVerified) {
      return NextResponse.json(
        { error: "Hospital is already verified" },
        { status: 400 }
      );
    }

    // Check if already pending
    if (hospital.verificationRequest?.status === 'pending') {
      return NextResponse.json(
        { error: "Verification request already pending" },
        { status: 400 }
      );
    }

    // Check profile completion
    if (!hospital.isProfileComplete) {
      hospital.checkProfileCompletion();
      await hospital.save();
      
      if (!hospital.isProfileComplete) {
        return NextResponse.json(
          { 
            error: "Please complete your hospital profile before requesting verification",
            missingFields: getMissingFields(hospital)
          },
          { status: 400 }
        );
      }
    }

    // Create verification request
    hospital.verificationRequest = {
      status: 'pending',
      requestedAt: new Date(),
      documents: hospital.verificationRequest?.documents || [],
    };

    await hospital.save();

    console.log('✅ Verification requested for:', hospital.name);

    // TODO: Send notification to admin
    // await sendVerificationNotification(hospital);

    return NextResponse.json(
      {
        success: true,
        message: "Verification request submitted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Verification request error:', error);
    return NextResponse.json(
      {
        error: 'Failed to request verification',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

function getMissingFields(hospital) {
  const missing = [];
  
  if (!hospital.name) missing.push('Hospital Name');
  if (!hospital.registrationNumber) missing.push('Registration Number');
  if (!hospital.contactDetails?.phone) missing.push('Phone');
  if (!hospital.contactDetails?.email) missing.push('Email');
  if (!hospital.address?.street) missing.push('Street Address');
  if (!hospital.address?.city) missing.push('City');
  if (!hospital.address?.state) missing.push('State');
  if (!hospital.address?.pincode) missing.push('Pincode');
  if (!hospital.type) missing.push('Hospital Type');
  if (!hospital.totalBeds) missing.push('Total Beds');
  if (!hospital.specialties?.length) missing.push('Specialties');
  if (!hospital.facilities?.length) missing.push('Facilities');
  
  return missing;
}
