// src/app/api/test-mongo/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/user';

export async function GET() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    await connectDB();
    
    console.log('✅ MongoDB connected');
    
    // Try to find all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users in database`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connected successfully',
      usersCount: users.length,
      users: users
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
