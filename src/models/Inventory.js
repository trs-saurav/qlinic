// src/models/Inventory.js
import mongoose from 'mongoose'

const inventorySchema = new mongoose.Schema({
  hospitalId: {
    type: String,
    required: true,
    index: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Medical Supplies',
      'Medications',
      'Medical Equipment',
      'Surgical Instruments',
      'Laboratory Supplies',
      'Administrative Supplies',
      'Other'
    ]
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['pieces', 'boxes', 'bottles', 'packets', 'units', 'kg', 'liters', 'ml', 'mg']
  },
  minThreshold: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  reorderPoint: {
    type: Number,
    min: 0
  },
  reorderQuantity: {
    type: Number,
    min: 0
  },
  unitPrice: {
    type: Number,
    min: 0
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  expirationDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'],
    default: 'in-stock'
  },
  lastRestocked: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
})

// Indexes for performance
inventorySchema.index({ hospitalId: 1, sku: 1 }, { unique: true })
inventorySchema.index({ hospitalId: 1, category: 1 })
inventorySchema.index({ hospitalId: 1, status: 1 })
inventorySchema.index({ hospitalId: 1, itemName: 'text', description: 'text' })

// FIX: Update status based on quantity - use < instead of <=
inventorySchema.pre('save', function() {
  if (this.quantity === 0) {
    this.status = 'out-of-stock'
  } else if (this.quantity < this.minThreshold) {
    // Changed from <= to < so quantity = minThreshold is considered in-stock
    this.status = 'low-stock'
  } else {
    this.status = 'in-stock'
  }
})

export default mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema)
