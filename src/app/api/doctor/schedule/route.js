import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import { requireRole } from '@/lib/apiAuth'

export async function GET() {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  await connectDB()

  const doctor = await User.findById(gate.me._id).select('doctorSchedule')
  const schedule = doctor?.doctorSchedule || { weekly: [], exceptions: [] }

  return NextResponse.json({ schedule }, { status: 200 })
}

export async function PATCH(req) {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json()
  const weekly = Array.isArray(body?.weekly) ? body.weekly : []
  const exceptions = Array.isArray(body?.exceptions) ? body.exceptions : []

  await connectDB()

  await User.findByIdAndUpdate(
    gate.me._id,
    { $set: { doctorSchedule: { weekly, exceptions } } },
    { new: true }
  )

  return NextResponse.json({ ok: true }, { status: 200 })
}
