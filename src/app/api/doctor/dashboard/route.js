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
    console.log('🔍 Dashboard API - Query params:', {
      doctorId,
      todayStart: todayStart.toISOString(),
      todayEnd: todayEnd.toISOString()
    });
    
    const [
      todayCount,
      upcomingCount,
      completedWeekCount,
      emergencyCount
    ] = await Promise.all([
      // 1. Today's Appointments - Only COUNT Checked-In Patients (Patients who have arrived but not yet seen)
      Appointment.countDocuments({
        doctorId,
        scheduledTime: { $gte: todayStart, $lte: todayEnd },
        status: 'CHECKED_IN'  // Only count patients who have checked in but not yet seen
      }).then(count => {
        console.log('📊 Today\'s CHECKED-IN appointments count:', count);
        return count;
      }),
      
      // 2. Upcoming (Future)
      Appointment.countDocuments({
        doctorId,
        scheduledTime: { $gt: todayEnd },
        status: { $ne: 'CANCELLED' }
      }).then(count => {
        console.log('📊 Upcoming appointments count:', count);
        return count;
      }),

      // 3. Completed This Week
      Appointment.countDocuments({
        doctorId,
        status: 'COMPLETED',
        updatedAt: { 
           $gte: startOfWeek(now, { weekStartsOn: 1 }), 
           $lte: endOfWeek(now, { weekStartsOn: 1 }) 
        }
      }).then(count => {
        console.log('📊 Completed this week count:', count);
        return count;
      }),

      // 4. Emergency Cases Today (New Metric based on your Schema)
      Appointment.countDocuments({
        doctorId,
        scheduledTime: { $gte: todayStart, $lte: todayEnd },
        type: 'EMERGENCY',
        status: { $ne: 'CANCELLED' }
      }).then(count => {
        console.log('📊 Emergency cases today count:', count);
        return count;
      })
    ]);

    const dashboardResult = {
      todayAppointments: todayCount,
      upcomingAppointments: upcomingCount,
      completedThisWeek: completedWeekCount,
      emergencyCases: emergencyCount, // New stat you can use
      pendingHospitalInvites: 0
    };
    
    console.log('📈 Final dashboard result:', dashboardResult);
    
    return NextResponse.json({
      dashboard: dashboardResult
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
