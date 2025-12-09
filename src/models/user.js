// src/models/user.js (Complete corrected version)
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'hospital_admin', 'admin'],
    default: 'patient',
    required: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isProfileComplete: { // ✅ ADDED
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date
  },
  
  // Patient Profile
  patientProfile: {
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', null]
    },
    address: String,
    emergencyContact: String,
    medicalHistory: [String],
    allergies: [String],
    chronicConditions: [String],
    currentMedications: [String],
    insuranceProvider: String,
    insurancePolicyNumber: String
  },
  
  // Doctor Profile
  doctorProfile: {
    specialization: String,
    qualification: String,
    experience: Number,
    licenseNumber: String, // ✅ Medical registration number
    consultationFee: Number,
    about: String, // ✅ ADDED
    languages: [String], // ✅ ADDED
    availableDays: [String],
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    consultationRoomNumber: String
  },
  
  // Hospital Admin Profile
  hospitalAdminProfile: {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: function() { 
        return this.role === 'hospital_admin'
      }
    },
    designation: String,
    permissions: {
      canManageAppointments: {
        type: Boolean,
        default: true
      },
      canManageDoctors: {
        type: Boolean,
        default: false
      },
      canViewReports: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
})

// Indexes
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ 'doctorProfile.hospitalId': 1 })
userSchema.index({ 'hospitalAdminProfile.hospitalId': 1 })

// Virtual fullName
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim()
})

// Virtual to check if doctor is currently available
userSchema.virtual('isDoctorActive').get(function() {
  if (this.role === 'doctor' && this.doctorProfile) {
    return this.isActive && this.doctorProfile.isAvailable
  }
  return false
})

userSchema.set('toJSON', { virtuals: true })
userSchema.set('toObject', { virtuals: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User
