// src/app/api/hospital/profile/route.js
import { auth } from '@clerk/nextjs/server'
import  connectDB  from '@/config/db'
import User from '@/models/user'
import Hospital from '@/models/hospital'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Find user and populate hospital
    const user = await User.findOne({ clerkId: userId })
      .populate('hospitalId')
      .lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'hospital_admin') {
      return NextResponse.json(
        { error: 'Not authorized as hospital admin' },
        { status: 403 }
      )
    }

    const hospital = await Hospital.findById(user.hospitalId).lean()

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      hospital: {
        _id: hospital._id,
        name: hospital.name,
        email: hospital.email,
        phone: hospital.phone,
        address: hospital.address,
        city: hospital.city,
        state: hospital.state,
        pincode: hospital.pincode,
        registrationNumber: hospital.registrationNumber,
        consultationFee: hospital.consultationFee || 500,
        facilities: hospital.facilities,
        operatingHours: hospital.operatingHours,
        isVerified: hospital.isVerified,
        createdAt: hospital.createdAt
      }
    })

  } catch (error) {
    console.error('Hospital profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hospital profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(req) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, consultationFee, operatingHours, facilities } = body

    await connectDB()

    const user = await User.findOne({ clerkId: userId })

    if (!user || user.role !== 'hospital_admin') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    const updateData = {}
    if (name) updateData.name = name
    if (consultationFee) updateData.consultationFee = consultationFee
    if (operatingHours) updateData.operatingHours = operatingHours
    if (facilities) updateData.facilities = facilities

    const hospital = await Hospital.findByIdAndUpdate(
      user.hospitalId,
      { $set: updateData },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Hospital profile updated',
      hospital
    })

  } catch (error) {
    console.error('Hospital update error:', error)
    return NextResponse.json(
      { error: 'Failed to update hospital profile' },
      { status: 500 }
    )
  }
}
