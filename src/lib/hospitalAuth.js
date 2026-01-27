import { auth } from '@/auth'
import connectDB from '@/config/db'
import User from '@/models/user'
import Hospital from '@/models/hospital'
import HospitalAdminProfile from '@/models/HospitalAdminProfile'

/**
 * Get authenticated hospital admin with hospital data
 * @returns {Promise<{success: boolean, user?: User, hospital?: Hospital, hospitalId?: string, adminProfile?: object, permissions?: object, error?: string, status?: number}>}
 */
export async function getHospitalAdmin() {
  try {
    const session = await auth()

    if (!session?.user) {
      console.log('❌ No session found')
      return { 
        error: "Unauthorized - Please sign in", 
        status: 401 
      }
    }

    const userId = session.user.id

    await connectDB()

    // ✅ Fetch user
    const user = await User.findById(userId).lean()

    if (!user) {
      console.log('❌ User not found:', userId)
      return { 
        error: "User not found", 
        status: 404 
      }
    }

    if (!user.isActive) {
      console.log('❌ User account inactive:', user.email)
      return {
        error: "Account is inactive",
        status: 403
      }
    }

    if (user.role !== "hospital_admin") {
      console.log('❌ User is not hospital admin:', user.role)
      return { 
        error: "Access denied - Hospital admin role required", 
        status: 403 
      }
    }

    // ✅ NEW: Fetch hospital admin profile
    const adminProfile = await HospitalAdminProfile.findOne({ userId: user._id }).lean()

    if (!adminProfile) {
      console.log('❌ No hospital admin profile found for user:', user.email)
      return { 
        error: "No hospital admin profile found. Please complete hospital setup.", 
        status: 404,
        needsSetup: true
      }
    }

    const hospitalId = adminProfile.hospitalId

    if (!hospitalId) {
      console.log('❌ No hospital ID in admin profile')
      return { 
        error: "No hospital linked to this account. Please complete hospital setup.", 
        status: 404,
        needsSetup: true
      }
    }

    // ✅ Fetch hospital
    const hospital = await Hospital.findById(hospitalId).lean()

    if (!hospital) {
      console.log('❌ Hospital not found in database:', hospitalId)
      return { 
        error: "Hospital not found. Please contact support.", 
        status: 404 
      }
    }

    // Check if hospital is active
    if (!hospital.isActive) {
      console.log('❌ Hospital is inactive:', hospital.name)
      return {
        error: "Hospital account is inactive",
        status: 403
      }
    }

    console.log('✅ Hospital admin authenticated:', user.email, 'Hospital:', hospital.name)

    return {
      success: true,
      user,
      hospital,
      hospitalId: hospitalId.toString(),
      adminProfile,
      permissions: adminProfile.permissions || {},
      designation: adminProfile.designation,
    }
  } catch (error) {
    console.error("❌ Hospital auth error:", error)
    return {
      error: "Internal server error",
      status: 500,
      details: error.message,
    }
  }
}

/**
 * Get hospital admin without populating (faster for checks only)
 * @returns {Promise<{success: boolean, userId?: string, hospitalId?: string, permissions?: object, error?: string, status?: number}>}
 */
export async function verifyHospitalAdmin() {
  try {
    const session = await auth()

    if (!session?.user) {
      console.log('❌ No session found')
      return { error: "Unauthorized", status: 401 }
    }

    const userId = session.user.id

    await connectDB()

    const user = await User.findById(userId)
      .select('role isActive email')
      .lean()

    if (!user) {
      console.log('❌ User not found:', userId)
      return { error: "User not found", status: 404 }
    }

    if (!user.isActive) {
      console.log('❌ User account inactive:', user.email)
      return { error: "Account is inactive", status: 403 }
    }

    if (user.role !== "hospital_admin") {
      console.log('❌ User is not hospital admin:', user.role)
      return { error: "Not authorized", status: 403 }
    }

    // ✅ NEW: Check admin profile
    const adminProfile = await HospitalAdminProfile.findOne({ userId: user._id })
      .select('hospitalId permissions designation isActive')
      .lean()

    if (!adminProfile || !adminProfile.hospitalId) {
      console.log('❌ No hospital linked in admin profile')
      return { 
        error: "No hospital linked", 
        status: 404,
        needsSetup: true 
      }
    }

    console.log('✅ Hospital admin verified:', user.email)

    return {
      success: true,
      userId: user._id.toString(),
      hospitalId: adminProfile.hospitalId.toString(),
      permissions: adminProfile.permissions || {},
      designation: adminProfile.designation,
    }
  } catch (error) {
    console.error("❌ Verify admin error:", error)
    return { error: "Internal error", status: 500, details: error.message }
  }
}

/**
 * Check specific permission
 * @param {string} permissionName - Permission to check (e.g., 'canManageDoctors')
 * @returns {Promise<{success: boolean, user?: User, hospital?: Hospital, hospitalId?: string, error?: string, status?: number}>}
 */
export async function checkPermission(permissionName) {
  const result = await getHospitalAdmin()

  if (result.error) {
    return result
  }

  const { user, hospital, hospitalId, permissions } = result

  const hasPermission = permissions?.[permissionName]

  if (!hasPermission) {
    console.log('❌ Permission denied:', permissionName, 'for user:', user.email)
    return {
      error: `Permission denied - ${permissionName} required`,
      status: 403,
    }
  }

  console.log('✅ Permission granted:', permissionName, 'for user:', user.email)

  return {
    success: true,
    user,
    hospital,
    hospitalId,
    permissions,
  }
}

/**
 * Get hospital by ID (for any authenticated user)
 * @param {string} hospitalId - Hospital ID to fetch
 * @returns {Promise<{success: boolean, hospital?: Hospital, error?: string, status?: number}>}
 */
export async function getHospitalById(hospitalId) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { error: "Unauthorized", status: 401 }
    }

    await connectDB()

    const hospital = await Hospital.findById(hospitalId)
      .select('-verificationRequest.documents')
      .lean()

    if (!hospital) {
      console.log('❌ Hospital not found:', hospitalId)
      return { error: "Hospital not found", status: 404 }
    }

    if (!hospital.isActive) {
      console.log('❌ Hospital is inactive:', hospital.name)
      return { error: "Hospital is inactive", status: 403 }
    }

    console.log('✅ Hospital fetched:', hospital.name)

    return {
      success: true,
      hospital,
    }
  } catch (error) {
    console.error("❌ Get hospital error:", error)
    return { error: "Internal error", status: 500, details: error.message }
  }
}

/**
 * Check if user is admin of specific hospital
 * @param {string} hospitalId - Hospital ID to check
 * @returns {Promise<{success: boolean, isAdmin: boolean, error?: string, status?: number}>}
 */
export async function isAdminOfHospital(hospitalId) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { error: "Unauthorized", status: 401 }
    }

    const userId = session.user.id

    await connectDB()

    const hospital = await Hospital.findById(hospitalId)
      .select('adminUsers createdBy')
      .lean()

    if (!hospital) {
      return { error: "Hospital not found", status: 404 }
    }

    const isAdmin = 
      hospital.createdBy?.toString() === userId ||
      hospital.adminUsers?.some(id => id.toString() === userId)

    return {
      success: true,
      isAdmin,
    }
  } catch (error) {
    console.error("❌ Check admin error:", error)
    return { error: "Internal error", status: 500, details: error.message }
  }
}

/**
 * Get all permissions for current hospital admin
 * @returns {Promise<{success: boolean, permissions?: object, error?: string, status?: number}>}
 */
export async function getMyPermissions() {
  const result = await verifyHospitalAdmin()

  if (result.error) {
    return result
  }

  return {
    success: true,
    permissions: result.permissions,
    designation: result.designation,
  }
}

/**
 * Helper to handle auth errors in API routes
 * @param {object} result - Result from auth function
 * @param {Function} NextResponse - NextResponse from next/server
 * @returns {Response|null} - Returns Response if error, null if success
 */
export function handleHospitalAuthError(result, NextResponse) {
  if (!result.success) {
    return NextResponse.json(
      { 
        error: result.error,
        needsSetup: result.needsSetup || false
      },
      { status: result.status || 500 }
    )
  }
  return null
}
