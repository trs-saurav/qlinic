import { NextResponse } from 'next/server';

import connectDB from '@/config/db';
import Appointment from '@/models/appointment';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { auth } from '@/auth';

export async function GET(req) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const doctorId = session.user.id;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Run queries in parallel for speed
    const [
      todayCount,
      upcomingCount,
      completedWeekCount,
      emergencyCount
    ] = await Promise.all([
      // 1. Today's Appointments
      Appointment.countDocuments({
        doctorId,
        scheduledTime: { $gte: todayStart, $lte: todayEnd },
        status: { $ne: 'CANCELLED' }
      }),
      
      // 2. Upcoming (Future)
      Appointment.countDocuments({
        doctorId,
        scheduledTime: { $gt: todayEnd },
        status: { $ne: 'CANCELLED' }
      }),

      // 3. Completed This Week
      Appointment.countDocuments({
        doctorId,
        status: 'COMPLETED',
        updatedAt: { 
           $gte: startOfWeek(now, { weekStartsOn: 1 }), 
           $lte: endOfWeek(now, { weekStartsOn: 1 }) 
        }
      }),

      // 4. Emergency Cases Today (New Metric based on your Schema)
      Appointment.countDocuments({
        doctorId,
        scheduledTime: { $gte: todayStart, $lte: todayEnd },
        type: 'EMERGENCY',
        status: { $ne: 'CANCELLED' }
      })
    ]);

    return NextResponse.json({
      dashboard: {
        todayAppointments: todayCount,
        upcomingAppointments: upcomingCount,
        completedThisWeek: completedWeekCount,
        emergencyCases: emergencyCount, // New stat you can use
        pendingHospitalInvites: 0
      }
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
