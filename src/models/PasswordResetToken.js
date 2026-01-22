// models/PasswordResetToken.js
import mongoose from 'mongoose'

const passwordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Fast lookup by userId
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true, // Fast lookup by token
  },
  email: {
    type: String,
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true, // Fast expiry queries
  },
}, {
  timestamps: true,
})

export default mongoose.models.PasswordResetToken || mongoose.model('PasswordResetToken', passwordResetTokenSchema)
