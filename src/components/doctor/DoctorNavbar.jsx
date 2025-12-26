'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ModeToggle } from '@/components/extra/ModeToggle'
import { useDoctor } from '@/context/DoctorContextProvider'

import {
  LayoutDashboard,
  Calendar,
  Clock,
  Hospital,
  Settings,
  Bell,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react'

const NAV = [
  { href: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
  { href: '/doctor/schedule', label: 'Schedule', icon: Clock },
  { href: '/doctor/affiliations', label: 'Hospitals', icon: Hospital },
  { href: '/doctor/settings', label: 'Settings', icon: Settings },
]

function isActivePath(pathname, href) {
  if (href === '/doctor') return pathname === '/doctor'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function DoctorNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { unreadCount, dashboard } = useDoctor()

  const nav = useMemo(
    () => NAV.map((i) => ({ ...i, active: isActivePath(pathname, i.href) })),
    [pathname]
  )

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-xl">
      <motion.div
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/doctor" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-bold text-foreground">Qlinic</div>
              <div className="text-xs text-muted-foreground">Doctor Portal</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                    item.active
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>

                  {/* Optional badges */}
                  {item.href === '/doctor/appointments' &&
                    typeof dashboard?.todayAppointments === 'number' &&
                    dashboard.todayAppointments > 0 && (
                      <Badge className="ml-1 h-5 px-2 text-[10px] bg-emerald-600">
                        {dashboard.todayAppointments > 9 ? '9+' : dashboard.todayAppointments}
                      </Badge>
                    )}
                </Link>
              )
            })}
          </nav>

          {/* Right actions (required on top) */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1">
                  <Badge className="h-5 min-w-5 px-1.5 p-0 flex items-center justify-center text-[10px] bg-emerald-600 border border-background">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                </span>
              )}
            </Button>

            <div className="hidden md:block">
              <ModeToggle />
            </div>

            <UserButton afterSignOutUrl="/sign-in" />

            {/* Mobile menu */}
            <button
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-accent"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {nav.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-4 py-3 font-semibold',
                      item.active
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </span>
                  </Link>
                )
              })}

              <div className="flex items-center justify-between rounded-xl px-4 py-3 border-t border-border mt-2">
                <span className="text-sm font-semibold">Theme</span>
                <ModeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
