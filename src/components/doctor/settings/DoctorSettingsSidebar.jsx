'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Bell,
  Shield,
  Calendar,
  CreditCard,
  ImageIcon,
  HelpCircle,
  Info,
  ChevronRight,
  Lock,
  Check
} from 'lucide-react'

const SETTINGS_NAV = [
  {
    label: 'Profile',
    description: 'Personal details & contact',
    href: '/doctor/settings/profile',
    icon: User,
  },
  {
    label: 'Notifications',
    description: 'Email, SMS & app alerts',
    href: '/doctor/settings/notifications',
    icon: Bell,
  },
  {
    label: 'Privacy & Security',
    description: 'Data sharing & access control',
    href: '/doctor/settings/security',
    icon: Shield,
  },
  {
    label: 'Availability',
    description: 'Manage working hours & schedule',
    href: '/doctor/settings/availability',
    icon: Calendar,
  },
  {
    label: 'Billing',
    description: 'Payment methods & invoices',
    href: '/doctor/settings/billing',
    icon: CreditCard,
  },
  {
    label: 'Appearance',
    description: 'Theme & display preferences',
    href: '/doctor/settings/appearance',
    icon: ImageIcon,
    soon: true,
  },
]

const HELP_NAV = [
  {
    label: 'Help & Support',
    description: 'Get help and contact support',
    href: '/doctor/settings/help',
    icon: HelpCircle,
  },
  {
    label: 'About Qlinic',
    description: 'Version and system info',
    href: '/doctor/about',
    icon: Info,
  },
]

export default function DoctorSettingsSidebar({ onNavigate }) {
  const pathname = usePathname()

  const isActive = (href) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleClick = (item) => {
    if (item.soon) return
    if (onNavigate) {
      setTimeout(() => onNavigate(), 100)
    }
  }

  return (
    <aside className="w-full lg:w-[320px] shrink-0">
      {/* Main Settings Card */}
      <div className="rounded-2xl lg:border lg:bg-white/80 lg:dark:bg-slate-900/80 lg:backdrop-blur-sm lg:shadow-xl overflow-hidden">
        
        {/* Header - Desktop Only */}
        <div className="hidden lg:block p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-b border-emerald-100 dark:border-emerald-900">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Settings
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Manage your account
          </p>
        </div>

        {/* Settings List */}
        <nav className="lg:p-2">
          <ul className="space-y-0 lg:space-y-1">
            {SETTINGS_NAV.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              if (item.soon) {
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      disabled
                      className="w-full flex items-center gap-4 px-4 lg:px-3 py-4 lg:py-3.5 lg:rounded-xl bg-white dark:bg-slate-900 lg:bg-transparent border-b lg:border-0 border-slate-100 dark:border-slate-800 opacity-60 cursor-not-allowed active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                    >
                      {/* Icon - Material Design Style */}
                      <div className="w-10 h-10 lg:w-10 lg:h-10 rounded-lg lg:rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        <Lock className="w-5 h-5 text-slate-400" />
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.label}
                          </p>
                          <Badge 
                            variant="secondary" 
                            className="h-5 px-2 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          >
                            Soon
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => handleClick(item)}
                    className={cn(
                      'group flex items-center gap-4 px-4 lg:px-3 py-4 lg:py-3.5 lg:rounded-xl transition-all duration-200',
                      'active:scale-[0.98] lg:active:scale-100',
                      // Mobile: Full-width with border
                      'bg-white dark:bg-slate-900 border-b lg:border-0 border-slate-100 dark:border-slate-800',
                      // Active state
                      active
                        ? 'lg:bg-gradient-to-r lg:from-emerald-500 lg:to-teal-500 lg:text-white lg:shadow-lg lg:shadow-emerald-500/25 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'lg:hover:bg-emerald-50 lg:dark:hover:bg-emerald-950/50 active:bg-slate-50 dark:active:bg-slate-800/50'
                    )}
                  >
                    {/* Active Indicator - Desktop Only */}
                    {active && (
                      <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-white rounded-r-full shadow-lg" />
                    )}

                    {/* Icon - Material Design 48dp touch target */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                        active
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 lg:bg-white/20 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 group-active:scale-95'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5 transition-colors',
                          active
                            ? 'text-emerald-600 dark:text-emerald-400 lg:text-white'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                        )}
                      />
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            'text-sm font-semibold truncate',
                            active ? 'text-emerald-700 dark:text-emerald-300 lg:text-white' : 'text-slate-900 dark:text-slate-100'
                          )}
                        >
                          {item.label}
                        </p>
                        {/* Check Mark - Desktop Only */}
                        {active && (
                          <Check className="hidden lg:block w-4 h-4 text-white flex-shrink-0" />
                        )}
                      </div>
                      <p
                        className={cn(
                          'text-xs truncate mt-0.5',
                          active
                            ? 'text-emerald-600 dark:text-emerald-400 lg:text-emerald-100'
                            : 'text-slate-500 dark:text-slate-400'
                        )}
                      >
                        {item.description}
                      </p>
                    </div>

                    {/* Chevron - Material Design Pattern */}
                    <ChevronRight
                      className={cn(
                        'w-5 h-5 flex-shrink-0 transition-all',
                        active
                          ? 'text-emerald-600 dark:text-emerald-400 lg:text-white translate-x-0.5'
                          : 'text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                      )}
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Divider - Desktop Only */}
        <div className="hidden lg:block h-px bg-slate-200 dark:bg-slate-800 mx-2 my-2" />

        {/* Help & About Section */}
        <nav className="lg:p-2 mt-4 lg:mt-0">
          <ul className="space-y-0 lg:space-y-1">
            {HELP_NAV.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => handleClick(item)}
                    className={cn(
                      'group flex items-center gap-4 px-4 lg:px-3 py-4 lg:py-3.5 lg:rounded-xl transition-all duration-200',
                      'active:scale-[0.98] lg:active:scale-100',
                      'bg-white dark:bg-slate-900 border-b lg:border-0 border-slate-100 dark:border-slate-800',
                      active
                        ? 'lg:bg-blue-50 lg:dark:bg-blue-950 bg-blue-50 dark:bg-blue-950/30'
                        : 'lg:hover:bg-blue-50 lg:dark:hover:bg-blue-950/50 active:bg-slate-50 dark:active:bg-slate-800/50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                        active
                          ? 'bg-blue-100 dark:bg-blue-900 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-active:scale-95'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          active
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-semibold truncate',
                          active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-100'
                        )}
                      >
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        'w-5 h-5 flex-shrink-0 transition-transform',
                        'group-hover:translate-x-1',
                        active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                      )}
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer - Desktop Only */}
        <div className="hidden lg:block p-4 pt-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <p className="text-[10px] text-center text-slate-500 dark:text-slate-400">
            Qlinic v1.0.0
          </p>
        </div>
      </div>
    </aside>
  )
}
