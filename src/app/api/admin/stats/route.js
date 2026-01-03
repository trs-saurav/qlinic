// src/app/api/admin/stats/route.js
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/config/db'
import User from '@/models/user'
import Hospital from '@/models/hospital'
import Appointment from '@/models/appointment'

export async function GET(request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    await connectDB()

    // Get current month date range
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const today = new Date(now.setHours(0, 0, 0, 0))

    // Parallel queries for better performance
    const [
      totalUsers,
      newUsersThisMonth,
      totalHospitals,
      verifiedHospitals,
      pendingHospitalVerifications,
      totalDoctors,
      activeDoctors,
      totalAppointments,
      todayAppointments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: firstDayOfMonth } }),
      Hospital.countDocuments(),
      Hospital.countDocuments({ verificationStatus: 'approved' }),
      Hospital.countDocuments({ verificationStatus: 'pending' }),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'doctor', isActive: true }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ 
        appointmentDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      }),
    ])

    const stats = {
      totalUsers,
      newUsersThisMonth,
      totalHospitals,
      verifiedHospitals,
      pendingHospitalVerifications,
      totalDoctors,
      activeDoctors,
      pendingDoctorVerifications: 0, // Add when you have doctor verification model
      totalAppointments,
      todayAppointments,
      openSupportTickets: 0, // Add when you have support ticket model
    }

    return NextResponse.json({ success: true, stats }, { status: 200 })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    }, { status: 500 })
  }
}
