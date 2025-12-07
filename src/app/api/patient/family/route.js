// app/api/patient/family/route.js
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/user';
import FamilyMember from '@/models/familyMember';

export async function GET(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const familyMembers = await FamilyMember.find({ 
      userId: user._id,
      isActive: true 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true,
      familyMembers 
    });

  } catch (error) {
    console.error('Error fetching family members:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();

    const familyMember = await FamilyMember.create({
      userId: user._id,
      ...body
    });

    return NextResponse.json({ 
      success: true, 
      familyMember 
    });

  } catch (error) {
    console.error('Error creating family member:', error);
    return NextResponse.json({ 
      error: 'Failed to create family member',
      details: error.message 
    }, { status: 500 });
  }
}
