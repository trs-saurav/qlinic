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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import SearchBar from "@/components/location/SearchBar";

const Navbar = () => {
  const { router, userRole } = useAppContext();
  const { data: session, status } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const [isAboutMenuOpen, setIsAboutMenuOpen] = useState(false);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState("");

  const [searchQueryMobile, setSearchQueryMobile] = useState("");

  const loginMenuRef = useRef(null);
  const aboutMenuRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target)) {
        setIsLoginMenuOpen(false);
      }
      if (aboutMenuRef.current && !aboutMenuRef.current.contains(event.target)) {
        setIsAboutMenuOpen(false);
      }
    };

    if (isLoginMenuOpen || isAboutMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLoginMenuOpen, isAboutMenuOpen]);

  const handleLocationFromSearch = async (query) => {
    if (!query.trim()) return;
    try {
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q: query,
          format: "json",
          addressdetails: "1",
          limit: "1",
        }).toString();

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        toast.error("No matching location found");
        return;
      }

      const place = data[0];
      const city =
        place.address?.city ||
        place.address?.town ||
        place.address?.village ||
        place.display_name?.split(",")[0] ||
        "Your Location";
      const state = place.address?.state || "";
      const name = `${city}${state ? ", " + state : ""}`;

      const loc = {
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        name,
        timestamp: new Date().toISOString(),
      };

      setUserLocation(loc);
      setLocationName(name);
      setLocationStatus("success");
      localStorage.setItem("userLocation", JSON.stringify(loc));
      toast.success(`Location set to ${name}`);
    } catch (err) {
      toast.error("Unable to set location from search");
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
      label: "Patient",
      icon: UserIcon,
      href: "/sign-in?role=patient",
      description: "Book appointments & manage health",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      label: "Doctor",
      icon: Stethoscope,
      href: "/sign-in?role=doctor",
      description: "Manage patients & appointments",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "Hospital Admin",
      icon: Building2,
      href: "/sign-in?role=hospital_admin",
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
      case "patient":
        return "/patient";
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
        <nav className="pt-4 px-4 pointer-events-auto">
          <div
            className={`max-w-7xl mx-auto rounded-full transition-all duration-300 ${
              isScrolled
                ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-emerald-200/70 dark:border-emerald-800/50 shadow-lg shadow-emerald-100/20 dark:shadow-emerald-900/20"
                : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-2 border-emerald-100/50 dark:border-emerald-900/30"
            }`}
          >
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14 lg:h-16">
                {/* Logo */}
                <Link href="/" className="relative flex items-center group">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-lg p-1 border border-emerald-200/50 dark:border-emerald-800/50">
                      <Image
                        src="/LOGO.png"
                        alt="QLINIC"
                        width={40}
                        height={40}
                        className="rounded object-contain"
                        priority
                      />
                    </div>
                  </motion.div>
                  <div className="ml-2.5 hidden sm:block">
                    <div className="flex items-center gap-1">
                      <h1 className="text-base lg:text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        QLINIC
                      </h1>
                      <Sparkles className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                      Healthcare partner
                    </p>
                  </div>
                </Link>

                {/* Center nav */}
                <div className="hidden lg:flex items-center gap-1">
                  <Link
                    href="/"
                    className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all ${
                      isActive("/")
                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/30"
                        : "text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20"
                    }`}
                  >
                    Home
                  </Link>

                  <div className="relative" ref={aboutMenuRef}>
                    <button
                      onClick={() => setIsAboutMenuOpen(!isAboutMenuOpen)}
                      className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-all ${
                        isAboutActive()
                          ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/30"
                          : "text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20"
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
                          className="absolute left-0 mt-2 w-[600px] rounded-2xl border-2 border-emerald-200/50 dark:border-emerald-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
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
                                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 group transition-all"
                                    >
                                      <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
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
                <div className="flex items-center gap-2 lg:gap-3">
                  {/* Desktop location + search */}
                  <div className="hidden lg:flex items-center gap-2">
                    <LocationSelector
                      locationName={locationName}
                      setLocationName={setLocationName}
                      setUserLocation={setUserLocation}
                      locationStatus={locationStatus}
                      setLocationStatus={setLocationStatus}
                      showLocationModal={showLocationModal}
                      setShowLocationModal={setShowLocationModal}
                      buttonClassName="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/30 dark:bg-emerald-900/20 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                    />

                    <SearchBar onLocationFromSearch={handleLocationFromSearch} />
                  </div>

                  <div className="hidden lg:block">
                    <ModeToggle />
                  </div>

                  {/* Auth desktop */}
                  <div className="hidden md:flex items-center gap-2">
                    {user ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="relative w-9 h-9 rounded-full border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                            <Avatar className="w-full h-full">
                              <AvatarImage src={user.image} alt={user.name} />
                              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-semibold">
                                {getUserInitials()}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 rounded-2xl border-2 border-emerald-200/50 dark:border-emerald-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl"
                        >
                          <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-semibold leading-none">
                                {user.name || "User"}
                              </p>
                              <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                              </p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                                {userRole?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-emerald-200/50 dark:bg-emerald-800/50" />
                          <DropdownMenuItem
                            onClick={() => router.push(getDashboardUrl())}
                            className="cursor-pointer focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                          >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push('/settings')}
                            className="cursor-pointer focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-emerald-200/50 dark:bg-emerald-800/50" />
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
                            onClick={() =>
                              setIsLoginMenuOpen(!isLoginMenuOpen)
                            }
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-full hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all"
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
                                className="absolute right-0 mt-2 w-72 rounded-2xl border-2 border-emerald-200/50 dark:border-emerald-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                              >
                                <div className="p-2">
                                  {loginOptions.map((option) => (
                                    <button
                                      key={option.href}
                                      onClick={() => {
                                        setIsLoginMenuOpen(false);
                                        router.push(option.href);
                                      }}
                                      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all group"
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
                          className="group relative flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-full hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40"
                        >
                          <span className="relative z-10">Sign up</span>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Mobile toggle */}
                  <div className="lg:hidden flex items-center gap-2">
                    <ModeToggle />
                    <button
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                    >
                      {isMobileMenuOpen ? (
                        <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      ) : (
                        <Menu className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-emerald-200/70 dark:border-emerald-800/50 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {/* Mobile user info */}
                  {user && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-semibold">
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
                      </div>
                    </div>
                  )}

                  {/* Mobile location */}
                  <button
                    onClick={() => {
                      setShowLocationModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="truncate">
                      {locationName || "Set location"}
                    </span>
                  </button>

                  {/* Mobile search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search doctors..."
                      value={searchQueryMobile}
                      onChange={(e) => setSearchQueryMobile(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQueryMobile) {
                          router.push(`/search?q=${searchQueryMobile}`);
                          setIsMobileMenuOpen(false);
                          setSearchQueryMobile("");
                        }
                      }}
                      className="w-full pl-10 pr-4 rounded-xl border-emerald-200/50 dark:border-emerald-800/50 focus:border-emerald-500 dark:focus:border-emerald-500"
                    />
                  </div>

                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all ${
                      isActive("/")
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Home
                  </Link>

                  {user && (
                    <Link
                      href={getDashboardUrl()}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                  )}

                  <div className="space-y-2">
                    <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      About
                    </p>
                    {aboutMegaMenu.sections.map((section) => (
                      <div key={section.title} className="space-y-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 transition-all"
                          >
                            <item.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-medium">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>

                  {user ? (
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-200 dark:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl font-semibold text-red-600 dark:text-red-400 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  ) : (
                    <div className="pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50 space-y-2">
                      <Link
                        href="/sign-in"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 rounded-xl font-semibold text-gray-900 dark:text-white transition-all"
                      >
                        <LogIn className="w-4 h-4" />
                        Login
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg transition-all"
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

      {/* Hidden LocationSelector */}
      <LocationSelector
        locationName={locationName}
        setLocationName={setLocationName}
        setUserLocation={setUserLocation}
        locationStatus={locationStatus}
        setLocationStatus={setLocationStatus}
        showLocationModal={showLocationModal}
        setShowLocationModal={setShowLocationModal}
        buttonClassName="hidden"
      />
    </>
  );
};

export default Navbar;
