// src/models/appointment.js
import mongoose from 'mongoose'

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'patientModel'
  },
  patientModel: {
    type: String,
    required: true,
    enum: ['User', 'FamilyMember'],
    default: 'User' // ✅ ADDED DEFAULT
  },
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
  tokenNumber: {
    type: Number,
  },
  skipCount: {
    type: Number,
    default: 0
  },
  lastSkippedAt: Date,
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'CANCELLED'],
    default: 'BOOKED'
  },
  type: {
    type: String,
    enum: ['REGULAR', 'EMERGENCY', 'FOLLOW_UP'],
    default: 'REGULAR'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'REFUNDED'],
    default: 'PENDING'
  },
  vitals: {
    temperature: String,
    weight: String,
    bpSystolic: String,
    bpDiastolic: String,
    spo2: String,
    heartRate: String
  },
  diagnosis: String,
  prescription: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  prescriptionFileUrl: String,
  notes: String,
  nextVisit: {
    date: Date,
    reason: String,
    instructions: String
  },
  reason: { type: String },
  instructions: { type: String },
  cancelReason: { type: String },
  cancelledBy: {
    type: String,
    enum: ['patient', 'doctor', 'hospital_admin']
  },
  cancelledAt: Date,
  consultationStartTime: Date,
  consultationEndTime: Date,
  synced: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Indexes
appointmentSchema.index({ hospitalId: 1, scheduledTime: 1 })
appointmentSchema.index({ patientId: 1 })
appointmentSchema.index({ doctorId: 1, scheduledTime: 1 })
appointmentSchema.index({ status: 1 })
appointmentSchema.index({ tokenNumber: 1, hospitalId: 1 })

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema)

export default Appointment
