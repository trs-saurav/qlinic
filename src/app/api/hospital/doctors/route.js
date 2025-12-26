import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { requireRole, getMyHospitalOrFail } from '@/lib/apiAuth'

export async function GET() {
  const gate = await requireRole(['hospital_admin'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  await connectDB()
  const h = await getMyHospitalOrFail(gate.me)
  if (!h.ok) return NextResponse.json({ error: h.error }, { status: h.status })

  const pendingRequests = await HospitalAffiliation.find({
    hospitalId: h.hospital._id,
    status: 'PENDING',
  })
    .populate('doctorId', 'firstName lastName email phone profileImage doctorProfile')
    .sort({ createdAt: -1 })

  const doctors = await HospitalAffiliation.find({
    hospitalId: h.hospital._id,
    status: 'APPROVED',
  })
    .populate('doctorId', 'firstName lastName email phone profileImage doctorProfile')
    .sort({ createdAt: -1 })

  return NextResponse.json({ doctors, pendingRequests }, { status: 200 })
}
