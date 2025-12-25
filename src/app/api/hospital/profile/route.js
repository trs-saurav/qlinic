import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import User from "@/models/user";
import Hospital from "@/models/hospital";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

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

    const hospitalId = user.hospitalAdminProfile?.hospitalId;

    if (!hospitalId) {
      return NextResponse.json(
        { error: "Hospital ID not found in user profile" },
        { status: 404 }
      );
    }

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return NextResponse.json(
        { error: "Hospital not found in database" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        hospital: hospital.toObject(),
        admin: {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          designation: user.hospitalAdminProfile?.designation || "Admin",
          permissions: user.hospitalAdminProfile?.permissions || {},
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ GET hospital profile error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch hospital profile",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const { userId } = await auth();

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

    const hospitalId = user.hospitalAdminProfile?.hospitalId;

    if (!hospitalId) {
      return NextResponse.json(
        { error: "Hospital ID not found in user profile" },
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

    const body = await req.json();

    // ✅ Check if hospital is verified or verification is pending
    const isVerified = hospital.isVerified;
    const verificationPending = hospital.verificationRequest?.status === 'pending';
    const canEditBasicInfo = !isVerified && !verificationPending;

    // ✅ Fields that can ALWAYS be edited (even when verified)
    const alwaysEditableFields = [
      'totalBeds',
      'icuBeds',
      'emergencyBeds',
      'availableBeds',
      'operatingHours',
    ];

    // ✅ Fields that can ONLY be edited when NOT verified and NOT pending
    const basicInfoFields = [
      'name',
      'registrationNumber',
      'type',
      'established',
      'description',
      'contactDetails',
      'address',
      'consultationFee',
      'emergencyFee',
      'specialties',
      'facilities',
      'amenities',
      'accreditations',
      'departments',
      'emergencyServices',
      'insurance',
      'websiteUrl',
      'logo',
      'images',
    ];

    // Update always editable fields
    alwaysEditableFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === 'operatingHours' && typeof body[field] === 'object') {
          hospital[field] = {
            ...(hospital[field]?.toObject?.() || hospital[field] || {}),
            ...body[field],
          };
        } else {
          hospital[field] = body[field];
        }
      }
    });

    // Update basic info fields only if allowed
    if (canEditBasicInfo) {
      basicInfoFields.forEach((field) => {
        if (body[field] !== undefined) {
          if (
            typeof body[field] === 'object' &&
            !Array.isArray(body[field]) &&
            body[field] !== null
          ) {
            // Merge nested objects
            hospital[field] = {
              ...(hospital[field]?.toObject?.() || hospital[field] || {}),
              ...body[field],
            };
          } else {
            hospital[field] = body[field];
          }
        }
      });
    } else {
      // Log attempt to edit locked fields
      const attemptedBasicFields = basicInfoFields.filter(
        (field) => body[field] !== undefined
      );
      if (attemptedBasicFields.length > 0) {
        console.log(
          `⚠️ Attempted to edit locked fields: ${attemptedBasicFields.join(', ')}`
        );
      }
    }

    // Check and update profile completion
    hospital.checkProfileCompletion();

    hospital.updatedAt = new Date();
    await hospital.save();

    console.log('✅ Hospital updated:', hospital.name);

    return NextResponse.json(
      {
        success: true,
        message: 'Hospital profile updated successfully',
        hospital: hospital.toObject(),
        lockedFields: !canEditBasicInfo ? basicInfoFields : [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ PUT hospital profile error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update hospital profile',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
