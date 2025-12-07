// src/models/medicalRecord.js
import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  familyMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember'
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'Lab Report',
      'Prescription',
      'X-Ray',
      'MRI Scan',
      'CT Scan',
      'Ultrasound',
      'ECG',
      'Blood Test',
      'Vaccination',
      'Discharge Summary',
      'Other'
    ],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: String,
  fileSize: Number,
  date: {
    type: Date,
    required: true
  },
  notes: String,
  uploadedBy: {
    type: String,
    default: 'Patient'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

medicalRecordSchema.index({ userId: 1 });
medicalRecordSchema.index({ familyMemberId: 1 });

const MedicalRecord = mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
