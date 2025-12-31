import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import  connectDB  from '@/config/db'
import User from '@/models/user'
import FamilyMember from '@/models/familyMember'

export async function GET(req) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findByEmail(session.user.email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if ID is provided via query params
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    // If no ID provided, return all family members
    if (!id) {
      const familyMembers = await FamilyMember.find({
        userId: user._id,
        isActive: true
      })

      return NextResponse.json({ 
        success: true,
        familyMembers 
      })
    }

    // If ID provided, return specific family member
    const familyMember = await FamilyMember.findOne({
      _id: id,
      userId: user._id,
      isActive: true
    })

    if (!familyMember) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      familyMember 
    })

  } catch (error) {
    console.error('❌ Error fetching family member:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findByEmail(session.user.email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()

    const familyMember = await FamilyMember.create({
      ...body,
      userId: user._id,
      isActive: true
    })

    console.log('✅ Family member created:', familyMember._id)

    return NextResponse.json({ 
      success: true,
      familyMember 
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating family member:', error)
    return NextResponse.json({ 
      error: 'Failed to create family member',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findByEmail(session.user.email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get ID from query params
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Family member ID is required' }, { status: 400 })
    }

    const body = await req.json()

    const familyMember = await FamilyMember.findOneAndUpdate(
      {
        _id: id,
        userId: user._id,
        isActive: true
      },
      { ...body },
      { new: true, runValidators: true }
    )

    if (!familyMember) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    console.log('✅ Family member updated:', familyMember._id)

    return NextResponse.json({ 
      success: true,
      familyMember 
    })

  } catch (error) {
    console.error('❌ Error updating family member:', error)
    return NextResponse.json({ 
      error: 'Failed to update family member',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findByEmail(session.user.email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get ID from query params
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Family member ID is required' }, { status: 400 })
    }

    // Soft delete - set isActive to false
    const familyMember = await FamilyMember.findOneAndUpdate(
      {
        _id: id,
        userId: user._id,
        isActive: true
      },
      { isActive: false },
      { new: true }
    )

    if (!familyMember) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    console.log('✅ Family member deleted:', familyMember._id)

    return NextResponse.json({ 
      success: true,
      message: 'Family member deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting family member:', error)
    return NextResponse.json({ 
      error: 'Failed to delete family member',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
