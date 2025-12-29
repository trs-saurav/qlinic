// src/app/api/inventory/logs/route.js
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import InventoryLog from '@/models/inventoryLog'

export async function GET(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hospitalId = searchParams.get('hospitalId')
    const inventoryId = searchParams.get('inventoryId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!hospitalId) {
      return NextResponse.json({ error: 'Hospital ID required' }, { status: 400 })
    }

    await connectDB()

    let query = { hospitalId }
    if (inventoryId) {
      query.inventoryId = inventoryId
    }

    const logs = await InventoryLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('inventoryId', 'itemName sku')

    return NextResponse.json({ success: true, logs }, { status: 200 })
  } catch (error) {
    console.error('Error fetching inventory logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}
