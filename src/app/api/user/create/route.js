// src/app/api/user/create/route.js
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();

    console.log('🎯 Creating user with role:', role);

    // ✅ Get Clerk client
    const clerk = await clerkClient();
    
    // ✅ Set role in Clerk metadata immediately
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { role: role || 'patient' },
      unsafeMetadata: { role: role || 'patient' }
    });

    console.log('✅ Clerk metadata updated with role:', role);

    return NextResponse.json({ success: true, role: role || 'patient' });
  } catch (error) {
    console.error('Error in /api/user/create:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
