// src/app/api/user/create/route.js
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();

    // Optional: update publicMetadata.role here
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: role || 'patient' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/user/create:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
