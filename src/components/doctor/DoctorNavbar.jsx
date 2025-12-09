// src/components/doctor/DoctorNavbar.jsx
'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ModeToggle } from '@/components/extra/ModeToggle'
import { 
  LayoutDashboard, 
  Stethoscope, 
  Calendar, 
  Hospital,
  Clock,
  Menu, 
  X, 
  Bell,
  UserCircle
} from 'lucide-react'

export default function DoctorNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/profile', label: 'Profile', icon: UserCircle },
    { href: '/doctor/affiliations', label: 'Hospitals', icon: Hospital },
    { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
    { href: '/doctor/schedule', label: 'Schedule', icon: Clock }
  ]

  const isActive = (href) => {
    if (href === '/doctor') return pathname === '/doctor'
    return pathname.startsWith(href)
  }

  const handleNavClick = (href) => {
    router.push(href)
    setIsMobileMenuOpen(false)
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-background/95 backdrop-blur-xl border-b-2 border-emerald-200/70 dark:border-emerald-800/70 shadow-lg sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          
          {/* Logo */}
          <Link href="/doctor" className="flex items-center gap-3 group transition-all duration-300">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <div className="relative w-11 h-11 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-lg p-2 border border-emerald-200/50 dark:border-emerald-800/50">
                <Stethoscope className="w-full h-full text-emerald-600 dark:text-emerald-400" />
              </div>
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Qlinic
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Doctor Portal</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`
                    relative px-4 py-2 text-sm font-medium transition-all duration-200 group
                    ${isActive(item.href) 
                      ? 'text-foreground font-semibold' 
                      : 'text-foreground/70 hover:text-foreground'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <span className={`
                    absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full transition-all duration-300
                    ${isActive(item.href) ? 'w-6' : 'w-0 group-hover:w-4'}
                  `} />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 lg:gap-3">
            
            {/* Notifications */}
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button variant="ghost" size="sm" className="relative h-9 px-3">
                <Bell className="w-4 h-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs font-semibold bg-emerald-500 border-2 border-background">
                  5
                </Badge>
              </Button>
            </motion.div>

            {/* Mode Toggle */}
            <div className="hidden md:block">
              <ModeToggle />
            </div>

            {/* User Button */}
            <UserButton afterSignOutUrl="/sign-in" />

            {/* Mobile Menu */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 bg-accent/50 hover:bg-accent rounded-lg transition-all duration-200"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t-2 border-emerald-200/50 dark:border-emerald-800/50 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-12 px-4 rounded-xl ${
                      isActive(item.href)
                        ? 'bg-accent/80 text-foreground font-semibold'
                        : 'text-foreground/80 hover:bg-accent/50'
                    }`}
                    onClick={() => handleNavClick(item.href)}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                </motion.div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 mt-4">
                <span className="text-sm font-medium">Theme</span>
                <ModeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
