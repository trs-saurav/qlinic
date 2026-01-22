// app/admin/layout.js
import AdminNavbar from '@/components/admin/AdminNavbar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminFooter from '@/components/admin/AdminFooter'
import ProtectedRoute from '@/components/ProtectedRoute'

export const metadata = {
  title: 'Admin Portal - Qlinic',
  description: 'Manage users, doctors, hospitals, and platform operations'
}

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <AdminSidebar />
        <div className="pl-64 flex flex-col min-h-screen">
          <AdminNavbar />
          <main className="pt-16 p-6 w-full flex-1">
            {children}
          </main>
          <AdminFooter />
        </div>
      </div>
    </ProtectedRoute>
  )
}
