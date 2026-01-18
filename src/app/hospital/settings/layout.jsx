import SettingsSidebar from '@/components/hospital/settings/SettingsSidebar'

export default function HospitalAdminSettingsLayout({ children }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <aside className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar pr-1">
        <SettingsSidebar />
      </aside>

      <div className="lg:hidden">
        <SettingsSidebar />
      </div>

      <section className="min-w-0">{children}</section>
    </div>
  )
}
