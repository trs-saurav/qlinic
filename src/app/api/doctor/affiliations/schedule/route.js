import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { requireRole } from '@/lib/apiAuth'

export async function GET(req) {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { searchParams } = new URL(req.url)
  const affiliationId = searchParams.get('affiliationId')
  if (!affiliationId) return NextResponse.json({ error: 'affiliationId required' }, { status: 400 })

  await connectDB()

  const aff = await HospitalAffiliation.findOne({
    _id: affiliationId,
    doctorId: gate.me._id,
    status: 'APPROVED',
  }).populate('hospitalId', 'name city state address')

  if (!aff) {
    return NextResponse.json({ error: 'Affiliation not found or not approved' }, { status: 404 })
  }

  return NextResponse.json(
    {
      data: {
        hospital: aff.hospitalId,
        weeklySchedule: aff.weeklySchedule || [],
        dateOverrides: aff.dateOverrides || [],
      },
    },
    { status: 200 }
  )
}

export async function PATCH(req) {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json()
  const { affiliationId, weeklySchedule, dateOverrides } = body || {}
  if (!affiliationId) return NextResponse.json({ error: 'affiliationId required' }, { status: 400 })

  await connectDB()

  const aff = await HospitalAffiliation.findOne({
    _id: affiliationId,
    doctorId: gate.me._id,
    status: 'APPROVED',
  })

  if (!aff) {
    return NextResponse.json({ error: 'Affiliation not found or not approved' }, { status: 404 })
  }

  // Update schedule
  if (Array.isArray(weeklySchedule)) aff.weeklySchedule = weeklySchedule
  if (Array.isArray(dateOverrides)) aff.dateOverrides = dateOverrides

  // Track who updated
  aff.lastScheduleUpdatedAt = new Date()
  aff.lastScheduleUpdatedBy = gate.me._id
  aff.lastScheduleUpdatedByRole = 'doctor'

  await aff.save()

  return NextResponse.json({ message: 'Schedule updated successfully', affiliation: aff }, { status: 200 })
}
