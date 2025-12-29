// src/app/api/hospital/inventory/route.js
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/config/db'
import Inventory from '@/models/Inventory'
import InventoryLog from '@/models/inventoryLog'

// GET - Fetch all inventory items for a hospital
export async function GET(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hospitalId = searchParams.get('hospitalId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    if (!hospitalId) {
      return NextResponse.json({ error: 'Hospital ID required' }, { status: 400 })
    }

    await connectDB()

    // Build query
    let query = { hospitalId }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    if (search) {
      query.$text = { $search: search }
    }

    const items = await Inventory.find(query).sort({ createdAt: -1 })

    return NextResponse.json({ success: true, items }, { status: 200 })
  } catch (error) {
    console.error('❌ Error fetching inventory:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch inventory',
      details: error.message 
    }, { status: 500 })
  }
}

// POST - Add new inventory item
export async function POST(request) {
  try {
    console.log('🔐 Starting POST /api/hospital/inventory...')
    const { userId } = await auth()
    
    if (!userId) {
      console.error('❌ No userId from auth')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ User authenticated:', userId)

    console.log('📦 Parsing request body...')
    const body = await request.json()
    console.log('📊 Received data:', JSON.stringify(body, null, 2))

    const {
      hospitalId,
      itemName,
      description,
      sku,
      category,
      quantity,
      unit,
      minThreshold,
      reorderPoint,
      reorderQuantity,
      unitPrice,
      supplier,
      expirationDate,
      location,
      notes
    } = body

    // Validate required fields
    const missingFields = []
    if (!hospitalId) missingFields.push('hospitalId')
    if (!itemName) missingFields.push('itemName')
    if (!sku) missingFields.push('sku')
    if (!category) missingFields.push('category')
    if (quantity === undefined || quantity === null || quantity === '') missingFields.push('quantity')
    if (!unit) missingFields.push('unit')

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields)
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields 
      }, { status: 400 })
    }

    console.log('🔌 Connecting to database...')
    await connectDB()
    console.log('✅ Database connected')

    // Check if SKU already exists for this hospital
    console.log('🔍 Checking for duplicate SKU...')
    const existingItem = await Inventory.findOne({ hospitalId, sku })
    if (existingItem) {
      console.error('❌ SKU already exists:', sku)
      return NextResponse.json({ 
        error: 'An item with this SKU already exists in your inventory' 
      }, { status: 409 })
    }
    console.log('✅ SKU is unique')

    console.log('💾 Creating inventory item...')
    const itemData = {
      hospitalId,
      itemName: itemName.trim(),
      sku: sku.trim(),
      category,
      quantity: parseInt(quantity),
      unit,
      minThreshold: minThreshold ? parseInt(minThreshold) : 10,
      lastRestocked: new Date()
    }

    // Add optional fields
    if (description?.trim()) itemData.description = description.trim()
    if (reorderPoint) itemData.reorderPoint = parseInt(reorderPoint)
    if (reorderQuantity) itemData.reorderQuantity = parseInt(reorderQuantity)
    if (unitPrice) itemData.unitPrice = parseFloat(unitPrice)
    if (supplier) itemData.supplier = supplier
    if (expirationDate) itemData.expirationDate = new Date(expirationDate)
    if (location?.trim()) itemData.location = location.trim()
    if (notes?.trim()) itemData.notes = notes.trim()

    console.log('📝 Item data to create:', itemData)

    const newItem = await Inventory.create(itemData)
    console.log('✅ Item created successfully:', newItem._id)

    // Log the action (non-critical - don't fail if this errors)
    try {
      console.log('📝 Creating inventory log...')
      await InventoryLog.create({
        hospitalId,
        inventoryId: newItem._id,
        action: 'added',
        quantityAfter: parseInt(quantity),
        quantityChanged: parseInt(quantity),
        performedBy: {
          userId,
          role: 'hospital-admin'
        },
        notes: 'Item added to inventory'
      })
      console.log('✅ Inventory log created')
    } catch (logError) {
      console.error('⚠️ Failed to create inventory log (non-critical):', logError.message)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ success: true, item: newItem }, { status: 201 })
  } catch (error) {
    console.error('❌ Error adding inventory item:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json({ 
      error: 'Failed to add item',
      details: error.message,
      errorType: error.name
    }, { status: 500 })
  }
}
