import mongoose, { Schema, models } from 'mongoose';

const ClinicProfileSchema = new Schema({
  clinic_name: { type: String, required: [true, 'Clinic name is required'], trim: true },
  doctor_name: { type: String, required: [true, 'Doctor name is required'], trim: true },
  specialty: { type: String, required: [true, 'Specialty is required'], trim: true }
}, { _id: false });

const LOISubmissionSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  clinic_profile: { type: ClinicProfileSchema, required: true },
  software_usefulness: {
    type: String,
    enum: ['Extremely useful', 'Moderately useful', 'Slightly useful', 'Not useful', 'Unsure', 'Very useful'], // ✅ Fixed
    required: true
  },
  valuable_features: [{ type: String }],
  problem_severity: {
    type: String,
    enum: ['Very serious – affects daily operations', 'Moderate – manageable but inefficient', 'Minor inconvenience', 'Not a problem']
  },
  current_opd_management: {
    type: String,
    enum: ['Fully manual (registers, verbal calling)', 'Partially digital (billing or EMR only)', 'Fully digital software', 'Mixed / workaround system']
  },
  frequent_opd_problems: [{ type: String }],
  willingness_to_use: {
    type: String,
    enum: ['Yes', 'No'] // ✅ Simplified - matches your form
  },
  barriers_to_adoption: [{ type: String }],
  willingness_to_pay: {
    type: String,
    enum: ['Yes', 'No'] // ✅ Simplified - matches your form
  },
  fee_range: {
    type: String,
    enum: ['₹999-₹1,499', '₹1,500-₹2,999', '₹3,000-₹4,999', '₹5,000+']
  },
  recommendation_likelihood: {
    type: String,
    enum: ['Very likely', 'Unlikely']
  },
  signature: { type: String },
  mobile_number: { 
    type: String, 
    required: [true, 'Mobile number is required'],
    match: [/^\d{10}$/, 'Mobile number must be 10 digits']
  },
  submitted_at: { type: Date, default: Date.now },
  email_sent: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'contacted', 'signed'],
    default: 'pending'
  },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// Indexes
LOISubmissionSchema.index({ status: 1, submitted_at: -1 });
LOISubmissionSchema.index({ 'clinic_profile.specialty': 1 });
LOISubmissionSchema.index({ 'mobile_number': 1 });

export default models.LOISubmission || mongoose.model('LOISubmission', LOISubmissionSchema);
