// src/app/api/user/create/route.js
import { NextResponse } from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/user';

export async function POST(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const { role } = await req.json();

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role || 'patient'
      }
    });

    // Save to MongoDB
    await connectDB();

    const existingUser = await User.findOne({ clerkId: userId });
    if (existingUser) {
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists',
        user: existingUser 
      });
    }

    const newUser = await User.create({
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: role || 'patient',
      profileImage: user.imageUrl || '',
      isActive: true,
      lastLogin: new Date()
    });

    console.log('✅ User saved to MongoDB:', newUser._id);

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      user: newUser 
    });

  } catch (error) {
    console.error('❌ Error creating user:', error);
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: error.message 
    }, { status: 500 });
  }
}
