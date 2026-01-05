import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/config/db'
import User from '@/models/user'
import FamilyMember from '@/models/familyMember' // Ensure this path is correct!

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    
    // ✅ FIX: Use findOne instead of findByEmail
    const user = await User.findOne({ email: session.user.email })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      const familyMembers = await FamilyMember.find({ userId: user._id, isActive: true })
      // Return consistent key 'members' or 'familyMembers' - match your Context
      return NextResponse.json({ success: true, members: familyMembers }) 
    }

    const familyMember = await FamilyMember.findOne({ _id: id, userId: user._id, isActive: true })
    if (!familyMember) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    return NextResponse.json({ success: true, member: familyMember })

  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    
    // ✅ FIX: Use findOne instead of findByEmail
    const user = await User.findOne({ email: session.user.email })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()

    const familyMember = await FamilyMember.create({
      ...body,
      userId: user._id,
      isActive: true
    })

    return NextResponse.json({ success: true, member: familyMember }, { status: 201 })

  } catch (error) {
    console.error('POST Error:', error) // Check this log in your terminal if 500 persists
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
