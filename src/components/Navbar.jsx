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
  ArrowRight,
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
  Navigation,
  Loader2,
  Hospital,
  Star,
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

import LocationSelector from "@/components/location/LocationSelector";

const Navbar = () => {
  const { router, userRole } = useAppContext();
  const { data: session, status } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const [isAboutMenuOpen, setIsAboutMenuOpen] = useState(false);

  // Search & Location states
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [typedLoading, setTypedLoading] = useState(false);
  const [typedResults, setTypedResults] = useState({ doctors: [], hospitals: [] });

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  const [searchQueryMobile, setSearchQueryMobile] = useState("");

  const loginMenuRef = useRef(null);
  const aboutMenuRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      const location = JSON.parse(savedLocation);
      setUserLocation(location);
      setLocationName(location.name);
      setLocationStatus("success");
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto close search on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSearchExpanded(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchExpanded]);

  // Fetch nearby hospitals when search is focused
  useEffect(() => {
    if (searchExpanded && nearbyHospitals.length === 0) {
      if (userLocation) {
        fetchNearbyHospitals();
      } else {
        getUserLocation();
      }
    }
  }, [searchExpanded]);

  // Debounced typed search for navbar
  useEffect(() => {
    const q = (searchQuery || '').trim();
    if (!searchExpanded) {
      setTypedResults({ doctors: [], hospitals: [] });
      setTypedLoading(false);
      return;
    }
    if (q.length < 2) {
      setTypedResults({ doctors: [], hospitals: [] });
      setTypedLoading(false);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        setTypedLoading(true);
        const params = new URLSearchParams({ q, limit: '6' });
        if (userLocation) {
          params.append('lat', userLocation.latitude.toString());
          params.append('lng', userLocation.longitude.toString());
          params.append('radius', '20');
        }
        const resp = await fetch(`/api/search?${params.toString()}`, { headers: { Accept: 'application/json' } });
        const data = await resp.json();
        const doctors = Array.isArray(data?.results?.doctors)
          ? data.results.doctors
          : Array.isArray(data?.doctors)
            ? data.doctors
            : [];
        const hospitals = Array.isArray(data?.results?.hospitals)
          ? data.results.hospitals
          : Array.isArray(data?.hospitals)
            ? data.hospitals
            : [];
        const normDoctors = doctors.map(d => ({
          ...d,
          id: d.id || d._id,
          name: d.name || [d.firstName, d.lastName].filter(Boolean).join(' '),
          specialization: d.specialization || d.doctorProfile?.specialization,
          experience: d.experience ?? d.doctorProfile?.experience ?? null,
          rating: typeof d.rating === 'number' ? d.rating : 0,
        }));
        const normHospitals = hospitals.map(h => ({
          ...h,
          id: h.id || h._id,
          city: h.city || h.address?.city || h.location || '',
          state: h.state || h.address?.state || '',
          logo: h.logo || h.image || '',
          rating: typeof h.rating === 'number' ? h.rating : 0,
        }));
        setTypedResults({ doctors: normDoctors, hospitals: normHospitals });
      } catch (e) {
        setTypedResults({ doctors: [], hospitals: [] });
      } finally {
        setTypedLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [searchQuery, searchExpanded, userLocation]);

  // Close search and menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchExpanded(false);
      }
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target)) {
        setIsLoginMenuOpen(false);
      }
      if (aboutMenuRef.current && !aboutMenuRef.current.contains(event.target)) {
        setIsAboutMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get user location
  const getUserLocation = () => {
    setLocationLoading(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || "Your Location";
          const state = data.address?.state || "";
          const name = `${city}${state ? ", " + state : ""}`;

          const location = {
            latitude,
            longitude,
            name,
            timestamp: new Date().toISOString(),
          };

          setUserLocation(location);
          setLocationName(name);
          setLocationStatus("success");
          localStorage.setItem("userLocation", JSON.stringify(location));
          toast.success(`Location: ${name}`);

          fetchNearbyHospitals(location);
        } catch (err) {
          console.error("Geocoding error:", err);
          const location = {
            latitude,
            longitude,
            name: "Your Location",
            timestamp: new Date().toISOString(),
          };
          setUserLocation(location);
          setLocationName("Your Location");
          localStorage.setItem("userLocation", JSON.stringify(location));
          fetchNearbyHospitals(location);
        }

        setLocationLoading(false);
      },
      (error) => {
        console.error("Location error:", error);
        toast.error("Unable to get location");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Fetch nearby hospitals
  const fetchNearbyHospitals = async (location = userLocation) => {
    if (!location) return;

    setSearchLoading(true);

    try {
      const params = new URLSearchParams({
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
        radius: "15",
        limit: "5",
      });

      const response = await fetch(`/api/search/nearby?${params}`);
      const data = await response.json();

      if (data.success) {
        setNearbyHospitals(data.results.hospitals || []);
      }
    } catch (error) {
      console.error("Nearby search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setSearchExpanded(false);
    setSearchQuery("");
  };

  const handleMobileSearch = () => {
    if (!searchQueryMobile.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQueryMobile)}`);
    setIsMobileMenuOpen(false);
    setSearchQueryMobile("");
  };

  const handleHospitalClick = (hospitalId) => {
    router.push(`/user/hospitals/${hospitalId}`);
    setSearchExpanded(false);
  };
  const handleDoctorClick = (doctorId) => {
    router.push(`/user/doctors/profile?id=${doctorId}`);
    setSearchExpanded(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setSearchExpanded(false);
      setSearchQuery("");
    }
  };

  const handleMobileSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleMobileSearch();
    }
  };

  const aboutMegaMenu = {
    sections: [
      {
        title: "Company",
        items: [
          { label: "About us", href: "/aboutus", icon: Info },
          { label: "Our offerings", href: "/services", icon: Award },
          { label: "How QLINIC works", href: "/how-it-works", icon: Target },
          { label: "Sustainability", href: "/sustainability", icon: Globe },
        ],
      },
      {
        title: "Resources",
        items: [
          { label: "Newsroom", href: "/news", icon: Newspaper },
          { label: "Investor relations", href: "/investors", icon: TrendingUp },
          { label: "Blog", href: "/blog", icon: BookOpen },
          { label: "Careers", href: "/careers", icon: Briefcase },
        ],
      },
      {
        title: "Legal",
        items: [
          { label: "Privacy Policy", href: "/privacy", icon: Shield },
          { label: "Terms of Service", href: "/terms", icon: FileText },
        ],
      },
    ],
  };

  const loginOptions = [
    {
      label: "user",
      icon: UserIcon,
      href: "/user",
      description: "Book appointments & manage health",
      gradient: "from-blue-500 to-teal-500",
    },
    {
      label: "Doctor",
      icon: Stethoscope,
      href: "/doctor",
      description: "Manage patients & appointments",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "Hospital Admin",
      icon: Building2,
      href: "/hospital-admin",
      description: "Hospital management",
      gradient: "from-violet-500 to-purple-500",
    },
  ];

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isAboutActive = () => {
    return aboutMegaMenu.sections.some((section) =>
      section.items.some((item) => pathname.startsWith(item.href))
    );
  };

  const getDashboardUrl = () => {
    const role = userRole || user?.role;
    switch (role) {
      case "user":
        return "/user";
      case "doctor":
        return "/doctor";
      case "hospital_admin":
        return "/hospital-admin";
      case "admin":
        return "/admin";
      case "sub_admin":
        return "/sub-admin";
      default:
        return "/";
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const name = user.name || user.email;
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
    toast.success("Signed out successfully");
  };

  return (
    <>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
      >
        <nav className="pt-2 sm:pt-4 px-2 sm:px-4 pointer-events-auto">
          {/* Main navbar container */}
          <div
            ref={searchRef}
            className={`max-w-7xl mx-auto rounded-2xl sm:rounded-3xl transition-all duration-300 ${
              isScrolled
                ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-blue-200/70 dark:border-blue-800/50 shadow-lg shadow-blue-100/20 dark:shadow-blue-900/20"
                : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-2 border-blue-100/50 dark:border-blue-900/30"
            }`}
          >
            <div className="px-3 sm:px-4 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-14 lg:h-16">
                {/* Logo */}
                <Link href="/" className="relative flex items-center group patientshrink-0">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Image
                      src="/LOGO.png"
                      alt="QLINIC"
                      width={40}
                      height={40}
                      className="rounded object-contain"
                      priority
                    />
                  </motion.div>
                  <div className="ml-2 sm:ml-2.5 hidden xs:block">
                    <div className="flex items-center gap-1">
                      <h1 className="text-lg sm:text-base lg:text-lg font-bold text-blue-600 dark:text-blue-400">
                        QLINIC
                      </h1>
                      <Sparkles className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium hidden sm:block">
                      We reduce chaos
                    </p>
                  </div>
                </Link>

                {/* Center nav - Desktop only */}
                <div className="hidden lg:flex items-center gap-1">
                  <Link
                    href="/"
                    className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all ${
                      isActive("/")
                        ? "text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/30"
                        : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/20"
                    }`}
                  >
                    Home
                  </Link>

                  <div className="relative" ref={aboutMenuRef}>
                    <button
                      onClick={() => setIsAboutMenuOpen(!isAboutMenuOpen)}
                      className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-all ${
                        isAboutActive()
                          ? "text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/30"
                          : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/20"
                      }`}
                    >
                      About
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          isAboutMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isAboutMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute left-0 mt-2 w-[600px] rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
                        >
                          <div className="p-6 grid grid-cols-3 gap-6">
                            {aboutMegaMenu.sections.map((section, idx) => (
                              <div key={idx}>
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                                  {section.title}
                                </h3>
                                <div className="space-y-1">
                                  {section.items.map((item) => (
                                    <Link
                                      key={item.href}
                                      href={item.href}
                                      onClick={() => setIsAboutMenuOpen(false)}
                                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/20 group transition-all"
                                    >
                                      <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                        {item.label}
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-1 lg:flex-none justify-end">
                  {/* Desktop location + search */}
                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    {/* Location button */}
                    <AnimatePresence>
                      {!searchExpanded && (
                        <motion.div
                          initial={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <button
                            onClick={() => setShowLocationModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/30 dark:bg-blue-900/20 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors whitespace-nowrap"
                          >
                            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="truncate max-w-[100px]">
                              {locationName || "Location"}
                            </span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Search bar */}
                    <motion.div
                      animate={{
                        width: searchExpanded ? "400px" : "200px",
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="relative"
                    >
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-600 dark:text-blue-400 z-10" />

                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder={
                          searchExpanded
                            ? "Search doctors, hospitals..."
                            : "Search..."
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchExpanded(true)}
                        onKeyDown={handleSearchKeyDown}
                        className="w-full pl-9 pr-9 h-8 text-xs rounded-full border-0 bg-blue-50/30 dark:bg-blue-900/20 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-blue-500 transition-all"
                        autoComplete="off"
                      />

                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors z-10"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      )}
                    </motion.div>
                  </div>

                  <div className="hidden md:block">
                    <ModeToggle />
                  </div>

                  {/* Auth - Desktop */}
                  <div className="hidden md:flex items-center gap-2">
                    {user ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="relative w-9 h-9 rounded-full border-2 border-blue-200 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                            <Avatar className="w-full h-full">
                              <AvatarImage src={user.image} alt={user.name} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-xs font-semibold">
                                {getUserInitials()}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl"
                        >
                          <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-semibold leading-none">
                                {user.name || "User"}
                              </p>
                              <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                                {userRole
                                  ?.replace("_", " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </p>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-blue-200/50 dark:bg-blue-800/50" />
                          <DropdownMenuItem
                            onClick={() => router.push(getDashboardUrl())}
                            className="cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20"
                          >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push("/settings")}
                            className="cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-blue-200/50 dark:bg-blue-800/50" />
                          <DropdownMenuItem
                            onClick={handleSignOut}
                            className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700 dark:focus:text-red-300"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign out</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <>
                        <div className="relative" ref={loginMenuRef}>
                          <button
                            onClick={() => setIsLoginMenuOpen(!isLoginMenuOpen)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
                          >
                            <LogIn className="w-4 h-4" />
                            <span>Login</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                isLoginMenuOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {isLoginMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-72 rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden z-[9999]"
                              >
                                <div className="p-2">
                                  {loginOptions.map((option) => (
                                    <button
                                      key={option.href}
                                      onClick={() => {
                                        setIsLoginMenuOpen(false);
                                        router.push(option.href);
                                      }}
                                      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group"
                                    >
                                      <div
                                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-sm`}
                                      >
                                        <option.icon className="w-5 h-5 text-white" />
                                      </div>
                                      <div className="text-left flex-1">
                                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                                          {option.label}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                          {option.description}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <Link
                          href="/sign-up"
                          className="group relative flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-semibold rounded-full hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                        >
                          <span className="relative z-10">Sign up</span>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Mobile toggle + Theme */}
                  <div className="flex md:hidden items-center gap-1.5">
                    <ModeToggle />
                    <button
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      aria-label="Toggle menu"
                    >
                      {isMobileMenuOpen ? (
                        <X className="w-5 h-5 sm:w-4 sm:h-4 text-gray-700 dark:text-gray-300" />
                      ) : (
                        <Menu className="w-5 h-5 sm:w-4 sm:h-4 text-gray-700 dark:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Results Dropdown - Desktop */}
            <AnimatePresence>
              {searchExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-blue-200/50 dark:border-blue-800/50"
                >
                  <div className="px-6 py-4 bg-gradient-to-b from-white/50 to-blue-50/30 dark:from-gray-900/50 dark:to-blue-950/20">
                    {searchQuery.trim().length >= 2 && (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-blue-600" />
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Search Results</h3>
                            {typedLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                          </div>
                          {(typedResults.hospitals.length + typedResults.doctors.length) > 0 && (
                            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0 text-xs">
                              {(typedResults.hospitals.length + typedResults.doctors.length)} found
                            </Badge>
                          )}
                        </div>

                        {typedResults.hospitals.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Hospital className="w-4 h-4 text-emerald-600" />
                              <h4 className="text-sm font-semibold">Hospitals</h4>
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                              {typedResults.hospitals.map((hospital, index) => (
                                <motion.button
                                  key={hospital.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => handleHospitalClick(hospital.id)}
                                  className="group p-3 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white dark:bg-gray-900 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all text-left"
                                >
                                  <div className="w-10 h-10 mb-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg overflow-hidden border border-blue-200 flex items-center justify-center">
                                    {hospital.logo ? (
                                      <Image src={hospital.logo} alt={hospital.name} width={40} height={40} className="w-full h-full object-cover" />
                                    ) : (
                                      <Building2 className="w-5 h-5 text-blue-600" />
                                    )}
                                  </div>
                                  <h4 className="font-bold text-xs text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors min-h-[32px]">{hospital.name}</h4>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1 line-clamp-1"><MapPin className="w-2.5 h-2.5 flex-shrink-0" />{hospital.city || 'Unknown location'}{hospital.state && `, ${hospital.state}`}</p>
                                  <div className="flex items-center justify-between">
                                    {hospital.rating > 0 && (<div className="flex items-center gap-1"><Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" /><span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{hospital.rating.toFixed(1)}</span></div>)}
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {typedResults.doctors.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Stethoscope className="w-4 h-4 text-blue-600" />
                              <h4 className="text-sm font-semibold">Doctors</h4>
                            </div>
                            <div className="grid gap-3 grid-cols-2">
                              {typedResults.doctors.map((d) => (
                                <button key={d.id} onClick={() => handleDoctorClick(d.id)} className="w-full text-left p-3 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white dark:bg-gray-900 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all">
                                  <p className="font-semibold text-xs text-gray-900 dark:text-white">{d.name}</p>
                                  {d.specialization && (<p className="text-[10px] text-blue-700 dark:text-blue-300 mt-0.5">{d.specialization}</p>)}
                                  {d.experience != null && (<p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{d.experience} yrs</p>)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {(typedResults.hospitals.length + typedResults.doctors.length) === 0 && !typedLoading && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">No results</p>
                        )}

                        <div className="h-px bg-blue-200/50 dark:bg-blue-800/50 my-3" />
                      </>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Hospital className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                          Nearby Hospitals
                        </h3>
                        {userLocation && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0"
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            {locationName}
                          </Badge>
                        )}
                      </div>
                      {nearbyHospitals.length > 0 && (
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0 text-xs">
                          {nearbyHospitals.length} found
                        </Badge>
                      )}
                    </div>

                    {searchLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          Finding nearby hospitals...
                        </span>
                      </div>
                    )}

                    {!searchLoading && !userLocation && (
                      <div className="text-center py-8">
                        <Navigation className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Enable location to see nearby hospitals
                        </p>
                        <button
                          onClick={getUserLocation}
                          disabled={locationLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-full transition-colors"
                        >
                          {locationLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Detecting...
                            </>
                          ) : (
                            <>
                              <Navigation className="w-4 h-4" />
                              Enable Location
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {!searchLoading && nearbyHospitals.length > 0 && (
                      <div className="grid grid-cols-5 gap-3">
                        {nearbyHospitals.map((hospital, index) => (
                          <motion.button
                            key={hospital.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleHospitalClick(hospital.id)}
                            className="group p-3 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white dark:bg-gray-900 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all text-left"
                          >
                            <div className="w-10 h-10 mb-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg overflow-hidden border border-blue-200 flex items-center justify-center">
                              {hospital.logo || hospital.image ? (
                                <Image
                                  src={hospital.logo || hospital.image}
                                  alt={hospital.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Building2 className="w-5 h-5 text-blue-600" />
                              )}
                            </div>

                            <h4 className="font-bold text-xs text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors min-h-[32px]">
                              {hospital.name}
                            </h4>

                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1 line-clamp-1">
                              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                              {hospital.city || hospital.location || "Unknown location"}
                            </p>

                            <div className="flex items-center justify-between">
                              {hospital.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                  <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                                    {hospital.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                              {hospital.distance && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                >
                                  {hospital.distance.toFixed(1)} km
                                </Badge>
                              )}
                            </div>

                            <div className="mt-2 flex items-center justify-center">
                              <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {!searchLoading &&
                      userLocation &&
                      nearbyHospitals.length === 0 && (
                        <div className="text-center py-8">
                          <Hospital className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            No hospitals found nearby
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Try expanding your search radius
                          </p>
                        </div>
                      )}

                    {nearbyHospitals.length > 0 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => {
                            router.push("/user/hospitals");
                            setSearchExpanded(false);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                        >
                          View All Hospitals
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-blue-200/70 dark:border-blue-800/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[calc(100vh-5rem)] overflow-y-auto"
              >
                <div className="p-4 space-y-3">
                  {/* User Profile Section - Mobile */}
                  {user && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-sm font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user.name || "User"}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                          {userRole
                            ?.replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Search - Mobile */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <Input
                      type="text"
                      placeholder="Search doctors, hospitals..."
                      value={searchQueryMobile}
                      onChange={(e) => setSearchQueryMobile(e.target.value)}
                      onKeyDown={handleMobileSearchKeyDown}
                      className="w-full pl-10 pr-10 h-11 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white dark:bg-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {searchQueryMobile && (
                      <button
                        onClick={() => setSearchQueryMobile("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Location - Mobile */}
                  <button
                    onClick={() => {
                      setShowLocationModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50/30 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="flex-1 text-left truncate">
                      {locationName || "Set Location"}
                    </span>
                  </button>

                  {/* Nav Links - Mobile */}
                  <div className="space-y-1">
                    <Link
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive("/")
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                      }`}
                    >
                      Home
                    </Link>

                    {/* About Submenu - Mobile */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setIsAboutMenuOpen(!isAboutMenuOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isAboutActive()
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                        }`}
                      >
                        <span>About</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isAboutMenuOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {isAboutMenuOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-4 space-y-1 overflow-hidden"
                          >
                            {aboutMegaMenu.sections.map((section) => (
                              <div key={section.title} className="space-y-1">
                                <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                  {section.title}
                                </p>
                                {section.items.map((item) => (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => {
                                      setIsMobileMenuOpen(false);
                                      setIsAboutMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
                                  >
                                    <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    {item.label}
                                  </Link>
                                ))}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Dashboard Link - Mobile (if logged in) */}
                    {user && (
                      <Link
                        href={getDashboardUrl()}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    )}

                    {user && (
                      <Link
                        href="/settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    )}
                  </div>

                  {/* Auth Section - Mobile */}
                  {user ? (
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-3 border-2 border-red-200 dark:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl font-semibold text-red-600 dark:text-red-400 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  ) : (
                    <div className="pt-3 border-t border-blue-200/50 dark:border-blue-800/50 space-y-3">
                      {/* Login Options - Mobile */}
                      <div className="space-y-2">
                        <p className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Login as
                        </p>
                        {loginOptions.map((option) => (
                          <Link
                            key={option.href}
                            href={option.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full flex items-start gap-3 p-3 rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
                          >
                            <div
                              className={`w-11 h-11 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}
                            >
                              <option.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <div className="font-semibold text-sm text-gray-900 dark:text-white">
                                {option.label}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {option.description}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Sign Up Button - Mobile */}
                      <Link
                        href="/sign-up"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg transition-all"
                      >
                        Sign up
                        <ArrowRight className="w-4 h-4" />
                      </Link>
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
          locationName={locationName}
          setLocationName={setLocationName}
          setUserLocation={setUserLocation}
          locationStatus={locationStatus}
          setLocationStatus={setLocationStatus}
          showLocationModal={showLocationModal}
          setShowLocationModal={setShowLocationModal}
          onLocationSelect={(location) => {
            if (searchExpanded) {
              fetchNearbyHospitals(location);
            }
          }}
        />
      )}
    </>
  );
};

export default Navbar;
