import { auth } from "@/auth";
import { checkConsent } from "@/lib/legal/CheckConsent";
import TermsModal from "@/components/auth/TermsModal";

import DoctorNavbar from '@/components/doctor/DoctorNavbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { DoctorProvider } from '@/context/DoctorContextProvider'

export const metadata = {
  title: 'Doctor Portal - Qlinic',
  description: 'Manage your patients, appointments, and hospital affiliations',
}

export default async function DoctorLayout({ children }) {
  const session = await auth();
  
  // Verify if the Doctor has signed the latest Professional Service Agreement
  const hasAgreed = session?.user ? await checkConsent(session.user.id) : true;

  return (
    <ProtectedRoute requiredRole="doctor">
      <DoctorProvider>
        {/* THE GATEKEEPER: Blocks access until the Doctor acknowledges legal terms */}
        {!hasAgreed && <TermsModal userId={session?.user?.id} role="doctor" />}

        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <DoctorNavbar />
          <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </DoctorProvider>
    </ProtectedRoute>
  )
}