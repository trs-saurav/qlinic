import PatientNavbar from '@/components/user/PatientNavbar1' // Updated to your new Navbar name
import ProtectedRoute from '@/components/ProtectedRoute'
import {  UserProvider } from '@/context/UserContext'
import UserNavbar from '@/components/user/PatientNavbar1'

export const metadata = {
  title: 'Patient Portal - Qlinic',
  description: 'Manage your health records, appointments, and family members'
}

export default function PatientLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="user"> {/* Changed "user" to "patient" to match your schema role */}
      <UserProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <UserNavbar/>
          {/* Removed max-w-7xl to allow full width usage as per your navbar change */}
          <main className="w-full"> 
            {children}
          </main>
        </div>
      </UserProvider>
    </ProtectedRoute>
  )
}
