// src/app/hospital/layout.jsx
import HospitalNavbar from '@/components/hospital/HospitalNavbar'

export default function HospitalLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <HospitalNavbar hospitalName="City General Hospital" />
      <main className="container mx-auto px-4 py-6 max-w-[1600px]">
        {children}
      </main>
    </div>
  )
}
