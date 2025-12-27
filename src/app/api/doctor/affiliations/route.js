import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import Hospital from '@/models/hospital'
import { requireRole } from '@/lib/apiAuth'

// ✅ GET handler - fetch doctor's affiliations
export async function GET() {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  await connectDB()

  const affiliations = await HospitalAffiliation.find({ doctorId: gate.me._id })
    .populate('hospitalId', 'name shortId city state address contactDetails type specialties')
    .sort({ createdAt: -1 })

  return NextResponse.json({ affiliations }, { status: 200 })
}

// ✅ POST handler - create affiliation request
export async function POST(req) {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json()
  const { hospitalId, notes } = body || {}

  if (!hospitalId) {
    return NextResponse.json({ error: 'Hospital ID is required' }, { status: 400 })
  }

  await connectDB()

  try {
    let hospital
    const searchId = hospitalId.trim()

    // Strategy 1: Try shortId field (if exists in your Hospital model)
    hospital = await Hospital.findOne({ shortId: searchId.toUpperCase() })

    // Strategy 2: Try full MongoDB ObjectId (24 characters)
    if (!hospital && searchId.match(/^[0-9a-fA-F]{24}$/)) {
      hospital = await Hospital.findById(searchId)
    }

    // Strategy 3: ⭐ LAST 8 DIGITS OF MONGODB _id (Your system!)
    if (!hospital && searchId.length === 8) {
      const allHospitals = await Hospital.find({})
      hospital = allHospitals.find(h => {
        const idStr = h._id.toString().toLowerCase()
        return idStr.slice(-8) === searchId.toLowerCase()
      })
      
      if (hospital) {
        console.log('✅ Found hospital by last 8 digits:', hospital.name)
      }
    }

    if (!hospital) {
      return NextResponse.json({ 
        error: 'Hospital not found. Please check the Hospital ID and try again.' 
      }, { status: 404 })
    }

    console.log('✅ Found hospital:', hospital.name, 'with ID:', hospital._id)

    // ✅ Check for existing affiliation
    const existing = await HospitalAffiliation.findOne({
      doctorId: gate.me._id,
      hospitalId: hospital._id,
    })

    if (existing) {
      if (existing.status === 'APPROVED') {
        return NextResponse.json({ 
          error: 'You are already affiliated with this hospital' 
        }, { status: 409 })
      } else if (existing.status === 'PENDING') {
        return NextResponse.json({ 
          error: 'You already have a pending request with this hospital' 
        }, { status: 409 })
      } else if (existing.status === 'REJECTED') {
        // Allow re-requesting after rejection
        existing.status = 'PENDING'
        existing.requestType = 'DOCTOR_TO_HOSPITAL'
        existing.notes = notes || ''
        existing.rejectionReason = undefined
        existing.respondedAt = undefined
        existing.requestedAt = new Date()
        await existing.save()

        await existing.populate('hospitalId', 'name shortId city state address contactDetails type specialties')

        return NextResponse.json({ 
          message: 'Affiliation request re-sent successfully',
          affiliation: existing 
        }, { status: 200 })
      }
    }

    // ✅ Create new affiliation request
    const doc = await HospitalAffiliation.create({
      doctorId: gate.me._id,
      hospitalId: hospital._id,
      status: 'PENDING',
      requestType: 'DOCTOR_TO_HOSPITAL',
      notes: notes || '',
      requestedAt: new Date(),
    })

    await doc.populate('hospitalId', 'name shortId city state address contactDetails type specialties')

    return NextResponse.json({ 
      message: 'Affiliation request sent successfully',
      affiliation: doc 
    }, { status: 201 })

  } catch (e) {
    console.error('❌ Affiliation creation error:', e)
    console.error('Error details:', {
      code: e.code,
      message: e.message,
      name: e.name
    })

    if (String(e?.code) === '11000') {
      return NextResponse.json({ 
        error: 'Affiliation already exists with this hospital' 
      }, { status: 409 })
    }

    if (e.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Validation error: ' + e.message 
      }, { status: 400 })
    }

    if (e.name === 'CastError') {
      return NextResponse.json({ 
        error: 'Invalid Hospital ID format' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to create affiliation request',
      details: process.env.NODE_ENV === 'development' ? e.message : undefined
    }, { status: 500 })
  }
}
