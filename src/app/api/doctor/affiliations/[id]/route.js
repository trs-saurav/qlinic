import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { requireRole } from '@/lib/apiAuth'

// DELETE - Cancel affiliation request
export async function DELETE(_req, { params }) {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { id } = await params // ✅ AWAIT params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await connectDB()

  const aff = await HospitalAffiliation.findOne({ _id: id, doctorId: gate.me._id })
  if (!aff) return NextResponse.json({ error: 'Affiliation not found' }, { status: 404 })

  if (aff.status !== 'PENDING') {
    return NextResponse.json({ error: 'Only pending requests can be cancelled' }, { status: 400 })
  }

  await HospitalAffiliation.deleteOne({ _id: id })
  return NextResponse.json({ message: 'Affiliation cancelled successfully' }, { status: 200 })
}

// PATCH - Accept or reject affiliation
export async function PATCH(req, { params }) {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { id } = await params // ✅ AWAIT params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json()
  const { action } = body

  if (!['accept', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be accept or reject' }, { status: 400 })
  }

  await connectDB()

  const aff = await HospitalAffiliation.findOne({ _id: id, doctorId: gate.me._id })
  if (!aff) return NextResponse.json({ error: 'Affiliation not found' }, { status: 404 })

  if (aff.status !== 'PENDING') {
    return NextResponse.json({ error: 'Only pending affiliations can be updated' }, { status: 400 })
  }

  if (aff.requestType !== 'HOSPITAL_TO_DOCTOR') {
    return NextResponse.json({ error: 'You can only accept/reject hospital invitations' }, { status: 400 })
  }

  aff.status = action === 'accept' ? 'APPROVED' : 'REJECTED'
  aff.respondedAt = new Date()
  aff.respondedBy = gate.me._id
  await aff.save()

  return NextResponse.json({ 
    affiliation: aff, 
    message: `Affiliation ${action === 'accept' ? 'accepted' : 'rejected'} successfully` 
  }, { status: 200 })
}
