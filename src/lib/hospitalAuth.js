import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import User from "@/models/user";
import Hospital from "@/models/hospital";

/**
 * Get authenticated hospital admin with hospital data
 * Uses virtual population to automatically fetch hospital
 */
export async function getHospitalAdmin() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { 
        error: "Unauthorized - Please sign in", 
        status: 401 
      };
    }

    await connectDB();

    // ✅ Fetch user and populate hospital using virtual
    const user = await User.findOne({ clerkId: userId })
      .populate('hospital')  // Uses virtual we defined
      .lean();

    if (!user) {
      return { 
        error: "User not found", 
        status: 404 
      };
    }

    if (user.role !== "hospital_admin") {
      return { 
        error: "Access denied - Hospital admin role required", 
        status: 403 
      };
    }

    const hospitalId = user.hospitalAdminProfile?.hospitalId;

    if (!hospitalId) {
      return { 
        error: "No hospital linked to this account", 
        status: 404 
      };
    }

    // Hospital already populated via virtual
    if (!user.hospital) {
      return { 
        error: "Hospital not found", 
        status: 404 
      };
    }

    return {
      success: true,
      user,
      hospital: user.hospital,
      hospitalId,
      permissions: user.hospitalAdminProfile.permissions,
    };
  } catch (error) {
    console.error("Hospital auth error:", error);
    return {
      error: "Internal server error",
      status: 500,
      details: error.message,
    };
  }
}

/**
 * Get hospital admin without populating (faster for checks only)
 */
export async function verifyHospitalAdmin() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Unauthorized", status: 401 };
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId })
      .select('role hospitalAdminProfile')
      .lean();

    if (!user || user.role !== "hospital_admin") {
      return { error: "Not authorized", status: 403 };
    }

    if (!user.hospitalAdminProfile?.hospitalId) {
      return { error: "No hospital linked", status: 404 };
    }

    return {
      success: true,
      userId: user._id,
      hospitalId: user.hospitalAdminProfile.hospitalId,
      permissions: user.hospitalAdminProfile.permissions,
    };
  } catch (error) {
    console.error("Verify admin error:", error);
    return { error: "Internal error", status: 500 };
  }
}

/**
 * Check specific permission
 */
export async function checkPermission(permissionName) {
  const { user, error, status } = await getHospitalAdmin();

  if (error) {
    return { error, status };
  }

  const hasPermission = user.hospitalAdminProfile?.permissions?.[permissionName];

  if (!hasPermission) {
    return {
      error: `Permission denied - ${permissionName} required`,
      status: 403,
    };
  }

  return {
    success: true,
    user,
    hospital: user.hospital,
    hospitalId: user.hospitalAdminProfile.hospitalId,
  };
}
