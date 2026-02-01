import ConsentLog from '@/models/ConsentLog';
import AuditLog from '@/models/AuditLog';
import connectDB from '@/config/db';

/**
 * Records a legal agreement AND automatically creates an Audit Trail.
 */
export async function logLegalConsent({ userId, documentType, version, ip, userAgent }) {
  // FIX 1: Ensure function call has ()
  await connectDB(); 

  let newConsent = null;

  // --- STEP 1: CREATE CONSENT ---
  try {
    const existing = await ConsentLog.findOne({ userId, documentType, version });
    
    if (!existing) {
      newConsent = await ConsentLog.create({
        userId,
        documentType,
        version,
        ipAddress: ip,
        userAgent
      });
      console.log(`[Legal] Consent logged for User ${userId}`);
    } else {
      // If it exists, we don't need to audit again, so we stop here.
      return;
    }
  } catch (error) {
    if (error.code !== 11000) {
      console.error("[Legal] Failed to log consent:", error);
    }
    // If 11000 (duplicate), we just ignore it and move on
    return;
  }

  // --- STEP 2: CREATE AUDIT LOG (In a separate block) ---
  // We only run this if newConsent was successfully created
  if (newConsent) {
    try {
      await AuditLog.create({
        actorId: userId,
        action: `AGREED_TO_${documentType}`,
        targetId: newConsent._id,
        ipAddress: ip,
        metadata: {
          version: version,
          mechanism: "AUTO_LOG_ON_CONSENT",
          userAgent: userAgent
        }
      });
      console.log(`[Audit] Auto-created audit log for ${documentType}`);
    } catch (auditError) {
      // Now this will ALWAYS show up if the Audit fails
      console.error("[Audit] FAILED to create auto-log:", auditError);
    }
  }
}

export async function logAudit({ actorId, action, targetId, ip, metadata = {} }) {
  await connectDB();
  
  try {
    await AuditLog.create({
      actorId,
      action,
      targetId,
      ipAddress: ip,
      metadata
    });
  } catch (error) {
    console.error(`[Audit] Failed to log action ${action}:`, error);
  }
}