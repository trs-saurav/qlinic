// src/models/familyMember.js
import mongoose from 'mongoose';

const familyMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  relationship: {
    type: String,
    enum: ['Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other'],
    required: true
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
bloodGroup: {
  type: String,
  enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', null],
  default: null  // ✅ Add default null
},

  phoneNumber: String,
  email: String,
  address: String,
  emergencyContact: String,
  medicalHistory: [String],
  allergies: [String],
  currentMedications: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

familyMemberSchema.index({ userId: 1 });

const FamilyMember = mongoose.models.FamilyMember || mongoose.model('FamilyMember', familyMemberSchema);

export default FamilyMember;
