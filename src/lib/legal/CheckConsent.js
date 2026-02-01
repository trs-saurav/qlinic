import connectDB from '@/config/db'; // Matching your import style
import ConsentLog from '@/models/ConsentLog';
import { CURRENT_LEGAL_VERSION, REQUIRED_DOCS } from '@/lib/legal/legalConstants';

/**
 * Checks if a user has agreed to ALL required documents for the CURRENT version.
 * Returns true (Approved) or false (Blocked).
 */
export async function checkConsent(userId) {
  if (!userId) return false;
  
  await connectDB();

  try {
    // Find all logs for this user matching the current version
    const logs = await ConsentLog.find({
      userId: userId,
      version: CURRENT_LEGAL_VERSION,
      documentType: { $in: REQUIRED_DOCS }
    }).select('documentType').lean();

    // Check if we found unique records for both TERMS and PRIVACY
    const uniqueDocs = new Set(logs.map(log => log.documentType));
    
    // If the user has agreed to everything in REQUIRED_DOCS, they pass.
    return uniqueDocs.size === REQUIRED_DOCS.length;

  } catch (error) {
    console.error("Error checking consent:", error);
    return false; // Fail safe: Block access if DB fails
  }
}