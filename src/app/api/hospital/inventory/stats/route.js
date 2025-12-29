// src/app/api/hospital/inventory/stats/route.js
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import Inventory from '@/models/Inventory'

export async function GET(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hospitalId = searchParams.get('hospitalId')

    if (!hospitalId) {
      return NextResponse.json({ error: 'Hospital ID required' }, { status: 400 })
    }

    await connectDB()

    const stats = await Inventory.aggregate([
      { $match: { hospitalId } },
      {
        $facet: {
          totalItems: [{ $count: 'count' }],
          lowStock: [{ $match: { status: 'low-stock' } }, { $count: 'count' }],
          outOfStock: [{ $match: { status: 'out-of-stock' } }, { $count: 'count' }],
          categories: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          totalValue: [
            {
              $group: {
                _id: null,
                value: { $sum: { $multiply: ['$quantity', { $ifNull: ['$unitPrice', 0] }] } }
              }
            }
          ],
          expiringSoon: [
            {
              $match: {
                expirationDate: {
                  $exists: true,
                  $gte: new Date(),
                  $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ])

    const result = {
      totalItems: stats[0].totalItems[0]?.count || 0,
      lowStock: stats[0].lowStock[0]?.count || 0,
      outOfStock: stats[0].outOfStock[0]?.count || 0,
      categories: stats[0].categories.length,
      categoryBreakdown: stats[0].categories,
      totalValue: stats[0].totalValue[0]?.value || 0,
      expiringSoon: stats[0].expiringSoon[0]?.count || 0
    }

    return NextResponse.json({ success: true, stats: result }, { status: 200 })
  } catch (error) {
    console.error('❌ Error fetching inventory stats:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    }, { status: 500 })
  }
}
