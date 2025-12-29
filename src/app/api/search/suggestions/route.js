// app/api/search/suggestions/route.js
import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import Hospital from '@/models/hospital'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl
    const query = searchParams.get('q')?.trim() || ''

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: []
      })
    }

    await connectDB()

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

    const [doctors, hospitals, specializations] = await Promise.all([
      User.find({
        role: 'doctor',
        isActive: true,
        $or: [
          { firstName: regex },
          { lastName: regex },
          { 'doctorProfile.specialization': regex }
        ]
      })
      .select('firstName lastName doctorProfile.specialization')
      .limit(5)
      .lean(),

      Hospital.find({
        isActive: true,
        $or: [
          { name: regex },
          { 'address.city': regex },
          { 'address.state': regex },
          { specialties: regex }
        ]
      })
      .select('name address.city address.state')
      .limit(5)
      .lean(),

      User.distinct('doctorProfile.specialization', {
        role: 'doctor',
        isActive: true,
        'doctorProfile.specialization': regex
      }).limit(3)
    ])

    const doctorSuggestions = doctors.map(doc => ({
      id: doc._id.toString(),
      type: 'doctor',
      text: `Dr. ${doc.firstName} ${doc.lastName}`,
      name: `Dr. ${doc.firstName} ${doc.lastName}`, // Legacy support
      subtitle: doc.doctorProfile?.specialization || '',
      extra: doc.doctorProfile?.specialization || '', // Legacy support
      icon: 'stethoscope'
    }))

    const hospitalSuggestions = hospitals.map(hosp => ({
      id: hosp._id.toString(),
      type: 'hospital',
      text: hosp.name,
      name: hosp.name, // Legacy support
      subtitle: `${hosp.address?.city || ''}${hosp.address?.state ? ', ' + hosp.address.state : ''}`,
      extra: `${hosp.address?.city || ''}${hosp.address?.state ? ', ' + hosp.address.state : ''}`, // Legacy support
      icon: 'hospital'
    }))

    const specializationSuggestions = specializations
      .filter(spec => spec)
      .map(spec => ({
        id: spec,
        type: 'specialization',
        text: spec,
        name: spec, // Legacy support
        subtitle: 'Specialization',
        extra: 'Specialization', // Legacy support
        icon: 'sparkles'
      }))

    const allSuggestions = [
      ...specializationSuggestions,
      ...doctorSuggestions,
      ...hospitalSuggestions
    ].slice(0, 10)

    return NextResponse.json({
      success: true,
      query,
      suggestions: allSuggestions,
      count: allSuggestions.length
    })

  } catch (error) {
    console.error('❌ Suggestions API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch suggestions',
      suggestions: []
    }, { status: 500 })
  }
}

export const revalidate = 300
