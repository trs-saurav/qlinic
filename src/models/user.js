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

    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    
    // ✅ NEW: Date of Birth added here
    dateOfBirth: { type: Date },

    role: {
      type: String,
      enum: ['user', 'doctor', 'hospital_admin', 'admin', 'sub_admin'],
      default: 'user',
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
      // dateOfBirth removed from here since it's now at root, 
      // but you can keep it here if your logic strictly looks here.
      // I recommend using the root one for simplicity.
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
    console.error('Error in pre-save hook:', error)
  }
})

// ✅ Virtuals and Methods (Kept same as provided)
userSchema.virtual('shortId').get(function () {
  return this._id ? this._id.toString().slice(-8).toUpperCase() : null
})

userSchema.virtual('fullName').get(function () {
  const name = `${this.firstName || ''} ${this.lastName || ''}`.trim()
  return name || this.email.split('@')[0]
})

userSchema.virtual('isDoctorActive').get(function () {
  if (this.role === 'doctor' && this.doctorProfile) {
    return this.isActive && this.doctorProfile.isAvailable
  }
  return false
})

userSchema.virtual('hospital', {
  ref: 'Hospital',
  localField: 'hospitalAdminProfile.hospitalId',
  foreignField: '_id',
  justOne: true,
})

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
