// app/patient/dashboard/page.jsx
import ProtectedRoute from '@/components/ProtectedRoute'

export default function PatientDashboard() {
  return (
    <ProtectedRoute requiredRole="patient">
      <div>Patient Dashboard Content</div>
    </ProtectedRoute>
  )
}
