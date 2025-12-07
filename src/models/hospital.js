// src/models/hospital.js
import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  contactDetails: {
    phone: String,
    email: String,
    website: String,
    emergencyNumber: String
  },
  type: {
    type: String,
    enum: ['Government', 'Private', 'Trust', 'Corporate'],
    default: 'Private'
  },
  departments: [{
    name: String,
    headOfDepartment: String,
    bedCount: Number
  }],
  facilities: [String], // e.g., ICU, Emergency, Pharmacy, Lab, etc.
  operatingHours: {
    openTime: String,
    closeTime: String,
    isOpen24x7: {
      type: Boolean,
      default: false
    }
  },
  totalBeds: Number,
  totalDoctors: Number,
  established: Date,
  accreditations: [String], // e.g., NABH, NABL, ISO
  isActive: {
    type: Boolean,
    default: true
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  logo: String,
  images: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

hospitalSchema.index({ 'address.city': 1 });
hospitalSchema.index({ 'address.state': 1 });
hospitalSchema.index({ name: 'text' });

const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);

export default Hospital;
