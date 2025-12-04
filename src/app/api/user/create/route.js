import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { clerkClient } from '@clerk/nextjs';

export async function POST(request) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user from Clerk to check admin status
    const currentUser = await clerkClient.users.getUser(userId);
    const isAdmin = currentUser.publicMetadata?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 403 });
    }

    const { firstName, lastName, email, phone, role } = await request.json();

    // Validation
    if (!firstName || !lastName || !email || !role) {
      return NextResponse.json(
        { error: 'First name, last name, email, and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'clerk'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or clerk' },
        { status: 400 }
      );
    }

    try {
      // Create user invitation in Clerk
      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: {
          role: role,
          createdBy: userId,
          createdAt: new Date().toISOString()
        },
        privateMetadata: {
          firstName,
          lastName,
          phone: phone || ''
        },
        redirectUrl: `${process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/admin/dashboard'}`
      });

      return NextResponse.json({
        message: 'User invitation sent successfully',
        invitation: {
          id: invitation.id,
          emailAddress: invitation.emailAddress,
          status: invitation.status
        }
      }, { status: 201 });

    } catch (clerkError) {
      console.error('Clerk error:', clerkError);
      
      // Handle specific Clerk errors
      if (clerkError.errors?.[0]?.code === 'form_identifier_exists') {
        return NextResponse.json(
          { error: 'A user with this email address already exists' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to send invitation' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating user invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
