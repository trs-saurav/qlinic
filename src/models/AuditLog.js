import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  actorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }, 
  action: { 
    type: String, 
    required: true 
    // Example: "LOGIN", "VIEW_PATIENT", "RX_CREATE"
  }, 
  targetId: { 
    type: String, 
    required: false 
    // Example: PatientID or AppointmentID
  }, 
  ipAddress: String,
  metadata: {
    type: Map,
    of: String
    // Optional: Store extra details like "Browser version" or "Failed attempt reason"
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    expires: '365d' // Optional: Auto-delete logs older than 1 year to save space
  }
});

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);