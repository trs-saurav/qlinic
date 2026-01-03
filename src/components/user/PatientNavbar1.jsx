'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModeToggle } from '@/components/extra/ModeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Home, Hospital, Calendar, Users, FileText,
  Menu, X, Bell, Search, LogOut, Settings, User, 
  MapPin, ChevronRight, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationName, setLocationName] = useState('Patna')
  const [detectingLocation, setDetectingLocation] = useState(false)

  // Main Navigation Items
  const navItems = [
    { href: '/user', label: 'Dashboard', icon: Home },
    { href: '/user/appointments', label: 'Appointments', icon: Calendar },
    { href: '/user/hospitals', label: 'Hospitals', icon: Hospital },
    { href: '/user/settings', label: 'Settings', icon: Settings },
  ]

  // Location Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const city = data.address.city || data.address.town || data.address.village || 'Unknown Location'
          setLocationName(city)
          toast.success(`Location updated to ${city}`)
        } catch (error) {
          console.error("Error fetching location:", error)
          toast.error("Failed to fetch address details")
        } finally {
          setDetectingLocation(false)
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        setDetectingLocation(false)
        toast.error("Please allow location access")
      }
    )
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/user/search?q=${encodeURIComponent(searchQuery)}&loc=${encodeURIComponent(locationName)}`)
    setIsMobileMenuOpen(false)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const getInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return session?.user?.email?.charAt(0).toUpperCase() || 'U'
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-blue-100 dark:border-blue-900/30 sticky top-0 z-40 w-full"
    >
      {/* Full Width Container - No max-width constraint */}
      <div className="w-full px-6 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-6">
          
          {/* 1. LEFT: Logo */}
          <Link href="/user" className="flex items-center gap-2 group flex-shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <div className="relative w-9 h-9">
                  <Image 
                    src="/logo.png" 
                    alt="Qlinic" 
                    width={36}
                    height={36}
                    className="object-contain w-full h-full"
                    priority
                  />
                </div>
            </motion.div>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight hidden sm:block">
              Qlinic
            </span>
          </Link>

          {/* 2. CENTER: Navigation Links - More space to spread */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4 flex-1 justify-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 xl:px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-transparent
                  ${pathname.startsWith(item.href) && item.href !== '/user' || pathname === item.href
                    ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }
                `}
              >
                  <item.icon className="w-4 h-4" />
                  {item.label}
              </Link>
            ))}
          </div>

          {/* 3. RIGHT: Search, Actions - Larger search bar on bigger screens */}
          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
            
            {/* Search Bar - Larger on XL screens */}
            <div className="hidden md:block relative w-72 xl:w-96">
                <form onSubmit={handleSearchSubmit} className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                        type="text"
                        placeholder="Search doctors, hospitals..."
                        className="w-full pl-9 pr-24 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 transition-all rounded-full text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    
                    {/* Location Button */}
                    <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={detectingLocation}
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        title="Detect current location"
                    >
                        {detectingLocation ? (
                            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                        ) : (
                            <MapPin className="w-3 h-3 text-blue-500" />
                        )}
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 max-w-[70px] truncate">
                            {locationName}
                        </span>
                    </button>
                </form>
            </div>

            {/* Notification Bell */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
              <Button variant="ghost" size="icon" className="relative text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full h-9 w-9">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
              </Button>
            </motion.div>

            {/* Mode Toggle */}
            <div className="hidden md:block">
              <ModeToggle />
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-2 ring-transparent hover:ring-blue-100 dark:hover:ring-blue-900 transition-all">
                  <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
                    <AvatarImage src={session?.user?.image} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-medium text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 leading-none">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-blue-600/80 dark:text-blue-400/80 mt-1">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/user/profile')} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4 text-slate-500" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/user/settings')} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4 text-slate-500" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/user/records')} className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4 text-slate-500" /> Records
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => router.push('/user/family')} className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4 text-slate-500" /> Family
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Search & Location */}
      <div className="md:hidden px-4 pb-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
           <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                      type="text"
                      placeholder="Search..."
                      className="w-full pl-9 h-10 bg-slate-50 dark:bg-slate-900 border-0 rounded-xl focus-visible:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              <Button 
                type="button"
                variant="outline" 
                size="icon" 
                onClick={handleDetectLocation}
                className="h-10 w-10 shrink-0 rounded-xl border-slate-200 dark:border-slate-800"
              >
                 {detectingLocation ? <Loader2 className="w-4 h-4 animate-spin text-blue-600"/> : <MapPin className="w-4 h-4 text-blue-600"/>}
              </Button>
           </form>
           <div className="mt-1 text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
              Current Location: <span className="font-medium text-blue-600">{locationName}</span>
           </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xl"
          >
            <div className="px-4 py-6 space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  onClick={() => {
                      router.push(item.href)
                      setIsMobileMenuOpen(false)
                  }}
                  className={`w-full justify-start h-12 text-base font-normal rounded-xl mb-1
                      ${pathname === item.href 
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                  {pathname === item.href && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
                </Button>
              ))}
              
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
              
              <Button variant="ghost" onClick={() => { router.push('/user/records'); setIsMobileMenuOpen(false); }} className="w-full justify-start h-12 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900">
                  <FileText className="w-5 h-5 mr-3" /> Medical Records
              </Button>
               <Button variant="ghost" onClick={() => { router.push('/user/family'); setIsMobileMenuOpen(false); }} className="w-full justify-start h-12 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900">
                  <Users className="w-5 h-5 mr-3" /> Family Members
              </Button>
              <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start h-12 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl">
                  <LogOut className="w-5 h-5 mr-3" /> Sign Out
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
