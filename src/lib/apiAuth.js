// src/lib/apiAuth.js
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import Hospital from '@/models/hospital'

export async function requireAuth() {
  const { userId } = await auth()  // ✅ ADD await here
  if (!userId) return { ok: false, status: 401, error: 'Unauthorized' }
  return { ok: true, clerkId: userId }
}

export async function requireRole(roles = []) {
  const base = await requireAuth()
  if (!base.ok) return base

  await connectDB()
  const me = await User.findOne({ clerkId: base.clerkId })
  
  console.log('🔍 requireRole check:', { clerkId: base.clerkId, user: me?.email, role: me?.role }) // DEBUG
  
  if (!me) return { ok: false, status: 404, error: 'User not found' }

  if (roles.length && !roles.includes(me.role)) {
    return { ok: false, status: 403, error: `Forbidden - requires role: ${roles.join(',')}` }
  }

  return { ok: true, me }
}

// For hospital_admin routes: find hospital by createdBy or adminUsers
export async function getMyHospitalOrFail(me) {
  const hospital = await Hospital.findOne({
    $or: [
      { createdBy: me._id },      // Hospital created by this user
      { adminUsers: me._id }      // Or user is in adminUsers array
    ],
    isActive: true
  })
  
  if (!hospital) {
    return { ok: false, status: 404, error: 'Hospital not found for this admin' }
  }
  
  return { ok: true, hospital }
}
