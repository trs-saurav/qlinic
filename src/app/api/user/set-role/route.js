// app/api/user/set-role/route.js
import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await req.json()

    if (!role || !['patient', 'doctor', 'hospital_admin', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    console.log('🎯 Setting role:', role, 'for user:', userId)

    // Update both publicMetadata and unsafeMetadata immediately
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { role },
      unsafeMetadata: { role }
    })

    console.log('✅ Role set in both metadata fields')

    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error('❌ Error setting role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
