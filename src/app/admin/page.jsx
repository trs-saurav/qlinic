// app/admin/dashboard/page.jsx
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>Admin Dashboard Content</div>
    </ProtectedRoute>
  )
}
