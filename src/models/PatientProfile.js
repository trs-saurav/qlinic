// src/models/PatientProfile.js
import mongoose from 'mongoose'

const patientProfileSchema = new mongoose.Schema(
  {
    // ============ LINK TO USER ============
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      unique: true,
      index: true  // ✅ Add index here
    },

    // ============ UNIQUE IDENTIFIER (across all hospitals) ============
    qlinicId: { 
      type: String, 
      unique: true, 
      required: false,  // ✅ MUST BE FALSE
      sparse: true      // ✅ ADD THIS
    },

    // ============ DEMOGRAPHICS ============
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', null] },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', null] },
    
    // ============ CONTACT & ADDRESS ============
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    
    emergencyContact: String,

    // ============ MEDICAL HISTORY ============
    medicalHistory: { type: [String], default: undefined },
    allergies: { type: [String], default: undefined },
    chronicConditions: { type: [String], default: undefined },
    currentMedications: { type: [String], default: undefined },

    // ============ INSURANCE ============
    insuranceProvider: String,
    insurancePolicyNumber: String,

    // ============ VISIT STATS (auto-updated) ============
    totalVisits: { type: Number, default: 0 },
    lastVisitDate: { type: Date },
    lastVisitHospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },

    // ============ FAMILY LINK (for dependents) ============
    primaryAccountHolder: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      default: null 
    },

    isActive: { type: Boolean, default: true },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// ============ INDEXES (NO DUPLICATES) ============
// ❌ REMOVED: patientProfileSchema.index({ userId: 1 }) - already indexed above
patientProfileSchema.index({ qclinicId: 1 }, { unique: true, sparse: true })
patientProfileSchema.index({ lastVisitDate: -1 })
patientProfileSchema.index({ 'address.city': 1, 'address.state': 1 })

// ============ AUTO-GENERATE QCLINIC ID ============
// ✅✅✅ CHANGED FROM pre('save') TO pre('validate') ✅✅✅
patientProfileSchema.pre('validate', async function (next) {
  try {
    if (this.isNew && !this.qlinicId) {
      console.log('🔢 [PRE-VALIDATE] Generating qlinicId...')
      
      const PatientProfile = mongoose.models.PatientProfile || mongoose.model('PatientProfile', patientProfileSchema)
      const count = await PatientProfile.countDocuments()
      const year = new Date().getFullYear()
      
      this.qlinicId = `QL${year}${String(count + 1).padStart(6, '0')}`
      console.log(`✅ [PRE-VALIDATE] Generated: ${this.qlinicId}`)
    }
    
  } catch (error) {
    console.error('❌ [PRE-VALIDATE] Error:', error)
    
  }
})

// ============ VIRTUAL: Full Address ============
patientProfileSchema.virtual('fullAddress').get(function () {
  if (!this.address) return ''
  const { street, city, state, pincode } = this.address
  return [street, city, state, pincode].filter(Boolean).join(', ')
})

const PatientProfile = mongoose.models.PatientProfile || mongoose.model('PatientProfile', patientProfileSchema)
export default PatientProfile
