// app/api/loi/stats/route.js
import { NextResponse } from 'next/server';
import LOISubmission from '@/models/LOISubmission';
import { auth } from '@/auth';
import connectDB from '@/config/db';

export async function GET() {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.isAdmin && session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const stats = await LOISubmission.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          willing_to_use: [{ $match: { willingness_to_use: 'Yes' } }, { $count: 'count' }],
          willing_to_pay: [{ $match: { willingness_to_pay: 'Yes' } }, { $count: 'count' }],
          by_specialty: [
            { $group: { _id: '$clinic_profile.specialty', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    const total = stats[0].total[0]?.count || 0;
    const willingToUse = stats[0].willing_to_use[0]?.count || 0;
    const willingToPay = stats[0].willing_to_pay[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        total_submissions: total,
        willing_to_use: willingToUse,
        willing_to_pay: willingToPay,
        use_rate: total > 0 ? ((willingToUse / total) * 100).toFixed(1) : 0,
        pay_rate: total > 0 ? ((willingToPay / total) * 100).toFixed(1) : 0,
        by_specialty: stats[0].by_specialty || []
      }
    });

  } catch (error) {
    console.error('LOI stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
