import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import { auth } from '@clerk/nextjs/server'
import User from '@/models/user'
import Hospital from '@/models/hospital'
import HospitalAffiliation from '@/models/hospitalAffiliation'

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthenticated (no Clerk session)' }, { status: 401 })
  }

  await connectDB()

  const me = await User.findOne({ clerkId: userId }).select('_id role')
  if (!me) {
    return NextResponse.json({ error: 'Mongo user not found for this Clerk user' }, { status: 404 })
  }

  if (me.role !== 'hospital_admin') {
    return NextResponse.json(
      { error: `Forbidden: role=${me.role} (expected hospital_admin)` },
      { status: 403 }
    )
  }

  // ✅ FIX: Use createdBy OR adminUsers array
  const hospital = await Hospital.findOne({
    $or: [
      { createdBy: me._id },
      { adminUsers: me._id }
    ],
    isActive: true
  }).select('_id')

  if (!hospital) {
    return NextResponse.json(
      { error: 'No hospital found for this admin. Please complete hospital setup first.' },
      { status: 404 }
    )
  }

  const body = await req.json()
  const { doctorId } = body || {}
  if (!doctorId) return NextResponse.json({ error: 'doctorId required' }, { status: 400 })

  try {
    const affiliation = await HospitalAffiliation.create({
      doctorId,
      hospitalId: hospital._id,
      status: 'PENDING',
      requestType: 'HOSPITAL_TO_DOCTOR',
      notes: 'Invitation sent by hospital',
    })

    return NextResponse.json({ affiliation }, { status: 201 })
  } catch (e) {
    if (String(e?.code) === '11000') {
      return NextResponse.json({ error: 'Affiliation already exists' }, { status: 409 })
    }
    console.error('Invite error:', e)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}
