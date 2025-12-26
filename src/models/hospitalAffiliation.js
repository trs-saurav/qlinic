// src/models/hospitalAffiliation.js
import mongoose from 'mongoose'

const timeSlotSchema = new mongoose.Schema(
  {
    start: { type: String, required: true }, // "HH:mm"
    end: { type: String, required: true },   // "HH:mm"
    room: { type: String, default: '' },
  },
  { _id: false }
)

const weeklyDaySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      required: true,
    },
    slots: { type: [timeSlotSchema], default: [] },
  },
  { _id: false }
)

const dateOverrideSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD"
    unavailable: { type: Boolean, default: false },
    slots: { type: [timeSlotSchema], default: [] },
    reason: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByRole: { type: String, default: '' }, // 'doctor' | 'hospital_admin'
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const hospitalAffiliationSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },

    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'],
      default: 'PENDING',
    },

    requestType: {
      type: String,
      enum: ['DOCTOR_TO_HOSPITAL', 'HOSPITAL_TO_DOCTOR'],
      required: true,
    },

    consultationFee: Number,
    availableDays: [String], // legacy (optional)
    consultationRoomNumber: String,
    startDate: Date,
    endDate: Date,
    notes: String,

    respondedAt: Date,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ✅ NEW: scheduling
    weeklySchedule: { type: [weeklyDaySchema], default: [] },
    dateOverrides: { type: [dateOverrideSchema], default: [] },

    // ✅ audit
    lastScheduleUpdatedAt: Date,
    lastScheduleUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastScheduleUpdatedByRole: String,
  },
  { timestamps: true }
)

// ✅ Make unique to prevent duplicates [web:583]
hospitalAffiliationSchema.index({ doctorId: 1, hospitalId: 1 }, { unique: true })
hospitalAffiliationSchema.index({ status: 1 })

const HospitalAffiliation =
  mongoose.models.HospitalAffiliation ||
  mongoose.model('HospitalAffiliation', hospitalAffiliationSchema)

export default HospitalAffiliation
