// src/app/api/admin/invite/route.js
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await clerkClient.users.getUser(userId);
    const isAdmin = currentUser.publicMetadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { firstName, lastName, email, phone, role } = await request.json();

    if (!firstName || !lastName || !email || !role) {
      return NextResponse.json(
        { error: 'firstName, lastName, email and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'doctor', 'hospital_admin', 'patient'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        role,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      },
      privateMetadata: {
        firstName,
        lastName,
        phone: phone || '',
      },
      redirectUrl:
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/admin',
    });

    return NextResponse.json(
      {
        message: 'Invitation sent',
        invitation: {
          id: invitation.id,
          emailAddress: invitation.emailAddress,
          status: invitation.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
