// src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
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
    trim: true
  },
  lastName: {
    type: String,
    trim: true
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
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Role-specific fields
  patientProfile: {
    dateOfBirth: Date,
    gender: String,
    bloodGroup: String,
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

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ clerkId: 1 });
userSchema.index({ role: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
