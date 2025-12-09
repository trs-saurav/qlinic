// src/components/hospital/HospitalNavbar.jsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { 
  Home, Calendar, Users, Stethoscope, Package, 
  MessageSquare, Settings, Bell, Menu, X, BarChart3,
  ClipboardList, DollarSign, FileText, Hospital
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// src/components/hospital/HospitalNavbar.jsx
const navigationTabs = [
  { id: 'OVERVIEW', label: 'Overview', icon: Home, href: '/hospital-admin' },
  { id: 'RECEPTION', label: 'Reception', icon: ClipboardList, href: '/hospital-admin/reception' },
  { id: 'APPOINTMENTS', label: 'Appointments', icon: Calendar, href: '/hospital-admin/appointments' },
  { id: 'STAFF', label: 'Staff', icon: Stethoscope, href: '/hospital-admin/staff' },
  { id: 'PATIENTS', label: 'Patients', icon: Users, href: '/hospital-admin/patients' },
  { id: 'INVENTORY', label: 'Inventory', icon: Package, href: '/hospital-admin/inventory' },
  { id: 'FEEDBACK', label: 'Feedback', icon: MessageSquare, href: '/hospital-admin/feedback' },
  { id: 'REPORTS', label: 'Reports', icon: BarChart3, href: '/hospital-admin/reports' },
  { id: 'SETTINGS', label: 'Settings', icon: Settings, href: '/hospital-admin/settings' }
]



export default function HospitalNavbar({ hospitalName = "My Hospital" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useUser()

  const isActive = (href) => pathname === href

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Logo + Hospital Name */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link href="/hospital" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Hospital className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {hospitalName}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Hospital Administration</p>
                </div>
              </Link>
            </div>

            {/* Right: Notifications + User */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {user?.firstName || 'Admin'}
                </span>
              </div>

              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9"
                  }
                }}
              />
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon
              const active = isActive(tab.href)
              
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                    active
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-slate-900 shadow-2xl animate-slide-in-left overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2">
                {navigationTabs.map((tab) => {
                  const Icon = tab.icon
                  const active = isActive(tab.href)
                  
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                        active
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
