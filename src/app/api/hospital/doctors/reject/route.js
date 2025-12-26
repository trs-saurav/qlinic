import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { requireRole, getMyHospitalOrFail } from '@/lib/apiAuth'

export async function POST(req) {
  const gate = await requireRole(['hospital_admin'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json()
  const { affiliationId, notes } = body || {}
  if (!affiliationId) return NextResponse.json({ error: 'affiliationId required' }, { status: 400 })

  await connectDB()
  const h = await getMyHospitalOrFail(gate.me)
  if (!h.ok) return NextResponse.json({ error: h.error }, { status: h.status })

  const aff = await HospitalAffiliation.findOne({ _id: affiliationId, hospitalId: h.hospital._id })
  if (!aff) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (aff.status !== 'PENDING') {
    return NextResponse.json({ error: 'Only pending requests can be rejected' }, { status: 400 })
  }

  aff.status = 'REJECTED'
  aff.notes = notes || aff.notes
  aff.respondedAt = new Date()
  aff.respondedBy = gate.me._id
  await aff.save()

  return NextResponse.json({ ok: true }, { status: 200 })
}
