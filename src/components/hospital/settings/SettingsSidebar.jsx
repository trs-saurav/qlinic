'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  Globe,
  Shield,
  Bell,
  Users,
  CreditCard,
  HelpCircle,
  Info,
  ChevronRight,
  UserCog,
  ImageIcon
} from 'lucide-react'

const SETTINGS_NAV = [
  {
    label: 'Hospital Profile',
    description: 'Manage hospital details & info',
    href: '/hospital-admin/settings',
    icon: Building2,
  },
  // In your settings navigation array
{
  label: 'Media & Gallery',
  description: 'Profile photos & practice gallery',
  href: '/hospital-admin/settings/media',
  icon: ImageIcon, // or Camera, Images
},

  {
    label: 'Language & Region',
    description: 'Language, timezone & preferences',
    href: '/hospital-admin/settings/language',
    icon: Globe,
  },
  {
    label: 'Privacy & Security',
    description: 'Data sharing & access control',
    href: '/hospital-admin/settings/privacy',
    icon: Shield,
  },
  {
    label: 'Notifications',
    description: 'Email, SMS & app alerts',
    href: '/hospital-admin/settings/notifications',
    icon: Bell,
  },
  {
    label: 'Staff Management',
    description: 'Roles & permissions',
    href: '/hospital-admin/settings/staff',
    icon: Users,
  },
  {
    label: 'Billing & Payments',
    description: 'Payment methods & invoices',
    href: '/hospital-admin/settings/billing',
    icon: CreditCard,
  },
]

export default function SettingsSidebar({ issuesCount = 0 }) {
  const pathname = usePathname()

  const isActive = (href) => {
    // makes "/settings" active for nested routes too, unless another item matches better
    if (href === '/hospital-admin/settings') {
      return pathname === href || pathname.startsWith('/hospital-admin/settings/')
    }
    return pathname === href
  }

  return (
    <aside className="w-full lg:w-[320px] shrink-0">
      <div className="rounded-2xl border bg-background shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Settings</h2>

            {issuesCount > 0 && (
              <Badge variant="destructive" className="h-6 px-2 text-[11px]">
                {issuesCount} issue{issuesCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage hospital configuration
          </p>
        </div>

        <Separator />

        <nav className="p-2">
          {SETTINGS_NAV.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors',
                  'hover:bg-accent/60',
                  active && 'bg-emerald-50 dark:bg-emerald-950/30'
                )}
              >
                <div
                  className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center border bg-background',
                    active
                      ? 'border-emerald-200 dark:border-emerald-900'
                      : 'border-border'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-semibold truncate',
                      active ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'
                    )}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>

                <ChevronRight
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    active ? 'translate-x-0' : 'group-hover:translate-x-0.5'
                  )}
                />
              </Link>
            )
          })}

          {/* Sub Users - Coming Soon */}
          <button
            type="button"
            disabled
            className={cn(
              'w-full mt-1 group flex items-center gap-3 rounded-xl px-3 py-3 text-left',
              'opacity-70 cursor-not-allowed hover:bg-accent/30'
            )}
            title="Coming soon"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center border bg-background">
              <UserCog className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">Sub Users</p>
                <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                  Coming soon
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Add receptionist/accounts sub-logins
              </p>
            </div>
          </button>
        </nav>

        <Separator />

        {/* Bottom section */}
        <div className="p-2">
          <Link
            href="/hospital-admin/support"
            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-accent/60 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center border bg-background">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">Help & Support</p>
              <p className="text-xs text-muted-foreground truncate">
                Get help and contact support
              </p>
            </div>
          </Link>

          <Link
            href="/hospital-admin/about"
            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-accent/60 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center border bg-background">
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">About Qlinic</p>
              <p className="text-xs text-muted-foreground truncate">
                Version and system info
              </p>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  )
}
