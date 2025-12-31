import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// Reusable Point schema (GeoJSON)
const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: undefined,
    },
    coordinates: {
      type: [Number],
      default: undefined,
    },
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    // ✅ Auth fields (Auth.js compatible)
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    emailVerified: { type: Date, default: null },
    
    // Password for credentials login (optional for OAuth)
    password: { 
      type: String,
      select: false, // Don't return password by default
      required: function() {
        // Password required only for credentials auth
        return !this.oauthProviders || this.oauthProviders.length === 0
      }
    },
    
    // ✅ OAuth tracking - support multiple providers
    oauthProviders: [{
      provider: { 
        type: String, 
        enum: ['google', 'facebook', 'apple']
      },
      providerId: String,
      connectedAt: { type: Date, default: Date.now }
    }],

    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },

    // ✅ Updated roles with admin and sub_admin
    role: {
      type: String,
      enum: ['patient', 'doctor', 'hospital_admin', 'admin', 'sub_admin'],
      default: 'patient',
      required: true,
    },

    phoneNumber: { type: String, trim: true },
    profileImage: { type: String, default: '' },

    isActive: { type: Boolean, default: true },
    isProfileComplete: { type: Boolean, default: false },

    lastLogin: { type: Date, default: Date.now },
    deletedAt: { type: Date },

    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },

    // ✅ Admin permissions
    adminPermissions: {
      canManageUsers: { type: Boolean, default: false },
      canManageHospitals: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: false },
      canManageSettings: { type: Boolean, default: false },
      canAccessFinancials: { type: Boolean, default: false },
    },

    // Patient Profile
    patientProfile: {
      dateOfBirth: Date,
      gender: { type: String, enum: ['male', 'female', 'other', null] },
      bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', null] },
      address: { 
        street: String, 
        city: String, 
        state: String, 
        pincode: String, 
        country: { type: String, default: 'India' }
      },
      emergencyContact: String,
      medicalHistory: { type: [String], default: undefined },
      allergies: { type: [String], default: undefined },
      chronicConditions: { type: [String], default: undefined },
      currentMedications: { type: [String], default: undefined },
      insuranceProvider: String,
      insurancePolicyNumber: String,
    },

    // Doctor Profile
    doctorProfile: {
      specialization: String,
      qualification: String,
      qualifications: { type: [String], default: undefined },
      experience: Number,
      licenseNumber: String,
      registrationNumber: String,
      registrationCouncil: String,
      consultationFee: Number,
      about: String,
      languages: { type: [String], default: undefined },
      expertise: { type: [String], default: undefined },
      awards: { type: [String], default: undefined },
      publications: { type: [String], default: undefined },

      location: { type: pointSchema, default: undefined },

      availableDays: { type: [String], default: undefined },
      timeSlots: { type: [{ day: String, startTime: String, endTime: String }], default: undefined },
      isAvailable: { type: Boolean, default: true },

      rating: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
      totalConsultations: { type: Number, default: 0 },

      affiliatedHospitals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }],
      consultationRoomNumber: String,

      isOnlineConsultationAvailable: { type: Boolean, default: false },
      videoConsultationFee: Number,
    },

    // Hospital Admin Profile
    hospitalAdminProfile: {
      hospitalId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Hospital'
      },
      designation: String,
      department: String,
      employeeId: String,
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
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// ✅ Indexes for performance
userSchema.index({ email: 1, role: 1 })
userSchema.index({ 'oauthProviders.provider': 1, 'oauthProviders.providerId': 1 })
userSchema.index({ 'doctorProfile.location': '2dsphere' })
userSchema.index({
  firstName: 'text',
  lastName: 'text',
  'doctorProfile.specialization': 'text',
  'doctorProfile.expertise': 'text',
})
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ 'doctorProfile.affiliatedHospitals': 1 })
userSchema.index({ 'doctorProfile.specialization': 1 })
userSchema.index({ 'doctorProfile.isAvailable': 1 })
userSchema.index({ 'hospitalAdminProfile.hospitalId': 1 })
userSchema.index({ deletedAt: 1 })

// ✅ Pre-save hook: Hash password & clean location
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

    // Clean invalid location for doctors
    if (this.doctorProfile) {
      const loc = this.doctorProfile.location
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
        this.doctorProfile.location = undefined
      }
    }

  } catch (error) {
    next(error)
  }
})

// ✅ Virtual: Short ID (last 8 chars of _id)
userSchema.virtual('shortId').get(function () {
  return this._id ? this._id.toString().slice(-8).toUpperCase() : null
})

// ✅ Virtual: Full name
userSchema.virtual('fullName').get(function () {
  const name = `${this.firstName || ''} ${this.lastName || ''}`.trim()
  return name || this.email.split('@')[0]
})

// ✅ Virtual: Is doctor active
userSchema.virtual('isDoctorActive').get(function () {
  if (this.role === 'doctor' && this.doctorProfile) {
    return this.isActive && this.doctorProfile.isAvailable
  }
  return false
})

// ✅ Virtual: Hospital reference
userSchema.virtual('hospital', {
  ref: 'Hospital',
  localField: 'hospitalAdminProfile.hospitalId',
  foreignField: '_id',
  justOne: true,
})

// =====================================
// INSTANCE METHODS
// =====================================

// ✅ Method: Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false
  return await bcrypt.compare(candidatePassword, this.password)
}

// ✅ Method: Update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date()
  this.lastSeenAt = new Date()
  return await this.save({ validateBeforeSave: false })
}

// ✅ Method: Update location
userSchema.methods.updateLocation = async function (latitude, longitude, address) {
  if (this.role !== 'doctor') {
    throw new Error('Only doctors can have location')
  }

  this.doctorProfile = this.doctorProfile || {}
  this.doctorProfile.location = {
    type: 'Point',
    coordinates: [longitude, latitude],
    ...address,
  }

  return await this.save()
}

// ✅ Method: Check if user has admin/sub-admin role
userSchema.methods.isAdminOrSubAdmin = function () {
  return ['admin', 'sub_admin'].includes(this.role)
}

// ✅ Method: Soft delete
userSchema.methods.softDelete = async function () {
  this.deletedAt = new Date()
  this.isActive = false
  return await this.save()
}

// ✅ Method: Restore soft-deleted user
userSchema.methods.restore = async function () {
  this.deletedAt = null
  this.isActive = true
  return await this.save()
}

// ✅ Method: Safe JSON output (remove password)
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

// =====================================
// STATIC METHODS
// =====================================

// ✅ Static: Find user by email
userSchema.statics.findByEmail = async function (email) {
  return await this.findOne({ email: email.toLowerCase() }).select('+password')
}

// ✅ Static: Find or create OAuth user (Auth.js compatible)
userSchema.statics.findOrCreateOAuthUser = async function (profile, provider) {
  try {
    // First, try to find by OAuth provider + ID
    let user = await this.findOne({ 
      'oauthProviders.provider': provider,
      'oauthProviders.providerId': profile.id 
    })

    if (user) {
      console.log('✅ Existing OAuth user found:', user.email)
      return user
    }

    // Then try to find by email
    user = await this.findByEmail(profile.email)
    
    if (user) {
      // Link OAuth to existing account
      const hasProvider = user.oauthProviders.some(
        p => p.provider === provider && p.providerId === profile.id
      )
      
      if (!hasProvider) {
        user.oauthProviders.push({
          provider,
          providerId: profile.id,
          connectedAt: new Date()
        })
        user.emailVerified = new Date()
        await user.save()
        console.log('✅ OAuth linked to existing user:', user.email)
      }
      
      return user
    }

    // Create new user
    user = await this.create({
      email: profile.email.toLowerCase(),
      firstName: profile.given_name || profile.name?.split(' ')[0] || '',
      lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '',
      profileImage: profile.picture || profile.image || '',
      oauthProviders: [{
        provider,
        providerId: profile.id,
        connectedAt: new Date()
      }],
      emailVerified: new Date(),
      role: 'patient',
      isActive: true,
    })
    
    console.log('✅ New OAuth user created:', user.email)
    return user
  } catch (error) {
    console.error('❌ Error in findOrCreateOAuthUser:', error)
    throw error
  }
}

// ✅ Static: Create user with hashed password
userSchema.statics.createUser = async function (userData) {
  const user = new this(userData)
  await user.save()
  return user
}

// ✅ Static: Find nearby doctors
userSchema.statics.findNearbyDoctors = function (longitude, latitude, maxDistance = 10000, specialization = null) {
  const query = {
    role: 'doctor',
    isActive: true,
    'doctorProfile.isAvailable': true,
    'doctorProfile.location.coordinates': { $exists: true },
  }

  if (specialization) {
    query['doctorProfile.specialization'] = new RegExp(specialization, 'i')
  }

  return this.find(query)
    .where('doctorProfile.location')
    .near({
      center: { type: 'Point', coordinates: [longitude, latitude] },
      maxDistance,
    })
    .limit(20)
}

// ✅ Static: Search doctors by name or specialization
userSchema.statics.searchDoctors = async function (searchQuery, options = {}) {
  const { 
    limit = 20, 
    skip = 0, 
    location = null, 
    maxDistance = 10000,
    sortBy = 'rating'
  } = options

  const query = {
    role: 'doctor',
    isActive: true,
    'doctorProfile.isAvailable': true,
  }

  if (searchQuery) {
    query.$text = { $search: searchQuery }
  }

  let queryBuilder = this.find(query)

  // Location-based search
  if (location && location.longitude && location.latitude) {
    queryBuilder = queryBuilder.where('doctorProfile.location').near({
      center: { 
        type: 'Point', 
        coordinates: [location.longitude, location.latitude] 
      },
      maxDistance,
    })
  }

  // Sorting
  const sortOptions = {
    rating: { 'doctorProfile.rating': -1 },
    experience: { 'doctorProfile.experience': -1 },
    consultations: { 'doctorProfile.totalConsultations': -1 },
    fee: { 'doctorProfile.consultationFee': 1 },
  }

  queryBuilder = queryBuilder
    .sort(sortOptions[sortBy] || sortOptions.rating)
    .limit(limit)
    .skip(skip)

  return await queryBuilder.exec()
}

// ✅ Static: Get active doctors count by specialization
userSchema.statics.getDoctorStats = async function () {
  return await this.aggregate([
    { $match: { role: 'doctor', isActive: true } },
    { 
      $group: { 
        _id: '$doctorProfile.specialization', 
        count: { $sum: 1 },
        avgRating: { $avg: '$doctorProfile.rating' },
        avgFee: { $avg: '$doctorProfile.consultationFee' }
      } 
    },
    { $sort: { count: -1 } }
  ])
}

// ✅ Static: Find active users by role
userSchema.statics.findByRole = async function (role, options = {}) {
  const { limit = 50, skip = 0, includeInactive = false } = options
  
  const query = { role }
  if (!includeInactive) {
    query.isActive = true
  }
  
  return await this.find(query)
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 })
}

// ✅ Static: Get user statistics
userSchema.statics.getUserStats = async function () {
  return await this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: { 
          $sum: { $cond: ['$isActive', 1, 0] } 
        },
        withOAuth: {
          $sum: { 
            $cond: [{ $gt: [{ $size: { $ifNull: ['$oauthProviders', []] } }, 0] }, 1, 0]
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ])
}

const User = mongoose.models.User || mongoose.model('User', userSchema)
export default User
