// app/api/hospitals/search/route.js
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Hospital from '@/models/hospital';

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const hospitals = await Hospital.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } }
      ]
    }).limit(20);

    return NextResponse.json({ hospitals });
  } catch (error) {
    console.error('Error searching hospitals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
