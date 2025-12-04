// app/hospital-admin/dashboard/page.jsx
import ProtectedRoute from '@/components/ProtectedRoute'

export default function HospitalAdminDashboard() {
  return (
    <ProtectedRoute requiredRole="hospital_admin">
      <div>Hospital Admin Dashboard Content</div>
    </ProtectedRoute>
  )
}
