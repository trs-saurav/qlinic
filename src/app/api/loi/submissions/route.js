// app/api/loi/submissions/route.js
import { NextResponse } from 'next/server';
import LOISubmission from '@/models/LOISubmission';
import connectDB from '@/config/db';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.isAdmin && session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const specialty = searchParams.get('specialty');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (specialty) filter['clinic_profile.specialty'] = { $regex: specialty, $options: 'i' };

    const [submissions, total] = await Promise.all([
      LOISubmission.find(filter).select('-signature').sort({ submitted_at: -1 }).limit(limit).skip(skip).lean(),
      LOISubmission.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });

  } catch (error) {
    console.error('LOI submissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
