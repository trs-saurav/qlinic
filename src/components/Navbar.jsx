"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { ModeToggle } from "./extra/ModeToggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Search,
  MapPin,
  ChevronDown,
  LogIn,
  User as UserIcon,
  Stethoscope,
  Building2,
  LayoutDashboard,
  Sparkles,
  Info,
  Award,
  Target,
  Globe,
  Newspaper,
  TrendingUp,
  BookOpen,
  Briefcase,
  Shield,
  FileText,
  LogOut,
  Settings,
  Loader2,
  Star,
  Navigation,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Heart,    // Added for Products
  Activity  // Added for Products
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";

// Import Smart Search Action
import { searchHospitalsWithAI } from "@/app/(public)/actions/smartSearch";
import LocationSelector from "@/components/location/LocationSelector";

const Navbar = () => {
  const { router, userRole } = useAppContext();
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  // UI States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const [isAboutMenuOpen, setIsAboutMenuOpen] = useState(false);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false); // New Product State
  const [isMobile, setIsMobile] = useState(false);

  // Search States
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Unified Results State
  const [searchResults, setSearchResults] = useState({ 
    analysis: null, 
    hospitals: [], 
    doctors: [] 
  });
  
  // Location States
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState("");

  // REFS
  const loginMenuRef = useRef(null);
  const aboutMenuRef = useRef(null);
  const productsMenuRef = useRef(null); // New Product Ref
  const navbarRef = useRef(null); 
  const searchContainerRef = useRef(null); 
  const searchInputRef = useRef(null);

  // 1. Handle Scroll & Resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // Changed breakpoint to lg (1024px) for better responsive handling
      setIsMobile(mobile);
      if (!mobile && isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    const handleScroll = () => setIsScrolled(window.scrollY > 20);

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMobileMenuOpen]);

  // 2. Click Outside & Esc Key Logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchExpanded && searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchExpanded(false);
      }
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target)) setIsLoginMenuOpen(false);
      if (aboutMenuRef.current && !aboutMenuRef.current.contains(event.target)) setIsAboutMenuOpen(false);
      if (productsMenuRef.current && !productsMenuRef.current.contains(event.target)) setIsProductsMenuOpen(false);
    };

    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setSearchExpanded(false);
        setIsLoginMenuOpen(false);
        setIsAboutMenuOpen(false);
        setIsProductsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [searchExpanded]);

  // 3. Load Location
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setUserLocation(location);
        setLocationName(location.name);
        setLocationStatus("success");
      } catch (e) {
        console.error("Location parse error", e);
      }
    }
  }, []);

  // 4. Auto-Focus Input
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [searchExpanded]);

  // --- SMART SEARCH LOGIC ---
  const fetchNearbyHospitals = async (location = userLocation) => {
    if (!location) return;
    setSearchLoading(true);
    try {
      const response = await searchHospitalsWithAI(
        "hospital", 
        location.latitude,
        location.longitude,
        location.name
      );
      if (response.success) {
        setSearchResults({
            analysis: null,
            hospitals: response.results || [],
            doctors: []
        });
      }
    } catch (error) {
      console.error("Nearby fetch error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
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
  }, [searchQuery, searchExpanded, userLocation]);

  // --- Handlers ---
  const handleInputFocus = () => {
    setSearchExpanded(true);
    if (searchQuery.length === 0 && userLocation) fetchNearbyHospitals();
  };

  const handleMobileSearchClose = () => {
    setSearchExpanded(false);
    setSearchQuery("");
  };

  const handleHospitalClick = (hospitalId) => {
    router.push(`/user/hospitals/${hospitalId}`);
    setSearchExpanded(false);
    setIsMobileMenuOpen(false);
  };

  const handleSearchEnter = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchExpanded(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
    toast.success("Signed out successfully");
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const name = user.name || user.email;
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // --- Data Config ---
  const aboutMegaMenu = {
    sections: [
      { title: "Company", items: [{ label: "About us", href: "/aboutus", icon: Info }, { label: "Our offerings", href: "/services", icon: Award }, { label: "How QLINIC works", href: "/how-it-works", icon: Target }, { label: "Sustainability", href: "/sustainability", icon: Globe }] },
      { title: "Resources", items: [{ label: "Newsroom", href: "/news", icon: Newspaper }, { label: "Investor relations", href: "/investors", icon: TrendingUp }, { label: "Blog", href: "/blog", icon: BookOpen }, { label: "Careers", href: "/careers", icon: Briefcase }] },
      { title: "Legal", items: [{ label: "Privacy Policy", href: "/privacy", icon: Shield }, { label: "Terms of Service", href: "/terms", icon: FileText }] },
    ],
  };

  const productsMenu = {
      title: "Products",
      items: [
          { label: "For Patients", href: "/user", icon: Heart, description: "Book appointments & manage health" },
          { label: "For Hospitals", href: "/hospital", icon: Building2, description: "Streamline operations & queue" },
          { label: "For Doctors", href: "/doctor", icon: Stethoscope, description: "Manage patients & schedule" },
      ]
  };

  const loginOptions = [
    { label: "User", icon: UserIcon, href: "/user", description: "Book appointments", gradient: "from-blue-500 to-teal-500" },
    { label: "Doctor", icon: Stethoscope, href: "/doctor", description: "Manage patients", gradient: "from-blue-500 to-cyan-500" },
    { label: "Hospital Admin", icon: Building2, href: "hospital", description: "Manage hospital", gradient: "from-violet-500 to-purple-500" },
  ];

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const isAboutActive = () => aboutMegaMenu.sections.some((s) => s.items.some((i) => pathname.startsWith(i.href)));
  const isProductsActive = () => productsMenu.items.some((i) => pathname.startsWith(i.href));

  const getDashboardUrl = () => {
    const role = userRole || user?.role;
    switch (role) {
      case "user": return "/user";
      case "doctor": return "/doctor";
      case "hospital_admin": return "/hospital";
      case "admin": return "/admin";
      case "sub_admin": return "/sub-admin";
      default: return "/";
    }
  };

  return (
    <>
      <motion.div initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <nav className="pt-2 sm:pt-4 px-2 sm:px-4 pointer-events-auto">
          {/* Main Navbar Container */}
          <div ref={navbarRef} className={`relative max-w-7xl mx-auto rounded-2xl sm:rounded-3xl transition-all duration-300 ${isScrolled ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-blue-200/70 dark:border-blue-800/50 shadow-lg shadow-blue-100/20" : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-2 border-blue-100/50 dark:border-blue-900/30"}`}>
            <div className="px-3 sm:px-4 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-14 lg:h-16 relative">
                
                {/* 1. LOGO AREA */}
                <div className={`${isMobile && searchExpanded ? 'hidden' : 'flex'} items-center`}>
                  <Link href="/" className="relative flex items-center group shrink-0">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Image src="/LOGO.png" alt="QLINIC" width={40} height={40} className="rounded object-contain" priority />
                    </motion.div>
                    <div className="ml-2 sm:ml-2.5 hidden xs:block">
                      <div className="flex items-center gap-1">
                        <h1 className="text-lg sm:text-base lg:text-lg font-bold text-blue-600 dark:text-blue-400">QLINIC</h1>
                        <Sparkles className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                </div>

                {/* 2. CENTER NAV (Desktop Only) */}
                <div className={`hidden lg:flex items-center gap-1 ${searchExpanded ? 'lg:opacity-0 pointer-events-none duration-200' : 'opacity-100'}`}>
                  <Link href="/" className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all ${isActive("/") ? "text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/30" : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/20"}`}>Home</Link>
                  
                  {/* About Menu */}
                  <div className="relative" ref={aboutMenuRef}>
                    <button onClick={() => setIsAboutMenuOpen(!isAboutMenuOpen)} className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-all ${isAboutActive() ? "text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/30" : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/20"}`}>
                      About <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAboutMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {isAboutMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute left-0 mt-2 w-[600px] rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
                          <div className="p-6 grid grid-cols-3 gap-6">
                            {aboutMegaMenu.sections.map((section, idx) => (
                              <div key={idx}><h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">{section.title}</h3><div className="space-y-1">{section.items.map(item => (<Link key={item.href} href={item.href} onClick={() => setIsAboutMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/20 group"><item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" /><span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">{item.label}</span></Link>))}</div></div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Products Menu - Added Here */}
                  <div className="relative" ref={productsMenuRef}>
                    <button onClick={() => setIsProductsMenuOpen(!isProductsMenuOpen)} className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-all ${isProductsActive() ? "text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/30" : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/20"}`}>
                      Products <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isProductsMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {isProductsMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute left-0 mt-2 w-72 rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
                          <div className="p-3">
                              {productsMenu.items.map((item) => (
                                  <Link key={item.href} href={item.href} onClick={() => setIsProductsMenuOpen(false)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/20 group transition-colors">
                                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                          <item.icon className="w-4 h-4" />
                                      </div>
                                      <div>
                                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">{item.label}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                                      </div>
                                  </Link>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

                {/* 3. RIGHT SECTION (Search + Auth) */}
                <div className={`flex items-center gap-1.5 sm:gap-2 lg:gap-3 justify-end ${isMobile && searchExpanded ? 'w-full' : 'flex-1 lg:flex-none'}`}>
                  
                  {/* --- SEARCH CONTAINER --- */}
                  <div ref={searchContainerRef} className={`flex items-center gap-2 ${isMobile && searchExpanded ? 'w-full' : ''}`}>
                    
                    {/* Location Badge - Hidden on Mobile unless in dropdown */}
                    <AnimatePresence>
                      {(!searchExpanded && !isMobile) && (
                        <motion.div initial={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }}>
                          <button onClick={() => setShowLocationModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/30 dark:bg-blue-900/20 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors whitespace-nowrap border border-transparent hover:border-blue-100 dark:hover:border-blue-800">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="truncate max-w-[80px] sm:max-w-[100px]">{locationName || "Location"}</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* DYNAMIC SEARCH INPUT */}
                    <motion.div 
                      animate={{ 
                        width: isMobile 
                          ? (searchExpanded ? "100%" : "40px") 
                          : (searchExpanded ? "380px" : "200px") 
                      }} 
                      transition={{ type: "spring", stiffness: 300, damping: 30 }} 
                      className="relative z-20"
                    >
                      {isMobile && searchExpanded ? (
                        <ArrowLeft onClick={handleMobileSearchClose} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer z-20" />
                      ) : (
                        <Search 
                          onClick={isMobile && !searchExpanded ? () => setSearchExpanded(true) : undefined}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 dark:text-blue-400 z-10 cursor-pointer" 
                        />
                      )}

                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder={searchExpanded ? (isMobile ? "Search hospitals..." : "Search doctors, hospitals...") : (isMobile ? "" : "Search...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={handleInputFocus}
                        onKeyDown={handleSearchEnter}
                        className={`w-full h-9 sm:h-8 text-sm sm:text-xs rounded-full border-0 transition-all ${isMobile && !searchExpanded ? "pl-8 pr-0 bg-transparent cursor-pointer" : "pl-9 pr-9 bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 shadow-sm"}`}
                        readOnly={isMobile && !searchExpanded} 
                        onClick={isMobile && !searchExpanded ? () => setSearchExpanded(true) : undefined}
                        autoComplete="off"
                      />
                      
                      {(searchQuery || (isMobile && searchExpanded)) && (
                        <button onClick={() => { setSearchQuery(""); if(isMobile) handleInputFocus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors z-10">
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      )}
                    </motion.div>
                  </div>

                  {/* DESKTOP AUTH & THEME */}
                  <div className={`flex items-center gap-2 ${isMobile && searchExpanded ? 'hidden' : 'flex'}`}>
                    
                    <div className="hidden lg:block"><ModeToggle /></div>
                    
                    <div className="hidden lg:flex items-center gap-2">
                      {user ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="relative w-9 h-9 rounded-full border-2 border-blue-200 dark:border-blue-800 hover:border-blue-500 transition-colors overflow-hidden">
                              <Avatar className="w-full h-full"><AvatarImage src={user.image} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-xs font-semibold">{getUserInitials()}</AvatarFallback></Avatar>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl">
                              <DropdownMenuLabel><div className="flex flex-col space-y-1"><p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div></DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-blue-200/50 dark:bg-blue-800/50" />
                              <DropdownMenuItem onClick={() => router.push(getDashboardUrl())} className="text-gray-700 dark:text-gray-300 focus:bg-blue-50 dark:focus:bg-blue-900/30"><LayoutDashboard className="mr-2 h-4 w-4"/>Dashboard</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push("/settings")} className="text-gray-700 dark:text-gray-300 focus:bg-blue-50 dark:focus:bg-blue-900/30"><Settings className="mr-2 h-4 w-4"/>Settings</DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-blue-200/50 dark:bg-blue-800/50" />
                              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"><LogOut className="mr-2 h-4 w-4"/>Sign out</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="relative" ref={loginMenuRef}>
                          <button onClick={() => setIsLoginMenuOpen(!isLoginMenuOpen)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-full transition-colors"><LogIn className="w-4 h-4" /> Login <ChevronDown className="w-3.5 h-3.5" /></button>
                          <AnimatePresence>{isLoginMenuOpen && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border-2 border-blue-200/50 dark:border-blue-800/50 p-2 z-[9999]">{loginOptions.map((opt) => (<button key={opt.href} onClick={() => router.push(opt.href)} className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left"><div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${opt.gradient} flex items-center justify-center shadow-sm`}><opt.icon className="w-5 h-5 text-white"/></div><div><div className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</div><div className="text-xs text-gray-600 dark:text-gray-400">{opt.description}</div></div></button>))}</motion.div>)}</AnimatePresence>
                        </div>
                      )}
                      {!user && <Link href="/sign-up" className="px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-semibold rounded-full hover:shadow-lg shadow-blue-500/30 transition-all">Sign up</Link>}
                    </div>
                  </div>

                  {/* MOBILE MENU TOGGLE + MOBILE THEME TOGGLE */}
                  <div className={`flex lg:hidden items-center gap-2 ${isMobile && searchExpanded ? 'hidden' : 'flex'}`}>
                    <ModeToggle />
                    
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50/50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
                      {isMobileMenuOpen ? <X className="w-5 h-5 text-gray-700 dark:text-gray-300" /> : <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* --- 4. SEARCH RESULTS DROPDOWN (Hybrid Style) --- */}
            <AnimatePresence>
              {searchExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-blue-200/50 dark:border-blue-800/50">
                  <div className="px-4 md:px-8 py-4 bg-gradient-to-b from-white/95 to-blue-50/30 dark:from-gray-900/95 dark:to-blue-950/20 backdrop-blur-xl rounded-b-3xl shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
                    
                    <div className="flex items-center justify-between mb-4 sticky top-0 z-10 pb-2 border-b border-blue-100/50 dark:border-blue-800/30">
                      <div className="flex items-center gap-2">
                        {searchLoading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Search className="w-5 h-5 text-blue-600" />}
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">{searchLoading ? "Finding best matches..." : (searchQuery.length === 0 ? "Nearby Hospitals" : "Search Results")}</h3>
                      </div>
                      {searchResults.analysis && (<Badge className="bg-blue-100 text-blue-700 border-0 text-xs hidden sm:flex items-center gap-1"><Sparkles className="w-3 h-3"/> {searchResults.analysis.specialties.slice(0, 2).join(", ")}</Badge>)}
                    </div>

                    {/* Results Grid - Vertical List with Richer Cards */}
                    <div className="space-y-3">
                      {searchResults.hospitals.length > 0 ? (
                        searchResults.hospitals.map((hospital, index) => (
                          <motion.div
                            key={hospital._id || hospital.id}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                            onClick={() => handleHospitalClick(hospital._id || hospital.id)}
                            className="group flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white dark:bg-gray-900 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                          >
                            {/* Card Left: Image */}
                            <div className="relative shrink-0 self-start">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-xl overflow-hidden border border-blue-200 flex items-center justify-center">
                                    {hospital.logo ? <Image src={hospital.logo} alt="" width={80} height={80} className="object-cover w-full h-full" /> : <Building2 className="w-8 h-8 text-blue-600" />}
                                </div>
                                {hospital.isEmergency && <div className="absolute -top-2 -right-2 bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-red-200">EMERGENCY</div>}
                            </div>

                            {/* Card Middle: Rich Details */}
                            <div className="flex-1 min-w-0 w-full space-y-1">
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-bold text-gray-900 dark:text-white text-base group-hover:text-blue-600 transition-colors line-clamp-1 flex items-center gap-1.5">
                                      {hospital.name}
                                      {hospital.isVerified && <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-100" />}
                                    </h4>
                                    {hospital.rating > 0 && (
                                      <div className="flex items-center gap-1 text-xs shrink-0">
                                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"/>
                                        <span className="font-bold text-gray-900 dark:text-white">{hospital.rating}</span>
                                        <span className="text-gray-400 font-normal">({hospital.totalReviews || 12})</span>
                                      </div>
                                    )}
                                </div>
                                
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1 line-clamp-1">
                                  <MapPin className="w-3 h-3 mt-0.5 shrink-0"/> 
                                  {hospital.address?.street ? `${hospital.address.street}, ` : ''}{hospital.city || "Unknown City"}, {hospital.state}
                                </p>

                                <div className="flex items-center gap-2 mt-1">
                                  {hospital.isEmergency ? (
                                    <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium"><Clock className="w-3 h-3"/> Open 24/7</span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium"><Clock className="w-3 h-3"/> Open</span>
                                  )}
                                  {hospital.distance && <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium"><Navigation className="w-3 h-3"/> {hospital.distance.toFixed(1)} km</span>}
                                </div>

                                <div className="flex flex-wrap gap-1 mt-2">
                                  {hospital.specialties?.slice(0, 3).map((s, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-blue-50/50 text-blue-700 dark:text-blue-300 text-[10px] font-medium rounded border border-blue-100/50">{s}</span>
                                  ))}
                                  {hospital.specialties?.length > 3 && <span className="text-[10px] text-gray-400 py-0.5">+{hospital.specialties.length - 3}</span>}
                                </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        !searchLoading && <div className="text-center py-6 text-sm text-gray-500">No hospitals found. Try a different query.</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 5. RICH MOBILE MENU */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-blue-200/70 dark:border-blue-800/70 rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh-5rem)] overflow-y-auto">
                <div className="p-4 space-y-3">
                  {/* User Profile Section */}
                  {user && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/30 rounded-xl">
                      <Avatar className="w-12 h-12"><AvatarImage src={user.image} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-sm font-semibold">{getUserInitials()}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5 capitalize">{userRole?.replace("_", " ")}</p>
                      </div>
                    </div>
                  )}

                  {/* Mobile Search Input (Backup) */}
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <Input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsMobileMenuOpen(false)} className="w-full pl-10 h-11 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100" />
                  </div>

                  {/* Location Selector - Moved to Mobile Menu */}
                  <button onClick={() => { setShowLocationModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50/30 dark:bg-blue-900/20 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" /> <span className="flex-1 text-left truncate">{locationName || "Set Location"}</span>
                  </button>

                  <div className="space-y-1">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${isActive("/") ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"}`}>Home</Link>
                    
                    {/* About Accordion */}
                    <div className="space-y-1">
                      <button onClick={() => setIsAboutMenuOpen(!isAboutMenuOpen)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${isAboutActive() ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"}`}>
                        <span>About</span> <ChevronDown className={`w-4 h-4 transition-transform ${isAboutMenuOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {isAboutMenuOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ml-4 space-y-1 overflow-hidden">
                            {aboutMegaMenu.sections.map((section) => (
                              <div key={section.title} className="space-y-1">
                                <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{section.title}</p>
                                {section.items.map((item) => (<Link key={item.href} href={item.href} onClick={() => { setIsMobileMenuOpen(false); setIsAboutMenuOpen(false); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"><item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />{item.label}</Link>))}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Products Accordion - Added Here */}
                    <div className="space-y-1">
                        <button onClick={() => setIsProductsMenuOpen(!isProductsMenuOpen)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${isProductsActive() ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"}`}>
                            <span>Products</span> <ChevronDown className={`w-4 h-4 transition-transform ${isProductsMenuOpen ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                            {isProductsMenuOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ml-4 space-y-1 overflow-hidden">
                                    {productsMenu.items.map((item) => (
                                        <Link key={item.href} href={item.href} onClick={() => { setIsMobileMenuOpen(false); setIsProductsMenuOpen(false); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20">
                                            <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                            {item.label}
                                        </Link>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {user && (<Link href={getDashboardUrl()} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>)}
                  </div>

                  {/* Auth Actions */}
                  {user ? (
                    <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-3 border-2 border-red-200 dark:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl font-semibold text-red-600 dark:text-red-400 transition-all">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  ) : (
                    <div className="pt-3 border-t border-blue-200/50 dark:border-blue-800/50 space-y-3">
                      <div className="space-y-2">
                        <p className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Login as</p>
                        {loginOptions.map((option) => (
                          <Link key={option.href} href={option.href} onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-start gap-3 p-3 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-sm shrink-0`}><option.icon className="w-5 h-5 text-white" /></div>
                            <div className="text-left flex-1 min-w-0"><div className="font-semibold text-sm text-gray-900 dark:text-white">{option.label}</div><div className="text-xs text-gray-600 dark:text-gray-400">{option.description}</div></div>
                          </Link>
                        ))}
                      </div>
                      <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg transition-all">Sign up <ArrowRight className="w-4 h-4" /></Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </motion.div>

      {/* Location Modal */}
      {showLocationModal && (
        <LocationSelector
          locationName={locationName} setLocationName={setLocationName} setUserLocation={setUserLocation}
          locationStatus={locationStatus} setLocationStatus={setLocationStatus}
          showLocationModal={showLocationModal} setShowLocationModal={setShowLocationModal}
          onLocationSelect={(location) => {
            setUserLocation(location); setLocationName(location.name);
            if (searchExpanded) fetchNearbyHospitals(location);
          }}
        />
      )}
    </>
  );
};

export default Navbar;
