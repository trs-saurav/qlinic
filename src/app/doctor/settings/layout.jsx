import DoctorSettingsSidebar from '@/components/doctor/settings/DoctorSettingsSidebar'

export default function DoctorSettingsLayout({ children }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <DoctorSettingsSidebar />
      <section className="min-w-0">{children}</section>
    </div>
  )
}
