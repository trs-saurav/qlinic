import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'

// ✅ No authentication required - this is for sign-up validation
export async function POST(req) {
  try {
    console.log('📝 === USER CHECK API CALLED ===')
    
    // Validate request
    if (!req.body) {
      console.error('❌ Empty request body')
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    let requestData
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request JSON:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request' },
        { status: 400 }
      )
    }

    const { email } = requestData
    console.log('🔍 Checking if user exists:', email)

    if (!email || typeof email !== 'string') {
      console.error('❌ Invalid email provided')
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    console.log('🔌 Connecting to MongoDB...')
    await connectDB()
    console.log('✅ MongoDB connected')

    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim()
    })

    console.log('✅ User check result:', existingUser ? 'exists' : 'available')

    const response = {
      exists: !!existingUser,
      email: email.toLowerCase(),
    }
    
    console.log('📤 Sending response:', response)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ ====== ERROR IN USER CHECK ======')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('====================================')
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to check user',
        details: error.name 
      },
      { status: 500 }
    )
  }
}
