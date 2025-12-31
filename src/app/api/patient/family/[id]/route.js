import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/user';
import FamilyMember from '@/models/familyMember';

export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const body = await req.json();

    const familyMember = await FamilyMember.findOneAndUpdate(
      { _id: id, userId: user._id },
      body,
      { new: true, runValidators: true }
    );

    if (!familyMember) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, familyMember });
  } catch (error) {
    console.error('Error updating family member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

    const familyMember = await FamilyMember.findOneAndUpdate(
      { _id: id, userId: user._id },
      { isActive: false },
      { new: true }
    );

    if (!familyMember) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting family member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
