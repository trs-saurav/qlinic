'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  MapPin, ChevronRight, Loader2, Stethoscope, Building2, Star, Sparkles, Navigation, Clock, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

// ✅ Import Smart Search Action & Location Selector
import { searchHospitalsWithAI } from "@/app/(public)/actions/smartSearch";
import LocationSelector from "@/components/location/LocationSelector";

export default function UserNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // --- UI States ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // --- Search & Location States ---
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationStatus, setLocationStatus] = useState("idle")
  const [userLocation, setUserLocation] = useState(null)
  const [locationName, setLocationName] = useState('Patna') // Default

  // ✅ Search Results State
  const [searchResults, setSearchResults] = useState({ 
    analysis: null, 
    hospitals: [], 
    doctors: [] 
  })

  // Refs
  const searchContainerRef = useRef(null)
  const searchInputRef = useRef(null)

  // --- 1. Scroll & Click Outside Logic ---
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchExpanded(false)
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll)
    document.addEventListener("mousedown", handleClickOutside)
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // --- 2. Load Location Logic ---
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setUserLocation(location);
        setLocationName(location.name);
        setLocationStatus("success");
      } catch (e) { console.error(e) }
    }
  }, []);

  // --- 3. Auto-Focus Logic ---
  useEffect(() => {
    if (!isMobile && searchExpanded && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [searchExpanded, isMobile]);

  // --- 4. Smart Search AI Logic (Debounced - Desktop Only) ---
  useEffect(() => {
    if (isMobile) return; 

    const q = searchQuery.trim();
    if (searchExpanded && q.length === 0) {
        if (userLocation && searchResults.hospitals.length === 0) fetchNearbyHospitals();
        return;
    }

    if (!searchExpanded || q.length < 2) return;

    setSearchLoading(true);

    const handle = setTimeout(async () => {
      try {
        const response = await searchHospitalsWithAI(
          q,
          userLocation?.latitude,
          userLocation?.longitude,
          locationName || "India"
        );

        if (response.success) {
          setSearchResults({
            analysis: response.analysis,
            hospitals: response.results || [],
            doctors: [] 
          });
        }
      } catch (e) {
        console.error("AI Search Error:", e);
      } finally {
        setSearchLoading(false);
      }
    }, 800); 

    return () => clearTimeout(handle);
  }, [searchQuery, searchExpanded, userLocation, isMobile]);

  const fetchNearbyHospitals = async (location = userLocation) => {
    if (!location) return;
    setSearchLoading(true);
    try {
      const response = await searchHospitalsWithAI("hospital", location.latitude, location.longitude, location.name);
      if (response.success) setSearchResults({ analysis: null, hospitals: response.results || [], doctors: [] });
    } finally { setSearchLoading(false); }
  };

  // --- Handlers ---
  const handleInputFocus = () => {
    setSearchExpanded(true);
    if (searchQuery.length === 0 && userLocation) fetchNearbyHospitals();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/user/search?q=${encodeURIComponent(searchQuery)}&loc=${encodeURIComponent(locationName)}`)
    setSearchExpanded(false)
  }

  const handleHospitalClick = (id) => {
    router.push(`/user/hospitals/${id}`)
    setSearchExpanded(false)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const getInitials = () => session?.user?.name ? session.user.name.slice(0, 2).toUpperCase() : 'U'

  // Nav Items Configuration
  const navItems = [
    { href: '/user', label: 'Dashboard', icon: Home },
    { href: '/user/appointments', label: 'Appointments', icon: Calendar },
    { href: '/user/search', label: 'Hospitals', icon: Hospital },
    { href: '/user/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm' : 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm'
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
            
            {/* 1. LEFT: Logo */}
            <Link href="/user" className="flex items-center gap-2 group flex-shrink-0">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <div className="relative w-9 h-9">
                    <Image src="/LOGO.png" alt="Qlinic" width={36} height={36} className="object-contain w-full h-full" priority />
                  </div>
              </motion.div>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight hidden sm:block">
                Qlinic
              </span>
            </Link>

            {/* 2. CENTER: Nav Links (Desktop) */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-2 flex-1 justify-center">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/user')
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }
                  `}
                >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                </Link>
              ))}
            </div>

            {/* 3. RIGHT: Smart Search & Profile */}
            <div className="flex items-center gap-3">
              
              {/* --- SMART SEARCH BAR (Desktop) --- */}
              <div className="hidden md:block relative w-72 xl:w-96" ref={searchContainerRef}>
                  <div className={`flex items-center bg-slate-50 dark:bg-slate-900 border rounded-full transition-all ${searchExpanded ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900' : 'border-slate-200 dark:border-slate-800'}`}>
                      {/* Location Trigger */}
                      <button 
                        onClick={() => setShowLocationModal(true)}
                        className="flex items-center gap-1.5 pl-3 pr-2 py-2 border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-l-full transition-colors"
                      >
                         <MapPin className="w-4 h-4 text-blue-500" />
                         <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[60px] truncate">{locationName}</span>
                      </button>

                      {/* Search Input */}
                      <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                              ref={searchInputRef}
                              type="text"
                              placeholder="Doctor, symptoms..."
                              className="w-full pl-8 pr-4 h-10 border-0 bg-transparent focus-visible:ring-0 text-sm placeholder:text-slate-400"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onFocus={handleInputFocus}
                          />
                      </form>
                  </div>

                  {/* 🔽 SMART RESULTS DROPDOWN (Desktop) 🔽 */}
                  <AnimatePresence>
                    {searchExpanded && !isMobile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full mt-2 w-full bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50"
                      >
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
                           <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600"/> : <Search className="w-4 h-4 text-blue-600"/>}
                                <span className="text-xs font-bold text-slate-500 uppercase">{searchLoading ? "Thinking..." : "Results"}</span>
                              </div>
                              {searchResults.analysis && (
                                <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-blue-50 text-blue-700 border-blue-200">
                                  <Sparkles className="w-3 h-3"/> {searchResults.analysis.specialties.slice(0,1).join(", ")}
                                </Badge>
                              )}
                           </div>
                           <div className="p-1 space-y-1">
                              {searchResults.hospitals.length > 0 ? (
                                searchResults.hospitals.map(hospital => (
                                  <div key={hospital._id || hospital.id} onClick={() => handleHospitalClick(hospital._id || hospital.id)} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer group transition-colors">
                                     <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                        {hospital.logo ? <Image src={hospital.logo} alt={hospital.name || "Hospital Logo"} width={40} height={40} className="w-full h-full object-cover"/> : <Building2 className="w-5 h-5 text-slate-400"/>}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                           <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">{hospital.name}</h4>
                                           {hospital.rating > 0 && <span className="flex items-center text-[10px] font-bold text-slate-600"><Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5"/>{hospital.rating}</span>}
                                        </div>
                                        <p className="text-[11px] text-slate-500 truncate">{hospital.address?.city || hospital.city}, {hospital.address?.state}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                           {hospital.isEmergency && <span className="text-[9px] px-1 bg-red-50 text-red-600 rounded border border-red-100 font-medium">Emergency</span>}
                                           {hospital.specialties?.slice(0,2).map((s,i)=><span key={i} className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded">{s}</span>)}
                                        </div>
                                     </div>
                                  </div>
                                ))
                              ) : (
                                !searchLoading && <div className="py-6 text-center text-xs text-slate-500">No results found nearby.</div>
                              )}
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>

              {/* Notification & Theme (Hidden on small mobile) */}
              <div className="hidden sm:flex items-center gap-1">
                <Button variant="ghost" size="icon" className="relative text-slate-600 dark:text-slate-300 rounded-full">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
                </Button>
                <ModeToggle />
              </div>

              {/* Desktop User Dropdown */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-2 ring-transparent hover:ring-blue-100 transition-all">
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
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 leading-none">{session?.user?.name || 'User'}</p>
                        <p className="text-xs leading-none text-blue-600/80 dark:text-blue-400/80 mt-1">{session?.user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {navItems.map(item => (
                        <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)} className="cursor-pointer">
                            <item.icon className="mr-2 h-4 w-4 text-slate-500" /> {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer focus:bg-red-50">
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* --- MOBILE ACTIONS --- */}
              <div className="flex md:hidden items-center gap-2">
                {/* 1. Mobile Search Button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => router.push('/user/search')} 
                  className="text-slate-600 dark:text-slate-300 rounded-full"
                >
                  <Search className="w-5 h-5" />
                </Button>

                {/* 2. Mobile Theme Toggle */}
                <ModeToggle />
                
                {/* 3. Mobile Profile Toggle (Replaces Hamburger) */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="p-0 rounded-full" 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6 text-slate-600" />
                  ) : (
                    <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                      <AvatarImage src={session?.user?.image} />
                      <AvatarFallback className="bg-blue-600 text-white font-medium text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. MOBILE MENU OVERLAY */}
        {/* Removed the dedicated search bar above, now search is via icon. Menu contains nav links. */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xl"
            >
              <div className="px-4 py-6 space-y-1">
                {/* User Info Header in Mobile Menu */}
                {session?.user && (
                  <div className="flex items-center gap-3 p-3 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.user.image} />
                      <AvatarFallback className="bg-blue-600 text-white">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{session.user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                    </div>
                  </div>
                )}

                {/* Nav Links */}
                {navItems.map((item) => (
                  <Button key={item.href} variant="ghost" onClick={() => { router.push(item.href); setIsMobileMenuOpen(false); }} className={`w-full justify-start h-12 text-base font-normal rounded-xl mb-1 ${pathname === item.href ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'text-slate-600'}`}>
                    <item.icon className="w-5 h-5 mr-3" /> {item.label}
                    {pathname === item.href && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
                  </Button>
                ))}
                
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
                
                <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start h-12 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
                    <LogOut className="w-5 h-5 mr-3" /> Sign Out
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Location Modal */}
     {showLocationModal && (
  <LocationSelector
    locationName={locationName}
    setLocationName={setLocationName}
    setUserLocation={setUserLocation}
    locationStatus={locationStatus}
    setLocationStatus={setLocationStatus}
    showLocationModal={showLocationModal}
    setShowLocationModal={setShowLocationModal}
    // ✅ THIS IS THE CRITICAL PART:
    onLocationSelect={(location) => {
      setUserLocation(location);
      setLocationName(location.name);
      // Trigger search if bar is open or if we want to refresh "nearby" results
      if (searchExpanded) fetchNearbyHospitals(location);
    }}
  />
)}
        
    </>
  )
}