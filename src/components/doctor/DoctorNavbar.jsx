'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

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
  LogOut,
  User,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)

  const { unreadCount, dashboard, refreshAll } = useDoctor()

  // Scroll effect for formal transparency handling
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const nav = useMemo(
    () => NAV.map((i) => ({ ...i, active: isActivePath(pathname, i.href) })),
    [pathname]
  )

const handleSignOut = async () => {
  // Forces redirect to Doctor Sign-In
  await signOut({ callbackUrl: '/sign-in?role=doctor' })
}

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 border-b",
        scrolled 
          ? "bg-white/95 backdrop-blur-md border-slate-200 shadow-sm dark:bg-slate-950/95 dark:border-slate-800" 
          : "bg-white border-transparent dark:bg-slate-950"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          
          {/* BRAND */}
          <Link href="/doctor" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="block text-lg font-bold text-slate-900 dark:text-white tracking-tight">Qlinic</span>
              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Doctor Portal</span>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-full border border-slate-100 dark:border-slate-800">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    item.active
                      ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-blue-400 dark:ring-slate-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200'
                  )}
                >
                  <Icon className={cn("w-4 h-4", item.active ? "stroke-[2.5px]" : "stroke-2")} />
                  <span>{item.label}</span>
                  
                  {/* Badge Logic */}
                  {item.href === '/doctor/appointments' && dashboard?.todayAppointments && dashboard?.todayAppointments > 0 && (
                     <span className="ml-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                        {dashboard.todayAppointments > 9 ? '9+' : dashboard.todayAppointments}
                     </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-950"></span>
                </span>
              )}
            </Button>

            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800" />

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 outline-none">
                  <div className="relative">
                    {session?.user?.image ? (
                        <Image
                        src={session.user.image}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="rounded-full border-2 border-white shadow-sm object-cover"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white border-2 border-white shadow-sm">
                        <User className="w-4 h-4" />
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  
                  <div className="hidden md:block text-left mr-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Dr. {session?.user?.lastName || 'Doctor'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Cardiology</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-2">
                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {session?.user?.firstName?.[0] || 'D'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate">Dr. {session?.user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
                    </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                  <Link href="/doctor/profile">
                    <User className="mr-2 h-4 w-4 text-slate-500" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                  <Link href="/doctor/settings">
                    <Settings className="mr-2 h-4 w-4 text-slate-500" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                   <div className="flex items-center justify-between w-full">
                      <span className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4 text-slate-500" /> Theme</span>
                      <ModeToggle />
                   </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 py-2.5"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Toggle */}
            <button
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[80%] max-w-[300px] bg-white dark:bg-slate-950 shadow-2xl z-50 lg:hidden flex flex-col"
            >
              {/* Mobile Header */}
              <div className="p-5 border-b flex items-center justify-between">
                 <span className="font-bold text-lg text-slate-900 dark:text-white">Menu</span>
                 <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                    <X className="w-5 h-5" />
                 </Button>
              </div>

              {/* Mobile Links */}
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                 {nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all',
                        item.active 
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900'
                      )}
                    >
                       <item.icon className={cn("w-5 h-5", item.active ? "text-blue-600" : "text-slate-400")} />
                       {item.label}
                    </Link>
                 ))}
              </div>

              {/* Mobile Footer */}
              <div className="p-4 border-t bg-slate-50 dark:bg-slate-900">
                 <Button 
                   variant="destructive" 
                   className="w-full justify-start gap-3 pl-4"
                   onClick={handleSignOut}
                 >
                    <LogOut className="w-4 h-4" /> Sign Out
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
