import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/config/db'
import Inventory from '@/models/Inventory'
import { verifyHospitalAdmin } from '@/lib/hospitalAuth'
import mongoose from 'mongoose'

export async function GET(request) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const { searchParams } = new URL(request.url)
    const hospitalId = searchParams.get('hospitalId')

    if (!hospitalId) {
      console.log('❌ No hospital ID provided')
      return NextResponse.json({ error: 'Hospital ID required' }, { status: 400 })
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return NextResponse.json({ error: 'Invalid hospital ID format' }, { status: 400 })
    }

    await connectDB()

    // ✅ Verify user is admin of this hospital
    const authResult = await verifyHospitalAdmin()
    
    if (!authResult.success) {
      console.log('❌ Not a hospital admin')
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Check if user's hospital matches requested hospital
    if (authResult.hospitalId !== hospitalId) {
      console.log('❌ Hospital ID mismatch:', {
        userHospital: authResult.hospitalId,
        requested: hospitalId
      })
      return NextResponse.json(
        { error: 'You can only view stats for your own hospital' },
        { status: 403 }
      )
    }

    console.log('📊 Fetching inventory stats for hospital:', hospitalId)

    // Convert hospitalId to ObjectId for aggregation
    const hospitalObjectId = new mongoose.Types.ObjectId(hospitalId)

    const stats = await Inventory.aggregate([
      { $match: { hospitalId: hospitalObjectId } },
      {
        $facet: {
          totalItems: [
            { $count: 'count' }
          ],
          lowStock: [
            { $match: { status: 'low-stock' } },
            { $count: 'count' }
          ],
          outOfStock: [
            { $match: { status: 'out-of-stock' } },
            { $count: 'count' }
          ],
          inStock: [
            { $match: { status: 'in-stock' } },
            { $count: 'count' }
          ],
          categories: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalQuantity: { $sum: '$quantity' },
                totalValue: {
                  $sum: { $multiply: ['$quantity', { $ifNull: ['$unitPrice', 0] }] }
                }
              }
            },
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
                  $ne: null,
                  $gte: new Date(),
                  $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
                }
              }
            },
            { $count: 'count' }
          ],
          expired: [
            {
              $match: {
                expirationDate: {
                  $exists: true,
                  $ne: null,
                  $lt: new Date()
                }
              }
            },
            { $count: 'count' }
          ],
          recentlyAdded: [
            {
              $sort: { createdAt: -1 }
            },
            {
              $limit: 5
            },
            {
              $project: {
                itemName: 1,
                category: 1,
                quantity: 1,
                status: 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ])

    const result = {
      totalItems: stats[0].totalItems[0]?.count || 0,
      inStock: stats[0].inStock[0]?.count || 0,
      lowStock: stats[0].lowStock[0]?.count || 0,
      outOfStock: stats[0].outOfStock[0]?.count || 0,
      categories: stats[0].categories.length,
      categoryBreakdown: stats[0].categories || [],
      totalValue: Math.round(stats[0].totalValue[0]?.value || 0),
      expiringSoon: stats[0].expiringSoon[0]?.count || 0,
      expired: stats[0].expired[0]?.count || 0,
      recentlyAdded: stats[0].recentlyAdded || []
    }

    // Calculate health score
    const totalItems = result.totalItems || 1 // Avoid division by zero
    const healthScore = Math.round(
      ((result.inStock / totalItems) * 60) +
      ((1 - (result.lowStock / totalItems)) * 25) +
      ((1 - (result.outOfStock / totalItems)) * 10) +
      ((1 - (result.expired / totalItems)) * 5)
    )

    result.healthScore = Math.min(100, Math.max(0, healthScore))

    console.log('✅ Inventory stats fetched:', {
      totalItems: result.totalItems,
      categories: result.categories,
      healthScore: result.healthScore
    })

    return NextResponse.json({
      success: true,
      stats: result,
      timestamp: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error fetching inventory stats:', error)
    return NextResponse.json({
      error: 'Failed to fetch stats',
      details: error.message
    }, { status: 500 })
  }
}
