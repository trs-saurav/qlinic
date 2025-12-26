import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'hospital_admin', 'admin'],
      default: 'patient',
      required: true,
    },
    phoneNumber: { type: String, trim: true },
    profileImage: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isProfileComplete: { type: Boolean, default: false },
    lastLogin: { type: Date, default: Date.now },
    deletedAt: { type: Date },

    patientProfile: {
      dateOfBirth: Date,
      gender: { type: String, enum: ['male', 'female', 'other'] },
      bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', null] },
      address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String,
      },
      emergencyContact: String,
      medicalHistory: [String],
      allergies: [String],
      chronicConditions: [String],
      currentMedications: [String],
      insuranceProvider: String,
      insurancePolicyNumber: String,
    },

    doctorProfile: {
      specialization: String,
      qualification: String,
      qualifications: [String],
      experience: Number,
      licenseNumber: String,
      registrationNumber: String,
      registrationCouncil: String,
      consultationFee: Number,
      about: String,
      languages: [String],
      expertise: [String],
      awards: [String],
      publications: [String],
      location: {
        type: { type: String, enum: ['Point'] },
        coordinates: [Number],
        address: String,
        city: String,
        state: String,
        pincode: String,
        country: String,
      },
      availableDays: [String],
      timeSlots: [{ day: String, startTime: String, endTime: String }],
      isAvailable: { type: Boolean, default: true },
      rating: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
      totalConsultations: { type: Number, default: 0 },
      affiliatedHospitals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }],
      consultationRoomNumber: String,
      isOnlineConsultationAvailable: { type: Boolean, default: false },
      videoConsultationFee: Number,
    },

    hospitalAdminProfile: {
      hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
      designation: String,
      joinedAt: { type: Date, default: Date.now },
      permissions: {
        canManageAppointments: { type: Boolean, default: true },
        canManageDoctors: { type: Boolean, default: true },
        canViewReports: { type: Boolean, default: true },
        canManageInventory: { type: Boolean, default: true },
        canManageStaff: { type: Boolean, default: true },
        canManageSettings: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
)

userSchema.index({ 'doctorProfile.location': '2dsphere' }, { sparse: true })
userSchema.index({
  firstName: 'text',
  lastName: 'text',
  'doctorProfile.specialization': 'text',
  'doctorProfile.expertise': 'text',
})
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ 'doctorProfile.affiliatedHospitals': 1 })
userSchema.index({ 'doctorProfile.specialization': 1 })
userSchema.index({ 'doctorProfile.isAvailable': 1 })
userSchema.index({ 'hospitalAdminProfile.hospitalId': 1 })

userSchema.virtual('hospital', {
  ref: 'Hospital',
  localField: 'hospitalAdminProfile.hospitalId',
  foreignField: '_id',
  justOne: true,
})

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim()
})

userSchema.virtual('isDoctorActive').get(function () {
  if (this.role === 'doctor' && this.doctorProfile) {
    return this.isActive && this.doctorProfile.isAvailable
  }
  return false
})

userSchema.methods.updateLocation = function (latitude, longitude, address) {
  if (this.role !== 'doctor') throw new Error('Only doctors can have location')
  this.doctorProfile.location = {
    type: 'Point',
    coordinates: [longitude, latitude],
    ...address,
  }
  return this.save()
}

userSchema.statics.findNearbyDoctors = function (longitude, latitude, maxDistance = 10000, specialization = null) {
  const query = {
    role: 'doctor',
    isActive: true,
    'doctorProfile.isAvailable': true,
    'doctorProfile.location.coordinates': { $exists: true, $ne: [] },
  }

  if (specialization) query['doctorProfile.specialization'] = new RegExp(specialization, 'i')

  return this.find(query)
    .where('doctorProfile.location')
    .near({
      center: { type: 'Point', coordinates: [longitude, latitude] },
      maxDistance,
    })
    .limit(20)
}

userSchema.set('toJSON', { virtuals: true })
userSchema.set('toObject', { virtuals: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)
export default User
