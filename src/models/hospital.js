// models/hospital.js - OPTIMIZED VERSION
import mongoose from 'mongoose'

const hospitalSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'Government',
        'Private',
        'Trust',
        'Corporate',
        'Multi-Specialty',
        'Super-Specialty',
      ],
      default: 'Private',
      index: true, // Added index
    },
    established: {
      type: Date,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    
    // Contact Information
    contactDetails: {
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
      },
      website: {
        type: String,
        trim: true,
      },
      emergencyNumber: {
        type: String,
      },
      fax: String,
    },

    // Address
    address: {
      street: String,
      landmark: String,
      city: {
        type: String,
        required: true,
        index: true,
      },
      state: {
        type: String,
        required: true,
        index: true,
      },
      country: {
        type: String,
        default: 'India',
      },
      pincode: String,
      coordinates: {
        latitude: {
          type: Number,
          min: -90,
          max: 90
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180
        }
      },
    },

    // Media - FIXED: Removed duplicate logo field
    logo: {
      type: String,
      default: null
    },
    
    coverPhoto: {
      type: String,
      default: null
    },
    
    facilityPhotos: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 6
        },
        message: 'Maximum 6 facility photos allowed'
      }
    },

    // REMOVED: Duplicate images field (use facilityPhotos instead)

    // Operating Hours
    operatingHours: {
      Monday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Tuesday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Wednesday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Thursday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Friday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Saturday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Sunday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: false } 
      },
      isOpen24x7: {
        type: Boolean,
        default: false,
      },
    },

    // Capacity & Fees
    totalBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    icuBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    emergencyBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    consultationFee: {
      type: Number,
      default: 500,
      min: 0,
    },
    emergencyFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Services & Facilities
    departments: [
      {
        name: String,
        description: String,
        headOfDepartment: String,
        contactNumber: String,
      },
    ],
    
    specialties: {
      type: [String],
      default: [],
      index: true, // Added index for search
    },
    facilities: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    accreditations: {
      type: [String],
      default: [],
    },

    emergencyServices: {
      type: Boolean,
      default: false,
    },

    // Insurance
    insurance: {
      accepted: {
        type: Boolean,
        default: false,
      },
      providers: [String],
    },

    // Additional Info
    websiteUrl: String,

    // References
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    adminUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Clerk ID for hospital admin
    adminClerkId: {
      type: String,
      index: true,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    
    // Verification System
    verificationRequest: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
        index: true, // Added index
      },
      requestedAt: Date,
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectionReason: String,
      documents: [
        {
          name: String,
          url: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // Legacy verification (keep for backward compatibility)
    verificationDetails: {
      requestedAt: Date,
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      documents: [
        {
          name: String,
          url: String,
          uploadedAt: Date,
        },
      ],
    },

    // Ratings - FIXED: Use simple numbers for search compatibility
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// ✅ Indexes for better query performance
hospitalSchema.index({ 'address.city': 1, 'address.state': 1 })
hospitalSchema.index({ 'address.city': 1, isActive: 1 })
hospitalSchema.index({ specialties: 1 })
hospitalSchema.index({ facilities: 1 })
hospitalSchema.index({ type: 1 })
hospitalSchema.index({ isActive: 1, isVerified: 1 })
hospitalSchema.index({ isActive: 1, rating: -1 }) // For sorting by rating
hospitalSchema.index({ 'verificationRequest.status': 1 })

// ✅ Text index for search
hospitalSchema.index({ 
  name: 'text', 
  description: 'text',
  'address.city': 'text',
  'address.state': 'text',
  specialties: 'text'
})

// ✅ Geospatial index for location-based search
hospitalSchema.index({ 'address.coordinates': '2dsphere' })

// ✅ Virtual: Short ID (last 8 chars of _id)
hospitalSchema.virtual('shortId').get(function () {
  return this._id ? this._id.toString().slice(-8).toUpperCase() : null
})

// ✅ Virtual: Full address
hospitalSchema.virtual('fullAddress').get(function () {
  const addr = this.address
  if (!addr) return ''
  
  const parts = [
    addr.street,
    addr.landmark,
    addr.city,
    addr.state,
    addr.pincode,
    addr.country
  ].filter(Boolean)
  
  return parts.join(', ')
})

// ✅ Virtual: Is currently open
hospitalSchema.virtual('isCurrentlyOpen').get(function () {
  if (this.operatingHours?.isOpen24x7) return true
  
  const now = new Date()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = dayNames[now.getDay()]
  
  const todayHours = this.operatingHours?.[today]
  if (!todayHours || !todayHours.isOpen) return false
  
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close
})

// ✅ Virtual: Check if hospital can be edited
hospitalSchema.virtual('canEditBasicInfo').get(function () {
  return !this.isVerified && this.verificationRequest?.status !== 'pending'
})

// ✅ Virtual: Available bed percentage
hospitalSchema.virtual('bedAvailabilityPercentage').get(function () {
  if (!this.totalBeds || this.totalBeds === 0) return 0
  return Math.round((this.availableBeds / this.totalBeds) * 100)
})

// ✅ Method: Check profile completeness
hospitalSchema.methods.checkProfileCompletion = function () {
  this.isProfileComplete = !!(
    this.name &&
    this.registrationNumber &&
    this.contactDetails?.phone &&
    this.contactDetails?.email &&
    this.address?.street &&
    this.address?.city &&
    this.address?.state &&
    this.address?.pincode &&
    this.type &&
    this.totalBeds &&
    this.specialties?.length > 0 &&
    this.facilities?.length > 0
  )
  return this.isProfileComplete
}

// ✅ Method: Update rating
hospitalSchema.methods.updateRating = function (newRating) {
  const currentTotal = this.rating * this.totalReviews
  this.totalReviews += 1
  this.rating = (currentTotal + newRating) / this.totalReviews
  return this.save()
}

// ✅ Static: Find nearby hospitals
hospitalSchema.statics.findNearby = function (latitude, longitude, maxDistance = 10000, filters = {}) {
  return this.find({
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true,
    ...filters
  }).limit(20)
}

// ✅ Static: Search hospitals
hospitalSchema.statics.search = function (query, filters = {}) {
  const searchQuery = {
    isActive: true,
    ...filters
  }

  if (query) {
    searchQuery.$text = { $search: query }
  }

  return this.find(searchQuery)
    .sort({ rating: -1, totalReviews: -1 })
    .limit(20)
}

// ✅ Pre-save hook
hospitalSchema.pre('save', function (next) {
  // Check profile completion
  this.checkProfileCompletion()
  
  // Ensure availableBeds doesn't exceed totalBeds
  if (this.availableBeds > this.totalBeds) {
    this.availableBeds = this.totalBeds
  }
  
  // Validate coordinates if provided
  if (this.address?.coordinates?.latitude && this.address?.coordinates?.longitude) {
    const { latitude, longitude } = this.address.coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      this.address.coordinates = { latitude: null, longitude: null }
    }
  }
  
  next()
})

// ✅ Prevent OverwriteModelError in development
const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema)

export default Hospital
