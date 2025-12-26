import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { requireRole } from '@/lib/apiAuth'

// ✅ GET handler - fetch doctor's affiliations
export async function GET() {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  await connectDB()

  const affiliations = await HospitalAffiliation.find({ doctorId: gate.me._id })
    .populate('hospitalId', 'name city state address')
    .sort({ createdAt: -1 })

  return NextResponse.json({ affiliations }, { status: 200 })
}

// ✅ POST handler - create affiliation request
export async function POST(req) {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json()
  const { hospitalId, notes } = body || {}
  if (!hospitalId) return NextResponse.json({ error: 'hospitalId is required' }, { status: 400 })

  await connectDB()

  try {
    const doc = await HospitalAffiliation.create({
      doctorId: gate.me._id,
      hospitalId,
      status: 'PENDING',
      requestType: 'DOCTOR_TO_HOSPITAL',
      notes: notes || '',
    })

    return NextResponse.json({ affiliation: doc }, { status: 201 })
  } catch (e) {
    if (String(e?.code) === '11000') {
      return NextResponse.json({ error: 'Affiliation already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create affiliation request' }, { status: 500 })
  }
}
