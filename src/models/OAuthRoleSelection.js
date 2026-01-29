// src/models/OAuthRoleSelection.js
// Temporary storage for role selection during OAuth flow
// Expires automatically after 15 minutes

import mongoose from 'mongoose'

const oauthRoleSelectionSchema = new mongoose.Schema(
  {
    // Unique token to link client to role selection
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Role selected by user
    role: {
      type: String,
      enum: ['user', 'doctor', 'hospital_admin'],
      required: true,
    },

    // Email (optional, for reference)
    email: String,

    // Auto-delete after 15 minutes
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900, // 15 minutes
    },
  },
  { timestamps: true }
)

const OAuthRoleSelection =
  mongoose.models.OAuthRoleSelection ||
  mongoose.model('OAuthRoleSelection', oauthRoleSelectionSchema)

export default OAuthRoleSelection
