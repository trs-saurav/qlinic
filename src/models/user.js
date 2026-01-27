// src/models/User.js
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    // ============ AUTH FIELDS ============
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    emailVerified: { type: Date, default: null },
    
    password: { 
      type: String,
      select: false,
      required: function() {
        return !this.oauthProviders || this.oauthProviders.length === 0
      }
    },
    
    oauthProviders: [{
      provider: { 
        type: String, 
        enum: ['google', 'facebook', 'apple']
      },
      providerId: String,
      connectedAt: { type: Date, default: Date.now }
    }],

    // ============ IDENTITY ============
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    phoneNumber: { 
  type: String, 
  unique: true,     // ← Enforces unique
  sparse: true,     // ← Should allow multiple nulls
  index: true 
},

    
    role: {
      type: String,
      enum: ['user', 'doctor', 'hospital_admin', 'admin', 'sub_admin'],
      default: 'user',
      required: true,
    },

    profileImage: { type: String, default: '' },

    // ============ ACCOUNT STATUS ============
    isActive: { type: Boolean, default: true },
    isProfileComplete: { type: Boolean, default: false },
    isWalkInCreated: { type: Boolean, default: false }, // Marks reception-created accounts
    requiresPasswordChange: { type: Boolean, default: false }, // Forces password reset on first login
    
    lastLogin: { type: Date, default: Date.now },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },

    // ============ ADMIN PERMISSIONS (only for role='admin') ============
    adminPermissions: {
      canManageUsers: { type: Boolean, default: false },
      canManageHospitals: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: false },
      canManageSettings: { type: Boolean, default: false },
      canAccessFinancials: { type: Boolean, default: false },
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// ============ INDEXES ============
userSchema.index({ email: 1, role: 1 })
userSchema.index({ phoneNumber: 1 }, { sparse: true })
userSchema.index({ role: 1, isActive: 1 })
userSchema.index({ 'oauthProviders.provider': 1, 'oauthProviders.providerId': 1 })
userSchema.index({ deletedAt: 1 })

// ============ PRE-SAVE HOOKS ============
userSchema.pre('save', async function () {
  try {
    // Hash password if modified
    if (this.isModified('password') && this.password) {
      const salt = await bcrypt.genSalt(10)
      this.password = await bcrypt.hash(this.password, salt)
    }

    // Auto-assign admin permissions
    if (this.role === 'admin' && !this.adminPermissions.canManageUsers) {
      this.adminPermissions = {
        canManageUsers: true,
        canManageHospitals: true,
        canViewAnalytics: true,
        canManageSettings: true,
        canAccessFinancials: true,
      }
    }
  } catch (error) {
    console.error('Error in User pre-save hook:', error)
  }
})

// ============ VIRTUALS ============
userSchema.virtual('shortId').get(function () {
  return this._id ? this._id.toString().slice(-8).toUpperCase() : null
})

userSchema.virtual('fullName').get(function () {
  const name = `${this.firstName || ''} ${this.lastName || ''}`.trim()
  return name || this.email.split('@')[0]
})

// ============ METHODS ============
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false
  return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

const User = mongoose.models.User || mongoose.model('User', userSchema)
export default User
