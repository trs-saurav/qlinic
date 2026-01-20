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
      sparse: true,
      unique: true,
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
      index: true,
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
      // Keep your existing structure for simple display
      coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 }
      },
    },

    // ✅ FIXED: Removed 'required: true' to allow draft saves
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    },

    // ✅ NEW: City slug for reliable whole-city fallback
    city_slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Media
    logo: { type: String, default: null },
    coverPhoto: { type: String, default: null },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) { return v.length <= 10 },
        message: 'Maximum 10 images allowed'
      }
    },

    // Operating Hours
    operatingHours: {
      Monday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: true } },
      Tuesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: true } },
      Wednesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: true } },
      Thursday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: true } },
      Friday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: true } },
      Saturday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: true } },
      Sunday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: false } },
      isOpen24x7: { type: Boolean, default: false },
    },

    // Capacity & Fees
    totalBeds: { type: Number, default: 0, min: 0 },
    icuBeds: { type: Number, default: 0, min: 0 },
    emergencyBeds: { type: Number, default: 0, min: 0 },
    availableBeds: { type: Number, default: 0, min: 0 },
    
    consultationFee: {
      general: { type: Number, default: 0, min: 0 },
      specialist: { type: Number, default: 0, min: 0 },
      emergency: { type: Number, default: 0, min: 0 },
    },
    
    emergencyFee: { type: Number, default: 0, min: 0 },

    // Services & Facilities
    departments: [
      {
        name: String,
        description: String,
        headOfDepartment: String,
        contactNumber: String,
        floor: String,
      },
    ],
    
    specialties: {
      type: [String],
      default: [],
      index: true,
    },
    
    facilities: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    accreditations: { type: [String], default: [] },
    emergencyServices: { type: [String], default: [] },

    // Insurance
    insurance: {
      accepted: { type: Boolean, default: false },
      providers: { type: [String], default: [] },
    },

    // Additional Info
    websiteUrl: String,

    // References
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    adminUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Status
    isActive: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false, index: true },
    isProfileComplete: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'suspended'],
      default: 'active',
      index: true,
    },
    
    // Verification System
    verificationRequest: {
      status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none', index: true },
      requestedAt: Date,
      reviewedAt: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String,
      documents: [
        {
          name: String,
          url: String,
          type: String,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },

    // Ratings
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    
    // Statistics
    stats: {
      totalDoctors: { type: Number, default: 0 },
      totalStaff: { type: Number, default: 0 },
      totalAppointments: { type: Number, default: 0 },
      totalPatients: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// ✅ INDEXES
hospitalSchema.index({ name: 'text', description: 'text', specialties: 'text' })
hospitalSchema.index({ city_slug: 1, isActive: 1 })
hospitalSchema.index({ 'address.city': 1, isActive: 1, isVerified: 1 })
// This index is vital for the geospatial search
hospitalSchema.index({ 'location': '2dsphere' })

// ✅ Virtuals
hospitalSchema.virtual('shortId').get(function () {
  return this._id ? this._id.toString().slice(-8).toUpperCase() : null
})

hospitalSchema.virtual('fullAddress').get(function () {
  const addr = this.address
  if (!addr) return ''
  const parts = [addr.street, addr.landmark, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean)
  return parts.join(', ')
})

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

// ✅ UPDATED: Profile Completion Check
hospitalSchema.methods.checkProfileCompletion = function () {
  const requiredFields = [
    this.name,
    this.registrationNumber,
    this.contactDetails?.phone,
    this.contactDetails?.email,
    this.address?.street,
    this.address?.city,
    this.address?.state,
    this.address?.pincode,
    // We enforce coordinates here for completion, but NOT in schema for saving
    this.address?.coordinates?.latitude,
    this.address?.coordinates?.longitude,
    this.type,
    this.totalBeds > 0,
    this.specialties?.length > 0,
    this.facilities?.length > 0,
  ]

  const filledFields = requiredFields.filter(field => {
    if (typeof field === 'number') return true; 
    return Boolean(field);
  }).length;

  const completionPercentage = (filledFields / requiredFields.length) * 100
  this.isProfileComplete = completionPercentage >= 80

  return {
    isComplete: this.isProfileComplete,
    percentage: Math.round(completionPercentage)
  }
}

// ✅ Static: Tiered Nearby + City Fallback Search
hospitalSchema.statics.findNearbyPerfect = async function (latitude, longitude, cityName, maxDistance = 5000) {
  // Tier 1: Hyper-Local Search (Nearby GPS)
  let results = await this.find({
    'location': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude] // [lng, lat]
        },
        $maxDistance: maxDistance // Default 5km
      }
    },
    isActive: true
  }).limit(15)

  // Tier 2: Expansion Fallback (Whole City)
  if (results.length === 0 && cityName) {
    const slug = cityName.toLowerCase().replace(/\s+/g, '-')
    results = await this.find({
      $or: [
        { city_slug: slug },
        { 'address.city': new RegExp(cityName, 'i') }
      ],
      isActive: true
    })
    .sort({ isVerified: -1, rating: -1 })
    .limit(20)
  }
  
  return results
}

// ✅ Existing Statics
hospitalSchema.statics.searchHospitals = function (query, filters = {}) {
  const searchQuery = { isActive: true, ...filters }
  if (query) searchQuery.$text = { $search: query }
  return this.find(searchQuery)
    .select('-verificationRequest.documents -stats')
    .sort({ isVerified: -1, rating: -1, totalReviews: -1 })
    .limit(filters.limit || 20)
}

// ✅ Pre-save hook
hospitalSchema.pre('save', function (next) {
  try {
    // 1. Check profile completion (Now safely handles missing coords)
    this.checkProfileCompletion()
    
    // 2. Normalize City Slug for whole-city search
    if (this.address?.city) {
      this.city_slug = this.address.city.toLowerCase().replace(/\s+/g, '-')
    }

    // 3. Sync GeoJSON 'location' with 'address.coordinates'
    if (this.address?.coordinates?.latitude && this.address?.coordinates?.longitude) {
      const { latitude, longitude } = this.address.coordinates
      this.location = {
        type: 'Point',
        coordinates: [longitude, latitude] // MongoDB standard: [lng, lat]
      }
    }

    // 4. Existing logic: Bed validation
    if (this.availableBeds > this.totalBeds) this.availableBeds = this.totalBeds
    if (this.icuBeds + this.emergencyBeds > this.totalBeds) {
      this.icuBeds = 0
      this.emergencyBeds = 0
    }
    
 
  } catch (error) {
    next(error)
  }
})

// ✅ Prevent OverwriteModelError
const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema)

export default Hospital