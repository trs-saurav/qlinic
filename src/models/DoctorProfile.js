// src/models/DoctorProfile.js
import mongoose from 'mongoose'

// Reusable Point schema (GeoJSON)
const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true, // [longitude, latitude]
    },
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
  },
  { _id: false }
)

const doctorProfileSchema = new mongoose.Schema(
  {
    // ============ LINK TO USER ============
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      unique: true
    },

    // ============ QUALIFICATIONS ============
    specialization: { type: String, required: true },
    qualification: String, // Single string for backward compatibility
    qualifications: { type: [String], default: undefined }, // Array: ["MBBS", "MD", "DM"]
    experience: Number, // Years
    
    licenseNumber: { type: String, unique: true, sparse: true },
    registrationNumber: String,
    registrationCouncil: String,

    // ============ CONSULTATION ============
    consultationFee: { type: Number, default: 0 },
    isOnlineConsultationAvailable: { type: Boolean, default: false },
    videoConsultationFee: Number,

    // ============ PROFILE ============
    about: String,
    languages: { type: [String], default: undefined },
    expertise: { type: [String], default: undefined },
    awards: { type: [String], default: undefined },
    publications: { type: [String], default: undefined },

    // ============ LOCATION (for map search) ============
    location: { type: pointSchema, default: undefined },

    // ============ AVAILABILITY ============
    availableDays: { type: [String], default: undefined },
    timeSlots: { 
      type: [{ 
        day: String, 
        startTime: String, 
        endTime: String 
      }], 
      default: undefined 
    },
    isAvailable: { type: Boolean, default: true },

    // ============ STATS ============
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalConsultations: { type: Number, default: 0 },

    // ============ HOSPITAL AFFILIATIONS ============
    affiliatedHospitals: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Hospital' 
    }],
    consultationRoomNumber: String,

    isActive: { type: Boolean, default: true },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// ============ INDEXES ============
doctorProfileSchema.index({ userId: 1 })
doctorProfileSchema.index({ specialization: 1, isAvailable: 1 })
doctorProfileSchema.index({ affiliatedHospitals: 1 })
doctorProfileSchema.index({ location: '2dsphere' })
doctorProfileSchema.index({
  specialization: 'text',
  expertise: 'text',
})

// ============ PRE-SAVE: CLEAN INVALID LOCATION ============
doctorProfileSchema.pre('save', function () {
  try {
    if (this.location) {
      const loc = this.location
      const coords = loc?.coordinates

      const isValidPoint =
        loc &&
        loc.type === 'Point' &&
        Array.isArray(coords) &&
        coords.length === 2 &&
        typeof coords[0] === 'number' &&
        typeof coords[1] === 'number' &&
        !isNaN(coords[0]) &&
        !isNaN(coords[1])

      if (!isValidPoint) {
        this.location = undefined
      }
    }
  } catch (error) {
    console.error('Error in DoctorProfile pre-save hook:', error)
  }
})

// ============ VIRTUAL: Active Status ============
doctorProfileSchema.virtual('isDoctorActive').get(function () {
  return this.isActive && this.isAvailable
})

const DoctorProfile = mongoose.models.DoctorProfile || mongoose.model('DoctorProfile', doctorProfileSchema)
export default DoctorProfile
