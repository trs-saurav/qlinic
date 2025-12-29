// src/models/InventoryLog.js
import mongoose from 'mongoose'

const inventoryLogSchema = new mongoose.Schema({
  hospitalId: {
    type: String,
    required: true,
    index: true
  },
  inventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['added', 'updated', 'removed', 'restocked', 'used', 'adjusted', 'expired']
  },
  quantityBefore: {
    type: Number
  },
  quantityAfter: {
    type: Number
  },
  quantityChanged: {
    type: Number
  },
  performedBy: {
    userId: String,
    userName: String,
    role: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
})

inventoryLogSchema.index({ hospitalId: 1, createdAt: -1 })
inventoryLogSchema.index({ inventoryId: 1, createdAt: -1 })

export default mongoose.models.InventoryLog || mongoose.model('InventoryLog', inventoryLogSchema)
