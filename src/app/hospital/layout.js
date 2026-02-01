
import { checkConsent } from "@/lib/legal/CheckConsent";
import TermsModal from "@/components/auth/TermsModal";

import HospitalNavbar from '@/components/hospital/HospitalNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { HospitalAdminProvider } from '@/context/HospitalAdminContext';
import { auth } from '@/auth';

export const metadata = {
  title: 'Hospital Admin Portal - Qlinic',
};

export default async function HospitalAdminLayout({ children }) {
  const session = await auth();
  
  // Check if the Admin has agreed to the latest DPDP/Terms
  const hasAgreed = session?.user ? await checkConsent(session.user.id) : true;

  return (
    <ProtectedRoute requiredRole="hospital_admin">
      <HospitalAdminProvider>
        {/* THE GATEKEEPER: Blocks the dashboard for non-compliant admins */}
        {!hasAgreed && <TermsModal userId={session?.user?.id} role="hospital_admin" />}

        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <HospitalNavbar />
          <main className="container mx-auto px-4 py-6 max-w-[1600px]">
            {children}
          </main>
        </div>
      </HospitalAdminProvider>
    </ProtectedRoute>
  );
}