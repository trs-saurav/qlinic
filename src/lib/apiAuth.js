import { auth } from '@/auth'
import connectDB from '@/config/db'
import User from '@/models/user'
import Hospital from '@/models/hospital'

/**
 * Check if user is authenticated
 * @returns {Promise<{ok: boolean, status?: number, error?: string, userId?: string, session?: object}>}
 */
export async function requireAuth() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      console.log('❌ No session found')
      return { ok: false, status: 401, error: 'Unauthorized' }
    }
    
    return { 
      ok: true, 
      userId: session.user.id,
      session 
    }
  } catch (error) {
    console.error('❌ Auth error:', error)
    return { ok: false, status: 500, error: 'Authentication failed' }
  }
}

/**
 * Check if user has required role(s)
 * @param {string[]} roles - Array of allowed roles (e.g., ['admin', 'hospital_admin'])
 * @param {boolean} includeDeleted - Include soft-deleted users (default: false)
 * @returns {Promise<{ok: boolean, status?: number, error?: string, me?: User}>}
 */
export async function requireRole(roles = [], includeDeleted = false) {
  const authCheck = await requireAuth()
  if (!authCheck.ok) return authCheck

  try {
    await connectDB()
    
    const query = { _id: authCheck.userId }
    if (!includeDeleted) {
      query.deletedAt = null
    }
    
    const me = await User.findOne(query)
    
    console.log('🔍 requireRole check:', { 
      userId: authCheck.userId, 
      email: me?.email, 
      role: me?.role,
      requiredRoles: roles 
    })
    
    if (!me) {
      console.log('❌ User not found in database')
      return { ok: false, status: 404, error: 'User not found' }
    }

    if (!me.isActive) {
      console.log('❌ User account is inactive')
      return { ok: false, status: 403, error: 'Account is inactive' }
    }

    if (roles.length && !roles.includes(me.role)) {
      console.log('❌ Insufficient role:', { has: me.role, needs: roles })
      return { 
        ok: false, 
        status: 403, 
        error: `Forbidden - requires role: ${roles.join(', ')}` 
      }
    }

    return { ok: true, me }
  } catch (error) {
    console.error('❌ Error in requireRole:', error)
    return { ok: false, status: 500, error: 'Database error' }
  }
}

/**
 * Get hospital for the authenticated admin
 * @param {User} me - User object from requireRole
 * @param {boolean} allowInactive - Allow inactive hospitals (default: false)
 * @returns {Promise<{ok: boolean, status?: number, error?: string, hospital?: Hospital}>}
 */
export async function getMyHospital(me, allowInactive = false) {
  try {
    // First check if user has hospitalAdminProfile with hospitalId
    if (me.hospitalAdminProfile?.hospitalId) {
      const query = { _id: me.hospitalAdminProfile.hospitalId }
      if (!allowInactive) {
        query.isActive = true
      }
      
      const hospital = await Hospital.findOne(query)
      
      if (hospital) {
        console.log('✅ Hospital found via hospitalAdminProfile:', hospital.name)
        return { ok: true, hospital }
      }
    }

    // Fallback: search by createdBy or adminUsers
    const query = {
      $or: [
        { createdBy: me._id },
        { adminUsers: me._id }
      ]
    }
    
    if (!allowInactive) {
      query.isActive = true
    }
    
    const hospital = await Hospital.findOne(query)
    
    if (!hospital) {
      console.log('❌ No hospital found for admin:', me.email)
      return { 
        ok: false, 
        status: 404, 
        error: 'Hospital not found for this admin' 
      }
    }
    
    console.log('✅ Hospital found via fallback search:', hospital.name)
    return { ok: true, hospital }
  } catch (error) {
    console.error('❌ Error in getMyHospital:', error)
    return { ok: false, status: 500, error: 'Database error' }
  }
}

/**
 * Get hospital for the authenticated admin (throws if not found)
 * @param {User} me - User object from requireRole
 * @param {boolean} allowInactive - Allow inactive hospitals (default: false)
 * @returns {Promise<{ok: boolean, status?: number, error?: string, hospital?: Hospital}>}
 * @deprecated Use getMyHospital instead
 */
export async function getMyHospitalOrFail(me, allowInactive = false) {
  return await getMyHospital(me, allowInactive)
}

/**
 * Require hospital admin role and return hospital
 * @param {boolean} allowInactive - Allow inactive hospitals (default: false)
 * @returns {Promise<{ok: boolean, status?: number, error?: string, me?: User, hospital?: Hospital}>}
 */
export async function requireHospitalAdmin(allowInactive = false) {
  const roleCheck = await requireRole(['hospital_admin'])
  if (!roleCheck.ok) return roleCheck

  const hospitalCheck = await getMyHospital(roleCheck.me, allowInactive)
  if (!hospitalCheck.ok) return hospitalCheck

  return {
    ok: true,
    me: roleCheck.me,
    hospital: hospitalCheck.hospital
  }
}

/**
 * Check if user has specific permission
 * @param {User} me - User object
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(me, permission) {
  // Admin has all permissions
  if (me.role === 'admin') return true

  // Check admin permissions
  if (me.adminPermissions?.[permission]) return true

  // Check hospital admin permissions
  if (me.role === 'hospital_admin' && me.hospitalAdminProfile?.permissions?.[permission]) {
    return true
  }

  return false
}

/**
 * Require specific permission
 * @param {User} me - User object
 * @param {string} permission - Permission to check
 * @returns {{ok: boolean, status?: number, error?: string}}
 */
export function requirePermission(me, permission) {
  if (!hasPermission(me, permission)) {
    console.log('❌ Permission denied:', { 
      user: me.email, 
      role: me.role, 
      permission 
    })
    return { 
      ok: false, 
      status: 403, 
      error: `Permission denied: ${permission}` 
    }
  }
  
  return { ok: true }
}

/**
 * Check if user is admin or sub-admin
 * @param {User} me - User object
 * @returns {boolean}
 */
export function isAdminOrSubAdmin(me) {
  return ['admin', 'sub_admin'].includes(me.role)
}

/**
 * Require admin or sub-admin role
 * @returns {Promise<{ok: boolean, status?: number, error?: string, me?: User}>}
 */
export async function requireAdminOrSubAdmin() {
  return await requireRole(['admin', 'sub_admin'])
}

/**
 * Helper to handle API response
 * @param {object} result - Result from auth functions
 * @param {Function} NextResponse - NextResponse from next/server
 * @returns {Response|null} - Returns Response if error, null if ok
 */
export function handleAuthError(result, NextResponse) {
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    )
  }
  return null
}
