import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        'nurse',
        'technician',
        'pharmacist',
        'receptionist',
        'lab_assistant',
        'radiologist',
        'cleaner',
        'security',
        'admin',
      ],
      index: true,
    },
    department: {
      type: String,
      trim: true,
    },
    salary: {
      type: Number,
      min: 0,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
staffSchema.index({ hospitalId: 1, isActive: 1 });
staffSchema.index({ hospitalId: 1, role: 1 });

export default mongoose.models.Staff || mongoose.model('Staff', staffSchema);
