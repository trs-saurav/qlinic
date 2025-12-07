// src/app/api/user/sync/route.js
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'

export async function POST() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Check if user exists
    let user = await User.findOne({ clerkId: userId })
    
    if (!user) {
      // Get Clerk user data
      const clerkUser = await currentUser()
      
      if (!clerkUser) {
        return NextResponse.json({ error: 'Clerk user not found' }, { status: 404 })
      }

      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        role: 'patient',
        isActive: true
      })
      
      console.log('✅ Created new user:', user._id)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User synced successfully',
      userId: user._id,
      role: user.role
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ 
      error: 'Sync failed',
      details: error.message 
    }, { status: 500 })
  }
}
