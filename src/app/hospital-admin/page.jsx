import SetupCheck from '@/components/hospital/SetupCheck'
import HospitalDashboard from '@/components/hospital/HospitalDashboard'

export default function HospitalAdminPage() {
  return (
    <SetupCheck>
      <HospitalDashboard />
    </SetupCheck>
  )
}
