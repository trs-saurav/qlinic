import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'Government',
        'Private',
        'Trust',
        'Corporate',
        'Multi-Specialty',
        'Super-Specialty',
      ],
      default: 'Private',
    },
    established: {
      type: Date,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    
    // Contact Information
    contactDetails: {
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
      },
      website: {
        type: String,
        trim: true,
      },
      emergencyNumber: {
        type: String,
      },
      fax: String,
    },

    // Address
    address: {
      street: String,
      landmark: String,
      city: {
        type: String,
        required: true,
        index: true,
      },
      state: {
        type: String,
        required: true,
        index: true,
      },
      country: {
        type: String,
        default: 'India',
      },
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Operating Hours
    operatingHours: {
      Monday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Tuesday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Wednesday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Thursday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Friday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Saturday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: true } 
      },
      Sunday: { 
        open: { type: String, default: '09:00' }, 
        close: { type: String, default: '18:00' }, 
        isOpen: { type: Boolean, default: false } 
      },
      isOpen24x7: {
        type: Boolean,
        default: false,
      },
    },

    // Capacity & Fees
    totalBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    icuBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    emergencyBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    consultationFee: {
      type: Number,
      default: 500,
      min: 0,
    },
    emergencyFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Services & Facilities
    departments: [
      {
        name: String,
        description: String,
        headOfDepartment: String,
        contactNumber: String,
      },
    ],
    
    specialties: [String],
    facilities: [String],
    amenities: [String],
    accreditations: [String],

    emergencyServices: {
      type: Boolean,
      default: false,
    },

    // Insurance
    insurance: {
      accepted: {
        type: Boolean,
        default: false,
      },
      providers: [String],
    },

    // Images
    logo: String,
    images: [String],

    // Additional Info
    websiteUrl: String,

    // References
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    adminUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    
    // Verification System
    verificationRequest: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      requestedAt: Date,
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectionReason: String,
      documents: [
        {
          name: String,
          url: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // Legacy verification (keep for backward compatibility)
    verificationDetails: {
      requestedAt: Date,
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      documents: [
        {
          name: String,
          url: String,
          uploadedAt: Date,
        },
      ],
    },

    // Ratings
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
hospitalSchema.index({ 'address.city': 1, 'address.state': 1 });
hospitalSchema.index({ specialties: 1 });
hospitalSchema.index({ facilities: 1 });
hospitalSchema.index({ type: 1 });
hospitalSchema.index({ isActive: 1, isVerified: 1 });
hospitalSchema.index({ 'verificationRequest.status': 1 });
hospitalSchema.index({ name: 'text', description: 'text' });

// ✅ Virtual: Short ID (last 8 chars of _id)
hospitalSchema.virtual('shortId').get(function () {
  return this._id ? this._id.toString().slice(-8).toUpperCase() : null
});

// ✅ Virtual: Full address
hospitalSchema.virtual('fullAddress').get(function () {
  const addr = this.address
  if (!addr) return ''
  
  const parts = [
    addr.street,
    addr.landmark,
    addr.city,
    addr.state,
    addr.pincode,
    addr.country
  ].filter(Boolean)
  
  return parts.join(', ')
});

// ✅ Virtual: Check if hospital can be edited
hospitalSchema.virtual('canEditBasicInfo').get(function () {
  return !this.isVerified && this.verificationRequest?.status !== 'pending';
});

// ✅ Method: Check profile completeness
hospitalSchema.methods.checkProfileCompletion = function () {
  this.isProfileComplete = !!(
    this.name &&
    this.registrationNumber &&
    this.contactDetails?.phone &&
    this.contactDetails?.email &&
    this.address?.street &&
    this.address?.city &&
    this.address?.state &&
    this.address?.pincode &&
    this.type &&
    this.totalBeds &&
    this.specialties?.length > 0 &&
    this.facilities?.length > 0
  );
  return this.isProfileComplete;
};

// ✅ Pre-save hook
hospitalSchema.pre('save', function () {
  this.checkProfileCompletion();
});

// ✅ Prevent OverwriteModelError in development
const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);

export default Hospital;
