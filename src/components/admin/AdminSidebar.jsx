// components/admin/Sidebar.jsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  Calendar,
  MessageSquare,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  UserCog,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
    active: true
  },
  {
    label: 'Users',
    icon: Users,
    href: '/admin/users',
    active: true
  },
  {
    label: 'Doctors',
    icon: Stethoscope,
    href: '/admin/doctors',
    badge: 5, // Pending verifications
    active: true
  },
  {
    label: 'Hospitals',
    icon: Building2,
    href: '/admin/hospitals',
    badge: 2, // Pending approvals
    active: true
  },
  {
    label: 'Appointments',
    icon: Calendar,
    href: '/admin/appointments',
    active: false, // Not implemented yet
    comingSoon: true
  },
  {
    label: 'Support',
    icon: MessageSquare,
    href: '/admin/support',
    badge: 12, // Unresolved tickets
    active: true
  },
  {
    label: 'Finance',
    icon: DollarSign,
    href: '/admin/finance',
    active: true,
    permission: 'VIEW_FINANCE' // Only show if admin has permission
  },
  {
    label: 'Content',
    icon: FileText,
    href: '/admin/content',
    active: true
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    active: true
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/admin/settings',
    active: true
  },
  {
    label: 'Admin Users',
    icon: UserCog,
    href: '/admin/admin-users',
    active: true,
    superAdminOnly: true
  }
]

export default function AdminSidebar({ userRole, userPermissions }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (item.superAdminOnly && userRole !== 'super_admin') return false
    if (item.permission && !userPermissions?.includes(item.permission)) return false
    return true
  })

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300',
        collapsed ? 'w-20' : 'w-64',
        // Light mode
        'bg-white border-r border-gray-200',
        // Dark mode
        'dark:bg-gray-900 dark:border-gray-800'
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-500">
                Qlinic
              </span>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-1">
                Admin Portal
              </p>
            </div>
          </Link>
        )}
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isDisabled = !item.active

          return (
            <Link
              key={item.href}
              href={isDisabled ? '#' : item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                // Active state
                isActive && !isDisabled && 'bg-blue-50 dark:bg-blue-900/20',
                // Hover state (not active and not disabled)
                !isActive && !isDisabled && 'hover:bg-gray-100 dark:hover:bg-gray-800',
                // Disabled state
                isDisabled && 'opacity-50 cursor-not-allowed',
                // Collapsed state
                collapsed && 'justify-center'
              )}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault()
                }
              }}
            >
              {/* Icon */}
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors flex-shrink-0',
                  isActive && !isDisabled
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                )}
              />

              {/* Label */}
              {!collapsed && (
                <>
                  <span
                    className={cn(
                      'flex-1 text-sm font-medium transition-colors',
                      isActive && !isDisabled
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    )}
                  >
                    {item.label}
                  </span>

                  {/* Badge (notifications/counts) */}
                  {item.badge && !isDisabled && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                      {item.badge}
                    </span>
                  )}

                  {/* Coming Soon Badge */}
                  {item.comingSoon && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Soon
                    </span>
                  )}
                </>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
                  {item.label}
                  {item.comingSoon && ' (Coming Soon)'}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile Section (Bottom) */}
      <div className={cn(
        'p-4 border-t border-gray-200 dark:border-gray-800',
        collapsed && 'px-2'
      )}>
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">A</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                Admin User
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Super Admin
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
