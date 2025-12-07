// app/patient/layout.jsx
import PatientNavbar from '@/components/patient/PatientNavbar1'

export const metadata = {
  title: 'Patient Portal - Qlinic',
  description: 'Manage your health records, appointments, and family members'
}

export default function PatientLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PatientNavbar />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
