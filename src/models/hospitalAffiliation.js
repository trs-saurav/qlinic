// src/models/hospitalAffiliation.js
import mongoose from 'mongoose';

const hospitalAffiliationSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'],
    default: 'PENDING'
  },
  requestType: {
    type: String,
    enum: ['DOCTOR_TO_HOSPITAL', 'HOSPITAL_TO_DOCTOR'],
    required: true
  },
  consultationFee: Number,
  availableDays: [String],
  consultationRoomNumber: String,
  startDate: Date,
  endDate: Date,
  notes: String,
  respondedAt: Date,
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

hospitalAffiliationSchema.index({ doctorId: 1, hospitalId: 1 });
hospitalAffiliationSchema.index({ status: 1 });

const HospitalAffiliation = mongoose.models.HospitalAffiliation || mongoose.model('HospitalAffiliation', hospitalAffiliationSchema);

export default HospitalAffiliation;
