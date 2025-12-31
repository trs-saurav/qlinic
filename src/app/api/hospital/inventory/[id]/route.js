import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/config/db'
import Inventory from '@/models/Inventory'
import InventoryLog from '@/models/inventoryLog'

// GET - Fetch single inventory item
export async function GET(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // FIX: Await params in Next.js 15
    const { id } = await params

    await connectDB()

    const item = await Inventory.findById(id)
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, item }, { status: 200 })
  } catch (error) {
    console.error('❌ Error fetching inventory item:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch item',
      details: error.message 
    }, { status: 500 })
  }
}

// PUT - Update inventory item
export async function PUT(request, { params }) {
  try {
    console.log('🔄 Starting PUT request...')
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id

    // FIX: Await params in Next.js 15
    const { id } = await params
    console.log('📝 Updating item:', id)

    const body = await request.json()
    console.log('📊 Update data:', body)

    await connectDB()

    const existingItem = await Inventory.findById(id)
    if (!existingItem) {
      console.error('❌ Item not found:', id)
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    console.log('✅ Found existing item')
    const quantityBefore = existingItem.quantity
    const quantityAfter = body.quantity !== undefined ? parseInt(body.quantity) : quantityBefore

    // Update lastRestocked if quantity increased
    if (quantityAfter > quantityBefore) {
      body.lastRestocked = new Date()
    }

    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    )

    console.log('✅ Item updated successfully')

    // Log the action if quantity changed
    if (quantityBefore !== quantityAfter) {
      try {
        await InventoryLog.create({
          hospitalId: updatedItem.hospitalId,
          inventoryId: updatedItem._id,
          action: 'updated',
          quantityBefore,
          quantityAfter,
          quantityChanged: quantityAfter - quantityBefore,
          performedBy: {
            userId,
            role: 'hospital-admin'
          },
          notes: body.updateNotes || 'Item quantity updated'
        })
        console.log('✅ Log created')
      } catch (logError) {
        console.error('⚠️ Failed to create log:', logError.message)
      }
    }

    return NextResponse.json({ success: true, item: updatedItem }, { status: 200 })
  } catch (error) {
    console.error('❌ Error updating inventory item:', error)
    return NextResponse.json({ 
      error: 'Failed to update item',
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE - Remove inventory item
export async function DELETE(request, { params }) {
  try {
    console.log('🗑️ Starting DELETE request...')
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id

    // FIX: Await params in Next.js 15
    const { id } = await params
    console.log('🗑️ Deleting item:', id)

    await connectDB()

    const item = await Inventory.findById(id)
    if (!item) {
      console.error('❌ Item not found:', id)
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    console.log('✅ Found item to delete')

    // Log the action before deletion
    try {
      await InventoryLog.create({
        hospitalId: item.hospitalId,
        inventoryId: item._id,
        action: 'removed',
        quantityBefore: item.quantity,
        quantityAfter: 0,
        quantityChanged: -item.quantity,
        performedBy: {
          userId,
          role: 'hospital-admin'
        },
        notes: `Item '${item.itemName}' removed from inventory`
      })
      console.log('✅ Deletion log created')
    } catch (logError) {
      console.error('⚠️ Failed to create log:', logError.message)
    }

    await Inventory.findByIdAndDelete(id)
    console.log('✅ Item deleted successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Item deleted successfully' 
    }, { status: 200 })
  } catch (error) {
    console.error('❌ Error deleting inventory item:', error)
    return NextResponse.json({ 
      error: 'Failed to delete item',
      details: error.message 
    }, { status: 500 })
  }
}
