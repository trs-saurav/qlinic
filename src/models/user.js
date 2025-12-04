// src/models/user.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    // ❌ Remove: index: true (already defined below)
  },
  email: {
    type: String,
    required: true,
    unique: true,  // ← This automatically creates an index
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
  lastLogin: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date
  },
  // Role-specific fields
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
    medicalHistory: [String]
  },
  doctorProfile: {
    specialization: String,
    qualification: String,
    experience: Number,
    licenseNumber: String,
    consultationFee: Number,
    availableDays: [String],
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    }
  },
  hospitalAdminProfile: {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    designation: String
  }
}, {
  timestamps: true
});

// Indexes - Only define here, not in field definitions
// Note: email and clerkId already have indexes from "unique: true"
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual fullName
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
