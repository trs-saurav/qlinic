// src/app/api/home/stats/route.js
import  connectDB  from '@/config/db'
import User from '@/models/user'
import Hospital from '@/models/hospital'
import Appointment from '@/models/appointment'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    await connectDB()

    // Fetch real statistics from database
    const [
      totalPatients,
      totalDoctors,
      totalHospitals,
      totalAppointments,
      completedAppointments
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor', isProfileComplete: true }),
      Hospital.countDocuments({ isActive: true, isVerified: true }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'COMPLETED' })
    ])

    // Calculate satisfaction rate
    const satisfactionRate = totalAppointments > 0 
      ? Math.round((completedAppointments / totalAppointments) * 100)
      : 98

    // Get top doctors
    const topDoctors = await User.find({ 
      role: 'doctor',
      isProfileComplete: true,
      'doctorProfile.rating': { $exists: true }
    })
    .sort({ 'doctorProfile.rating': -1, 'doctorProfile.totalReviews': -1 })
    .limit(6)
    .select('firstName lastName profileImage doctorProfile')
    .lean()

    // Get featured hospitals
    const featuredHospitals = await Hospital.find({
      isActive: true,
      isVerified: true,
      rating: { $exists: true }
    })
    .sort({ rating: -1, totalReviews: -1 })
    .limit(6)
    .select('name address images rating totalReviews specialties')
    .lean()

    // Get recent testimonials (from completed appointments with ratings)
    const testimonials = await Appointment.find({
      status: 'COMPLETED',
      rating: { $gte: 4 },
      feedback: { $exists: true, $ne: '' }
    })
    .populate('patientId', 'firstName lastName')
    .populate('doctorId', 'firstName lastName doctorProfile.specialization')
    .sort({ completedAt: -1 })
    .limit(6)
    .lean()

    return NextResponse.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalHospitals,
        satisfactionRate: `${satisfactionRate}%`
      },
      topDoctors,
      featuredHospitals,
      testimonials: testimonials.map(t => ({
        name: `${t.patientId?.firstName} ${t.patientId?.lastName}`,
        role: 'Patient',
        content: t.feedback,
        rating: t.rating,
        doctorName: `Dr. ${t.doctorId?.firstName} ${t.doctorId?.lastName}`,
        specialization: t.doctorId?.doctorProfile?.specialization
      }))
    })

  } catch (error) {
    console.error('Homepage stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stats'
    }, { status: 500 })
  }
}
