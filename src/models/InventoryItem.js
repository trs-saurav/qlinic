// src/models/InventoryItem.js
import mongoose from 'mongoose'

const InventoryItemSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['MEDICINE', 'CONSUMABLE', 'EQUIPMENT'],
    required: true
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0
  },
  minStockLevel: {
    type: Number,
    required: true,
    default: 10
  },
  unit: {
    type: String,
    default: 'Units'
  },
  expiryDate: {
    type: Date
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

export default mongoose.models.InventoryItem || mongoose.model('InventoryItem', InventoryItemSchema)
