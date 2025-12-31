import { NextResponse } from 'next/server'
import  connectDB  from '@/config/db'
import User from '@/models/user'

export async function POST(request) {
  console.log('📝 === USER CREATE API CALLED ===')
  
  try {
    const body = await request.json()
    console.log('📦 Request body:', { ...body, password: '***' })

    const { email, password, firstName, lastName, role } = body

    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      console.log('❌ Password too short')
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['patient', 'doctor', 'hospital_admin', 'admin', 'sub_admin']
    const userRole = role || 'patient'
    
    if (!validRoles.includes(userRole)) {
      console.log('❌ Invalid role:', userRole)
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    console.log('🔌 Connecting to MongoDB...')
    await connectDB()
    console.log('✅ MongoDB connected')

    // Check if user already exists
    console.log('🔍 Checking for existing user...')
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    
    if (existingUser) {
      console.log('❌ User already exists:', email)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    console.log('✅ Email available')

    // Create new user
    console.log('👤 Creating new user...')
    const newUser = new User({
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      firstName: firstName || '',
      lastName: lastName || '',
      fullName: `${firstName || ''} ${lastName || ''}`.trim(),
      role: userRole,
      emailVerified: null,
      isActive: true,
      isEmailVerified: false,
    })

    console.log('💾 Saving user to database...')
    await newUser.save()
    console.log('✅ User saved successfully!')

    const responseData = {
      success: true,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    }

    console.log('📤 Sending response:', responseData)
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ ====== ERROR IN USER CREATE ======')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Full error:', error)
    console.error('=====================================')
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: `Validation error: ${error.message}` },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    if (error.name === 'MongoServerError') {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to create user. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
