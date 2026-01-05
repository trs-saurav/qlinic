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

    // Media
    logo: {
      type: String,
      default: null
    },
    
    coverPhoto: {
      type: String,
      default: null
    },
    
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 10
        },
        message: 'Maximum 10 images allowed'
      }
    },

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
    
    // ✅ FIX: consultationFee as object with nested fields
    consultationFee: {
      general: {
        type: Number,
        default: 0,
        min: 0,
      },
      specialist: {
        type: Number,
        default: 0,
        min: 0,
      },
      emergency: {
        type: Number,
        default: 0,
        min: 0,
      },
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
        floor: String,
      },
    ],
    
    specialties: {
      type: [String],
      default: [],
      index: true,
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

    // ✅ FIX: emergencyServices as array of strings or objects
    emergencyServices: {
      type: [String],
      default: [],
    },
    
    // OR if you need more detail:
    // emergencyServices: [{
    //   name: String,
    //   available: { type: Boolean, default: true },
    //   contact: String,
    //   description: String,
    // }],

    // Insurance
    insurance: {
      accepted: {
        type: Boolean,
        default: false,
      },
      providers: {
        type: [String],
        default: [],
      },
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
    
    adminUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // ✅ REMOVED: adminClerkId (not needed with Auth.js)

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
    
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'suspended'],
      default: 'active',
      index: true,
    },
    
    // Verification System
    verificationRequest: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
        index: true,
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
          type: String, // e.g., 'registration', 'license', 'tax'
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // Ratings
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

// ✅ Indexes for better query performance
hospitalSchema.index({ name: 'text', description: 'text', specialties: 'text' })
hospitalSchema.index({ 'address.city': 1, 'address.state': 1 })
hospitalSchema.index({ 'address.city': 1, isActive: 1, isVerified: 1 })
hospitalSchema.index({ type: 1, isActive: 1 })
hospitalSchema.index({ isActive: 1, rating: -1 })
hospitalSchema.index({ adminUsers: 1 })

// ✅ Geospatial index for location-based search
hospitalSchema.index({ 'address.coordinates': '2dsphere' })

// ✅ Virtual: Short ID
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
  const requiredFields = [
    this.name,
    this.registrationNumber,
    this.contactDetails?.phone,
    this.contactDetails?.email,
    this.address?.street,
    this.address?.city,
    this.address?.state,
    this.address?.pincode,
    this.type,
    this.totalBeds > 0,
    this.specialties?.length > 0,
    this.facilities?.length > 0,
  ]

  const filledFields = requiredFields.filter(Boolean).length
  const completionPercentage = (filledFields / requiredFields.length) * 100
  
  this.isProfileComplete = completionPercentage >= 80

  return {
    isComplete: this.isProfileComplete,
    percentage: Math.round(completionPercentage),
    filledFields,
    totalFields: requiredFields.length,
    missingFields: requiredFields.reduce((acc, field, index) => {
      const fieldNames = [
        'name', 'registrationNumber', 'phone', 'email', 
        'street', 'city', 'state', 'pincode', 'type',
        'totalBeds', 'specialties', 'facilities'
      ]
      if (!field) acc.push(fieldNames[index])
      return acc
    }, [])
  }
}

// ✅ Method: Update rating
hospitalSchema.methods.updateRating = async function (newRating) {
  if (newRating < 0 || newRating > 5) {
    throw new Error('Rating must be between 0 and 5')
  }
  
  const currentTotal = this.rating * this.totalReviews
  this.totalReviews += 1
  this.rating = Number(((currentTotal + newRating) / this.totalReviews).toFixed(2))
  
  return await this.save()
}

// ✅ Method: Update statistics
hospitalSchema.methods.updateStats = async function () {
  const User = mongoose.model('User')
  const Appointment = mongoose.model('Appointment')

  try {
    const [doctors, appointments, patients] = await Promise.all([
      User.countDocuments({ 
        'doctorProfile.affiliatedHospitals': this._id,
        role: 'doctor',
        isActive: true
      }),
      Appointment.countDocuments({ hospitalId: this._id }),
      Appointment.distinct('patientId', { hospitalId: this._id })
    ])

    this.stats.totalDoctors = doctors
    this.stats.totalAppointments = appointments
    this.stats.totalPatients = patients.length

    await this.save()
    return this.stats
  } catch (error) {
    console.error('Error updating hospital stats:', error)
    throw error
  }
}

// ✅ Static: Find nearby hospitals
hospitalSchema.statics.findNearby = function (latitude, longitude, maxDistance = 10000, filters = {}) {
  const query = {
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
  }
  
  return this.find(query).limit(20)
}

// ✅ Static: Search hospitals
hospitalSchema.statics.searchHospitals = function (query, filters = {}) {
  const searchQuery = {
    isActive: true,
    ...filters
  }

  if (query) {
    searchQuery.$text = { $search: query }
  }

  return this.find(searchQuery)
    .select('-verificationRequest.documents -stats')
    .sort({ isVerified: -1, rating: -1, totalReviews: -1 })
    .limit(filters.limit || 20)
    .skip(filters.skip || 0)
}

// ✅ Static: Find by city
hospitalSchema.statics.findByCity = function (city, options = {}) {
  const query = {
    'address.city': new RegExp(city, 'i'),
    isActive: true,
  }

  if (options.isVerified !== undefined) {
    query.isVerified = options.isVerified
  }

  return this.find(query)
    .sort({ rating: -1 })
    .limit(options.limit || 20)
}

// ✅ Static: Get hospital statistics
hospitalSchema.statics.getHospitalStats = async function (filters = {}) {
  const query = { isActive: true, ...filters }
  
  return await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        totalBeds: { $sum: '$totalBeds' },
        verified: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ])
}

// ✅ Pre-save hook
hospitalSchema.pre('save', function () {
  try {
    // Check profile completion
    this.checkProfileCompletion()
    
    // Ensure availableBeds doesn't exceed totalBeds
    if (this.availableBeds > this.totalBeds) {
      this.availableBeds = this.totalBeds
    }
    
    // Ensure ICU and emergency beds don't exceed total
    if (this.icuBeds + this.emergencyBeds > this.totalBeds) {
      this.icuBeds = 0
      this.emergencyBeds = 0
    }
    
    // Validate coordinates if provided
    if (this.address?.coordinates?.latitude && this.address?.coordinates?.longitude) {
      const { latitude, longitude } = this.address.coordinates
      if (
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180 ||
        isNaN(latitude) || isNaN(longitude)
      ) {
        this.address.coordinates = { latitude: null, longitude: null }
      }
    }
    
  } catch (error) {
    next(error)
  }
})

// ✅ Prevent OverwriteModelError
const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema)

export default Hospital
