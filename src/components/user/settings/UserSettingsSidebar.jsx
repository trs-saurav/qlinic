'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Shield,
  Bell,
  Globe,
  HelpCircle,
  Info,
  CreditCard,
  FileText,
  ChevronRight,
  Smartphone,
  Group
} from 'lucide-react'

const SETTINGS_GROUPS = [
  {
    title: 'Account',
    items: [
      {
        label: 'Profile',
        href: '/user/settings/profile',
        icon: User,
        description: 'Personal details & photo'
      },
      {
        label: 'Security',
        href: '/user/settings/security',
        icon: Shield,
        description: 'Password & 2FA'
      },
      {
        label: 'Family Members',
        href: '/user/settings/family',
        icon: Group,
        description: 'Manage family members'
      },
      {
        label: 'Medical Records',
        href: '/user/settings/records',
        icon: FileText,
        description: 'Manage health documents'
      },
      {
        label: 'Billing & Payments',
        href: '/user/settings/billing',
        icon: CreditCard,
        description: 'Invoices & payment methods'
      }
    ]
  },
  {
    title: 'App Settings',
    items: [
      {
        label: 'Notifications',
        href: '/user/settings/notifications',
        icon: Bell,
        description: 'Push & email alerts'
      },
      {
        label: 'Language',
        href: '/user/settings/language',
        icon: Globe,
        description: 'English (US)'
      }
    ]
  },
  {
    title: 'Support',
    items: [
      {
        label: 'Help & Support',
        href: '/user/settings/help',
        icon: HelpCircle,
        description: 'FAQs & contact support'
      },
      {
        label: 'About Qlinic',
        href: '/user/settings/about',
        icon: Info,
        description: 'Version 2.4.0'
      }
    ]
  }
]

export default function UserSettingsSidebar({ className, onItemClick }) {
  const pathname = usePathname()

  return (
    <aside className={cn("bg-white dark:bg-slate-950 h-full flex flex-col", className)}>
      <div className="flex-1 overflow-y-auto py-6 px-4">
        {SETTINGS_GROUPS.map((group, groupIndex) => (
          <div key={group.title} className="mb-8">
            <h3 className="mb-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200",
                      isActive 
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" 
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                      isActive 
                        ? "bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-blue-400" 
                        : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{item.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight className={cn(
                      "h-4 w-4 text-slate-400 transition-transform",
                      isActive && "text-blue-500"
                    )} />
                  </Link>
                )
              })}
            </div>
            {groupIndex < SETTINGS_GROUPS.length - 1 && (
              <Separator className="mt-6 bg-slate-100 dark:bg-slate-800" />
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex-1">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100">Qlinic App</p>
                <p className="text-[10px] text-slate-500">v2.4.0 (Build 2024)</p>
            </div>
        </div>
      </div>
    </aside>
  )
}
