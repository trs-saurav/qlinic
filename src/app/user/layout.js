import { auth } from "@/auth";
import { checkConsent } from "@/lib/legal/CheckConsent";
import TermsModal from "@/components/auth/TermsModal";

import PatientNavbar from '@/components/user/PatientNavbar1'; 
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserProvider } from '@/context/UserContext';


export const metadata = {
  title: 'Patient Portal - Qlinic',
  description: 'Manage your health records, appointments, and family members'
};

// Make the component async to fetch session/consent on the server
export default async function PatientLayout({ children }) {
  const session = await auth();
  
  // Check consent on the server side. 
  // If no session exists, we default to 'true' so we don't block the redirect that ProtectedRoute will trigger.
  const hasAgreed = session?.user ? await checkConsent(session.user.id) : true;

  return (
    <ProtectedRoute requiredRole="user">
      <UserProvider>
        {/* THE GATEKEEPER: Blocks screen if terms aren't signed */}
        {!hasAgreed && <TermsModal userId={session?.user?.id} role="PATIENT" />}

        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <PatientNavbar/>
          <main className="w-full"> 
            {children}
          </main>
        </div>
      </UserProvider>
    </ProtectedRoute>
  );
}