// app/api/loi/[id]/route.js
import { NextResponse } from 'next/server';
import LOISubmission from '@/models/LOISubmission';
import connectDB from '@/config/db';
import { auth } from '@/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const session = await auth()
    if (!session?.user?.isAdmin && session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const submission = await LOISubmission.findOne({ id }).lean();
    if (!submission) {
      return NextResponse.json({ error: 'LOI not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: submission });

  } catch (error) {
    console.error('LOI get error:', error);
    return NextResponse.json({ error: 'Failed to fetch LOI' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const session = await auth()
    if (!session?.user?.isAdmin && session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const submission = await LOISubmission.findOneAndUpdate(
      { id },
      { ...body, updated_at: new Date() },
      { new: true }
    ).lean();

    if (!submission) {
      return NextResponse.json({ error: 'LOI not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: submission });

  } catch (error) {
    console.error('LOI update error:', error);
    return NextResponse.json({ error: 'Failed to update LOI' }, { status: 500 });
  }
}
