// src/models/HospitalAdminProfile.js
import mongoose from 'mongoose'

const hospitalAdminProfileSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
    },
    hospitalId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Hospital',
      required: false,  // ✅ Changed to false
      index: true,
      default: null     // ✅ Add default
    },

    designation: String,
    department: String,
    employeeId: { 
      type: String, 
      unique: true, 
      sparse: true,
      index: true  // ✅
    },
    joinedAt: { type: Date, default: Date.now },

    permissions: {
      canManageDoctors: { type: Boolean, default: true },
      canManageStaff: { type: Boolean, default: true },
      canManageInventory: { type: Boolean, default: true },
      canViewReports: { type: Boolean, default: true },
      canManageSettings: { type: Boolean, default: false },
      canApproveLeave: { type: Boolean, default: false },
      canManageFinances: { type: Boolean, default: false },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Indexes (no duplicates)
hospitalAdminProfileSchema.index({ hospitalId: 1, isActive: 1 })
hospitalAdminProfileSchema.index({ userId: 1, hospitalId: 1 }, { unique: true, sparse: true })

const HospitalAdminProfile = mongoose.models.HospitalAdminProfile || mongoose.model('HospitalAdminProfile', hospitalAdminProfileSchema)
export default HospitalAdminProfile