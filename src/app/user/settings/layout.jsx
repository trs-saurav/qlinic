'use client'

import { useState } from 'react'
import UserSettingsSidebar from '@/components/user/settings/UserSettingsSidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function UserSettingsLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  // Get current page title for mobile header
  const getPageTitle = () => {
    const parts = pathname.split('/')
    const page = parts[parts.length - 1]
    return page.charAt(0).toUpperCase() + page.slice(1)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto flex items-start gap-8 px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Desktop Sidebar (Hidden on Mobile) */}
        <div className="hidden lg:block w-80 shrink-0 sticky top-24">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                <UserSettingsSidebar />
            </div>
        </div>

        {/* Mobile Sidebar Trigger (Visible on Mobile) */}
        <div className="lg:hidden mb-6 w-full flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {getPageTitle() === 'Settings' ? 'Settings' : getPageTitle()}
            </h1>
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Menu
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[300px]">
                    <UserSettingsSidebar onItemClick={() => setIsMobileOpen(false)} />
                </SheetContent>
            </Sheet>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
             <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px] p-6">
                {children}
             </div>
        </div>
      </div>
    </div>
  )
}
