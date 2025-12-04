// app/doctor/dashboard/page.jsx
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DoctorDashboard() {
  return (
    <ProtectedRoute requiredRole="doctor">
      <div>Doctor Dashboard Content</div>
    </ProtectedRoute>
  )
}
