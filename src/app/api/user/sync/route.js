import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'

export async function POST() {
  try {
    const { userId } = await auth() // ✅ Add await
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Check if user exists
    let user = await User.findOne({ clerkId: userId })
    
    if (user) {
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists',
        userId: user._id,
        role: user.role,
        exists: true
      })
    }

    // Get Clerk user data
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'Clerk user not found' }, { status: 404 })
    }

    // ✅ Create with ONLY required fields
    user = await User.create({
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      profileImage: clerkUser.imageUrl || '',
      role: 'patient',
      isActive: true,
      lastLogin: new Date()
    })
    
    console.log('✅ Created new user:', user._id)

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      userId: user._id,
      role: user.role,
      created: true
    })

  } catch (error) {
    console.error('❌ Sync error:', error)
    return NextResponse.json({ 
      error: 'Sync failed',
      details: error.message 
    }, { status: 500 })
  }
}

// ✅ Add GET method to check user
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ clerkId: userId })
      .select('_id clerkId email firstName lastName role isActive hospitalAdminProfile.hospitalId')
      .lean()

    if (!user) {
      return NextResponse.json(
        { 
          error: 'User not found',
          exists: false,
          clerkId: userId 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      exists: true,
      user: {
        _id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        hasHospital: !!user.hospitalAdminProfile?.hospitalId
      }
    })

  } catch (error) {
    console.error('❌ Get user error:', error)
    return NextResponse.json({ 
      error: 'Failed to get user',
      details: error.message 
    }, { status: 500 })
  }
}
