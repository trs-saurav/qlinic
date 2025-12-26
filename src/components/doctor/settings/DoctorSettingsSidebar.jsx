'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  UserCircle,
  Globe,
  Shield,
  Bell,
  CalendarClock,
  IndianRupee,
  WalletCards,
  Receipt,
  FileText,
  Plug,
  ChevronRight,
} from 'lucide-react'

const GROUPS = [
  {
    title: 'Account',
    items: [
      {
        label: 'Profile',
        description: 'Name, photo, specialization',
        href: '/doctor/settings',
        icon: UserCircle,
      },
      {
        label: 'Language & Region',
        description: 'Language, timezone, formats',
        href: '/doctor/settings/language',
        icon: Globe,
      },
      {
        label: 'Privacy & Security',
        description: 'Sessions & account security',
        href: '/doctor/settings/security',
        icon: Shield,
      },
      {
        label: 'Notifications',
        description: 'Email, SMS & app alerts',
        href: '/doctor/settings/notifications',
        icon: Bell,
      },
    ],
  },
  {
    title: 'Practice',
    items: [
      {
        label: 'Availability',
        description: 'Working hours & breaks',
        href: '/doctor/settings/availability',
        icon: CalendarClock,
      },
      {
        label: 'Consultation Fees',
        description: 'OPD & teleconsult pricing',
        href: '/doctor/settings/fees',
        icon: IndianRupee,
        soon: true,
      },
      {
        label: 'Documents',
        description: 'KYC & registration proofs',
        href: '/doctor/settings/documents',
        icon: FileText,
        soon: true,
      },
    ],
  },
  {
    title: 'Billing',
    items: [
      {
        label: 'Payouts',
        description: 'UPI/Bank details & payouts',
        href: '/doctor/settings/payouts',
        icon: WalletCards,
        soon: true,
      },
      {
        label: 'Invoices',
        description: 'Payment history & invoices',
        href: '/doctor/settings/invoices',
        icon: Receipt,
        soon: true,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Integrations',
        description: 'Calendar, WhatsApp, etc.',
        href: '/doctor/settings/integrations',
        icon: Plug,
        soon: true,
      },
    ],
  },
]

function isActivePath(pathname, href) {
  if (href === '/doctor/settings') return pathname === '/doctor/settings'
  return pathname === href || pathname.startsWith(href + '/')
}

function NavRow({ item, active }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={(e) => {
        if (item.soon) e.preventDefault()
      }}
      aria-disabled={item.soon}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors',
        'hover:bg-accent/60',
        active && 'bg-emerald-50 dark:bg-emerald-950/30',
        item.soon && 'opacity-70'
      )}
    >
      <div
        className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center border bg-background',
          active ? 'border-emerald-200 dark:border-emerald-900' : 'border-border'
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
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm font-semibold truncate',
              active ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'
            )}
          >
            {item.label}
          </p>
          {item.soon && (
            <Badge variant="secondary" className="h-5 px-2 text-[10px]">
              Coming soon
            </Badge>
          )}
        </div>
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
}

export default function DoctorSettingsSidebar({ issuesCount = 0 }) {
  const pathname = usePathname()

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
            Profile, practice and billing preferences
          </p>
        </div>

        <Separator />

        <nav className="p-2 space-y-3">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 pb-2 pt-1">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {group.title}
                </p>
              </div>

              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavRow
                    key={item.href}
                    item={item}
                    active={isActivePath(pathname, item.href)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
