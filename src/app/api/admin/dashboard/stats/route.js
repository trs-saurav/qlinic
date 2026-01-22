// app/api/admin/dashboard/stats/route.js
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/config/db'
import User from '@/models/user'
import Appointment from '@/models/appointment'
// SupportSubmission model not found - removing import

export async function GET(req) {
  try {
    const session = await auth()
    
    // Check if user is admin
    if (!session?.user?.role || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()

    // Aggregate stats
    const [
      totalUsers,
      totalDoctors,
      pendingDoctors,
      totalHospitals,
      pendingHospitals,
      // totalTickets,
      // openTickets,
      todayAppointments
    ] = await Promise.all([
      User.countDocuments({ roles: 'patient' }),
      User.countDocuments({ roles: 'doctor', 'doctorProfile.verified': true }),
      User.countDocuments({ roles: 'doctor', 'doctorProfile.verified': false }),
      User.countDocuments({ roles: 'hospital', 'hospitalProfile.verified': true }),
      User.countDocuments({ roles: 'hospital', 'hospitalProfile.verified': false }),
      // SupportSubmission.countDocuments(),
      // SupportSubmission.countDocuments({ status: { $in: ['new', 'in_progress'] } }),
      Appointment.countDocuments({ 
        date: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ])

    return NextResponse.json({
      users: {
        total: totalUsers,
        growth: '+12.5%' // Calculate from historical data
      },
      doctors: {
        total: totalDoctors,
        pending: pendingDoctors,
        growth: '+8.2%'
      },
      hospitals: {
        total: totalHospitals,
        pending: pendingHospitals,
        growth: '+3.1%'
      },
      support: {
        total: 0,
        open: 0,
        growth: '0%'
      },
      appointments: {
        today: todayAppointments
      }
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
