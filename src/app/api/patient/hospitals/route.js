// app/api/patient/hospitals/route.js
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
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || '';
    const type = searchParams.get('type') || '';

    const query = { 
      isActive: true, 
      isProfileComplete: true 
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } }
      ];
    }

    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    if (type && type !== 'ALL') {
      query.type = type;
    }

    const hospitals = await Hospital.find(query)
      .select('name address contactDetails type facilities departments totalBeds totalDoctors logo operatingHours')
      .limit(50)
      .sort({ name: 1 });

    return NextResponse.json({ 
      success: true,
      hospitals,
      count: hospitals.length 
    });

  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
