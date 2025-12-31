import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiAuth'
import  connectDB  from '@/config/db'
import User from '@/models/user'

export async function POST(req) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const { role } = await req.json()

    // Validate role
    const validRoles = ['patient', 'doctor', 'hospital_admin', 'admin', 'sub_admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    console.log('🎯 Updating user role to:', role)

    await connectDB()

    // Update user role in database
    const updatedUser = await User.findOneAndUpdate(
      { email: user.email },
      { 
        role,
        isProfileComplete: false // Reset profile completion when role changes
      },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User role updated to:', updatedUser.role)

    return NextResponse.json({
      success: true,
      role: updatedUser.role,
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        role: updatedUser.role,
        fullName: updatedUser.fullName,
      },
    })
  } catch (err) {
    console.error('❌ Error updating role:', err)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}
