'use client'

import { HospitalAdminProvider } from '@/context/HospitalAdminContext'
import HospitalNavbar from '@/components/hospital/HospitalNavbar'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function HospitalAdminLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="hospital_admin">
      <HospitalAdminProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <HospitalNavbar />
          <main className="container mx-auto px-4 py-6 max-w-[1600px]">
            {children}
          </main>
        </div>
      </HospitalAdminProvider>
    </ProtectedRoute>
  )
}
