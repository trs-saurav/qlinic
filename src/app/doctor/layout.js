// app/doctor/layout.jsx
import DoctorNavbar from '@/components/doctor/DoctorNavbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { DoctorProvider } from '@/context/DoctorContextProvider'

export const metadata = {
  title: 'Doctor Portal - Qlinic',
  description: 'Manage your patients, appointments, and hospital affiliations',
}

export default function DoctorLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="doctor">
      <DoctorProvider>
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
