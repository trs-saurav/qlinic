'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DoctorSettingsSidebar from '@/components/doctor/settings/DoctorSettingsSidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Settings, ArrowLeft, ChevronLeft } from 'lucide-react'

export default function DoctorSettingsLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Get current page title from pathname
  const getPageTitle = () => {
    const titles = {
      '/doctor/settings/profile': 'Profile Settings',
      '/doctor/settings/notifications': 'Notifications',
      '/doctor/settings/security': 'Privacy & Security',
      '/doctor/settings/availability': 'Availability',
      '/doctor/settings/billing': 'Billing',
      '/doctor/settings/appearance': 'Appearance',
      '/doctor/settings/help': 'Help & Support'
    }
    return titles[pathname] || 'Settings'
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto lg:px-6 lg:py-6">
        
        {/* Mobile Header - Sticky */}
        <div className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center h-14 px-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="sr-only">Go back</span>
            </Button>

            {/* Page Title */}
            <h1 className="flex-1 font-bold text-slate-900 dark:text-slate-100 text-base truncate">
              {getPageTitle()}
            </h1>

            {/* Menu Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-transform"
                >
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open settings menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[85vw] max-w-[320px] p-0 border-0"
              >
                <div className="h-full bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-y-auto">
                  {/* Drawer Header */}
                  <div className="sticky top-0 z-10 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 py-6 mb-4">
                    <div className="flex items-center gap-3 text-white">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <Settings className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="font-bold text-xl">Settings</h2>
                        <p className="text-emerald-100 text-sm">Manage your account</p>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Content */}
                  <div className="px-4 pb-6">
                    <DoctorSettingsSidebar onNavigate={() => setIsOpen(false)} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Settings
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your account preferences
              </p>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] lg:gap-6">
          {/* Desktop Sidebar - Hidden on Mobile */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <DoctorSettingsSidebar />
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="min-w-0">
            {/* Mobile: No padding (full bleed), Desktop: Normal */}
            <div className="lg:px-0">
              {children}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
