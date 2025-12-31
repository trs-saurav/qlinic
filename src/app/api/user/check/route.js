import { NextResponse } from 'next/server'
import  connectDB from '@/config/db'
import User from '@/models/user'

// ✅ No authentication required - this is for sign-up validation
export async function POST(req) {
  try {
    const { email } = await req.json()

    console.log('🔍 Checking if user exists:', email)

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    })

    console.log('✅ User check result:', existingUser ? 'exists' : 'available')

    return NextResponse.json({
      exists: !!existingUser,
      email,
    })
  } catch (error) {
    console.error('❌ Error checking user:', error)
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    )
  }
}
