// src/models/user.js
import mongoose from 'mongoose';

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
  medicalHistory: [String],
  allergies: [String],
  chronicConditions: [String],
  currentMedications: [String],
  insuranceProvider: String,
  insurancePolicyNumber: String
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
    },
    isAvailable: {  // ← ADDED: For reception desk to check if doctor is available
      type: Boolean,
      default: true
    },
    consultationRoomNumber: String  // ← ADDED: Optional room number
  },
  
  hospitalAdminProfile: {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: function() { 
        return this.role === 'hospital_admin'; 
      }
    },
    designation: String,
    permissions: {  // ← ADDED: Optional granular permissions
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
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'doctorProfile.hospitalId': 1 }); // ← ADDED: For faster doctor queries
userSchema.index({ 'hospitalAdminProfile.hospitalId': 1 }); // ← ADDED: For faster admin queries

// Virtual fullName
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual to check if doctor is currently available
userSchema.virtual('isDoctorActive').get(function() {
  if (this.role === 'doctor' && this.doctorProfile) {
    return this.isActive && this.doctorProfile.isAvailable;
  }
  return false;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
