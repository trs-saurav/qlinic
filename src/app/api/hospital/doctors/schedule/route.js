import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { requireRole, getMyHospitalOrFail } from '@/lib/apiAuth'

export async function GET(req) {
  const gate = await requireRole(['hospital_admin'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { searchParams } = new URL(req.url)
  const affiliationId = searchParams.get('affiliationId')
  if (!affiliationId) return NextResponse.json({ error: 'affiliationId required' }, { status: 400 })

  await connectDB()
  const h = await getMyHospitalOrFail(gate.me)
  if (!h.ok) return NextResponse.json({ error: h.error }, { status: h.status })

  const aff = await HospitalAffiliation.findOne({
    _id: affiliationId,
    hospitalId: h.hospital._id,
    status: 'APPROVED',
  })

  if (!aff) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(
    {
      data: {
        weeklySchedule: aff.weeklySchedule || [],
        dateOverrides: aff.dateOverrides || [],
      },
    },
    { status: 200 }
  )
}

export async function PATCH(req) {
  const gate = await requireRole(['hospital_admin'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json()
  const { affiliationId, weeklySchedule, dateOverrides } = body || {}
  if (!affiliationId) return NextResponse.json({ error: 'affiliationId required' }, { status: 400 })

  await connectDB()
  const h = await getMyHospitalOrFail(gate.me)
  if (!h.ok) return NextResponse.json({ error: h.error }, { status: h.status })

  const aff = await HospitalAffiliation.findOne({
    _id: affiliationId,
    hospitalId: h.hospital._id,
    status: 'APPROVED',
  })
  if (!aff) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Store schedule fields on the affiliation
  if (Array.isArray(weeklySchedule)) aff.weeklySchedule = weeklySchedule
  if (Array.isArray(dateOverrides)) aff.dateOverrides = dateOverrides

  aff.lastScheduleUpdatedAt = new Date()
  aff.lastScheduleUpdatedBy = gate.me._id
  aff.lastScheduleUpdatedByRole = 'hospital_admin'

  await aff.save()

  return NextResponse.json({ ok: true }, { status: 200 })
}
