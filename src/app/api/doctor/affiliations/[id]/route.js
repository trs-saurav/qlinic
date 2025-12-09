// app/api/doctor/affiliations/[id]/route.js
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import User from '@/models/user'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { NextResponse } from 'next/server'

// PATCH - Accept or reject affiliation request
export async function PATCH(req, { params }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const doctor = await User.findOne({ clerkId: userId, role: 'doctor' })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    const { id } = params
    const { status } = await req.json()

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const affiliation = await HospitalAffiliation.findOneAndUpdate(
      { _id: id, doctorId: doctor._id },
      { 
        status,
        respondedAt: new Date()
      },
      { new: true }
    ).populate('hospitalId', 'name address phone email')

    if (!affiliation) {
      return NextResponse.json({ error: 'Affiliation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, affiliation })
  } catch (error) {
    console.error('Error updating affiliation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove affiliation
export async function DELETE(req, { params }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const doctor = await User.findOne({ clerkId: userId, role: 'doctor' })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    const { id } = params

    const affiliation = await HospitalAffiliation.findOneAndDelete({
      _id: id,
      doctorId: doctor._id
    })

    if (!affiliation) {
      return NextResponse.json({ error: 'Affiliation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting affiliation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
