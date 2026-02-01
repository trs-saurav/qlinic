import mongoose from 'mongoose';

const ConsentLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  documentType: {
    type: String,
    enum: ['TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'HIPAA_AGREEMENT'],
    required: true
  },
  version: {
    type: String, 
    required: true // e.g. "1.0"
  },
  ipAddress: String,   
  userAgent: String,   
  agreedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound Index: Ensures a user cannot have duplicate logs for the SAME version of the SAME doc
ConsentLogSchema.index({ userId: 1, documentType: 1, version: 1 }, { unique: true });

export default mongoose.models.ConsentLog || mongoose.model('ConsentLog', ConsentLogSchema);