// src/models/appointment.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    required: true
  },
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
  notes: String,
  synced: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

appointmentSchema.index({ hospitalId: 1, scheduledTime: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

export default Appointment;
