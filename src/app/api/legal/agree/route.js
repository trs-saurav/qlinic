import { logLegalConsent } from '@/lib/legal/logger';
import { CURRENT_LEGAL_VERSION } from '@/lib/legal/legalConstants'; // Import Constant
import { auth } from '@/auth';

export async function POST(req) {
  const session = await auth(); 
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for");
  const userAgent = req.headers.get("user-agent");

  // Log Terms (Using Constant)
  await logLegalConsent({
    userId: session.user.id,
    documentType: 'TERMS_OF_SERVICE',
    version: CURRENT_LEGAL_VERSION, // <--- Updated
    ip, 
    userAgent
  });

  // Log Privacy (Using Constant)
  await logLegalConsent({
    userId: session.user.id,
    documentType: 'PRIVACY_POLICY',
    version: CURRENT_LEGAL_VERSION, // <--- Updated
    ip, 
    userAgent
  });

  return Response.json({ success: true });
}