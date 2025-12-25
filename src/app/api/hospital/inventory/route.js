// src/app/api/hospital/inventory/route.js
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import user from '@/models/user'
import InventoryItem from '@/models/InventoryItem'
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

    const user = await User.findOne({ clerkId: userId })

    if (!user || user.role !== 'hospital_admin') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    const items = await InventoryItem.find({
      hospitalId: user.hospitalId
    })
    .sort({ createdAt: -1 })
    .lean()

    return NextResponse.json({
      success: true,
      items,
      count: items.length
    })

  } catch (error) {
    console.error('Inventory fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, category, currentStock, minStockLevel, unit, expiryDate } = body

    if (!name || !category || currentStock === undefined || !minStockLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findOne({ clerkId: userId })

    if (!user || user.role !== 'hospital_admin') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    const item = await InventoryItem.create({
      hospitalId: user.hospitalId,
      name,
      category,
      currentStock,
      minStockLevel,
      unit: unit || 'Units',
      expiryDate: expiryDate || null,
      lastRestocked: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Item added to inventory',
      item
    })

  } catch (error) {
    console.error('Add inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to add inventory item' },
      { status: 500 }
    )
  }
}
