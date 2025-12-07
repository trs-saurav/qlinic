"use client"
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "./extra/ModeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  X, 
  Home,
  Info,
  Phone,
  Sparkles,
  PlusSquare,
  LogIn,
  ArrowRight,
  User as UserIcon,
  Stethoscope,
  Building2,
  ChevronDown,
  LayoutDashboard
} from "lucide-react";

const Navbar = () => {
  const { router, user, userRole } = useAppContext();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const [isMobileLoginOpen, setIsMobileLoginOpen] = useState(false);
  const loginMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close login dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target)) {
        setIsLoginMenuOpen(false);
      }
    };

    if (isLoginMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLoginMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileLoginOpen(false);
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/aboutus", label: "About", icon: Info },
    { href: "/solution", label: "Solutions", icon: PlusSquare },
    { href: "/contact-us", label: "Contact", icon: Phone },
  ];

  const loginOptions = [
    {
      label: "Patient",
      icon: UserIcon,
      href: "/sign-in?role=patient",
      description: "Book appointments & manage health records",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      label: "Doctor",
      icon: Stethoscope,
      href: "/sign-in?role=doctor",
      description: "Manage patients & appointments",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      label: "Hospital Admin",
      icon: Building2,
      href: "/sign-in?role=hospital_admin",
      description: "Hospital management dashboard",
      gradient: "from-purple-500 to-pink-500"
    },
  ];

  const isActive = (href) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleLoginOptionClick = (href) => {
    setIsLoginMenuOpen(false);
    router.push(href);
  };

  const handleMobileLoginOptionClick = (href) => {
    closeMobileMenu();
    router.push(href);
  };

  // Get role-specific dashboard URL
  const getDashboardUrl = () => {
    const role = user?.publicMetadata?.role || user?.unsafeMetadata?.role || userRole;
    
    switch(role) {
      case 'patient':
        return '/patient';
      case 'doctor':
        return '/doctor';
      case 'hospital_admin':
        return '/hospital-admin';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <>
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      >
        <nav className="pt-4 px-4 pointer-events-auto">
          <div className={`
            max-w-7xl mx-auto rounded-full transition-all duration-300
            ${isScrolled 
              ? 'bg-background/95 backdrop-blur-xl border-2 border-blue-200/70 dark:border-blue-800/70 shadow-lg' 
              : 'bg-background/80 backdrop-blur-md border-2 border-blue-100/50 dark:border-blue-900/50'
            }
          `}>
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14 lg:h-16">
                
                {/* Logo Section */}
                <Link 
                  href="/" 
                  className="relative flex items-center group transition-all duration-300"
                  aria-label="QLINIC Home"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md"></div>
                    <div className="relative w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950 dark:to-violet-950 rounded-lg p-1 border border-blue-200/50 dark:border-blue-800/50">
                      <Image 
                        src="/LOGO.png" 
                        alt="QLINIC Logo" 
                        width={40} 
                        height={40} 
                        className="rounded object-contain"
                        priority
                      />
                    </div>
                  </motion.div>
                  
                  <div className="ml-2.5 hidden sm:block">
                    <div className="flex items-center gap-1">
                      <h1 className="text-base lg:text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-violet-700 transition-all duration-300">
                        QLINIC
                      </h1>
                      <Sparkles className="w-3.5 h-3.5 text-violet-500 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                      Healthcare partner
                    </p>
                  </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center space-x-1">
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
                          relative px-3 py-2 text-sm font-medium transition-colors duration-200 group
                          ${isActive(item.href) 
                            ? 'text-foreground' 
                            : 'text-foreground/60 hover:text-foreground'
                          }
                        `}
                      >
                        {item.label}
                        <span className={`
                          absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full transition-all duration-300
                          ${isActive(item.href) 
                            ? 'w-3/4' 
                            : 'w-0 group-hover:w-3/4'
                          }
                        `}></span>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 lg:gap-3">
                  
                  {/* Theme Toggle - Desktop */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="hidden lg:block"
                  >
                    <ModeToggle />
                  </motion.div>

                  {/* User Section - Desktop */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="hidden md:flex items-center gap-2"
                  >
                    {user ? (
                      <UserButton 
                        appearance={{
                          elements: {
                            avatarBox: "w-9 h-9 rounded-full border-2 border-border hover:border-primary transition-colors duration-200",
                            userButtonPopoverCard: "bg-background border border-border shadow-2xl",
                            userButtonPopoverActionButton: "hover:bg-accent transition-colors duration-200"
                          }
                        }}
                      >
                        <UserButton.MenuItems>
                          <UserButton.Action 
                            label="Dashboard" 
                            labelIcon={<LayoutDashboard className="w-4 h-4" />} 
                            onClick={() => router.push(getDashboardUrl())} 
                          />
                        </UserButton.MenuItems>
                      </UserButton>
                    ) : (
                      <>
                        {/* Login Dropdown - Desktop */}
                        <div className="relative" ref={loginMenuRef}>
                          <button
                            onClick={() => setIsLoginMenuOpen(!isLoginMenuOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors duration-200 rounded-full hover:bg-accent/50"
                          >
                            <LogIn className="w-4 h-4" />
                            <span>Login</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLoginMenuOpen ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {isLoginMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-72 rounded-2xl border-2 border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
                              >
                                <div className="p-2">
                                  {loginOptions.map((option, index) => (
                                    <motion.button
                                      key={option.href}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.05 }}
                                      onClick={() => handleLoginOptionClick(option.href)}
                                      className="w-full group relative flex items-start gap-3 p-3 rounded-xl hover:bg-accent/60 transition-all duration-200 overflow-hidden"
                                    >
                                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${option.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}>
                                        <option.icon className={`w-5 h-5 bg-gradient-to-br ${option.gradient} bg-clip-text text-transparent`} strokeWidth={2.5} />
                                      </div>
                                      <div className="flex-1 text-left">
                                        <div className="font-semibold text-sm text-foreground group-hover:text-foreground transition-colors">
                                          {option.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                          {option.description}
                                        </div>
                                      </div>
                                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 mt-1" />
                                    </motion.button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Get Started Button */}
                        <Link 
                          href="/sign-up"
                          className="group relative flex items-center gap-1.5 px-4 py-1.5 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-foreground/90 transition-all duration-200 overflow-hidden"
                        >
                          <span className="relative z-10">Get Started</span>
                          <ArrowRight className="w-3.5 h-3.5 relative z-10 group-hover:translate-x-0.5 transition-transform duration-200" />
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                      </>
                    )}
                  </motion.div>

                  {/* Mobile Theme Toggle */}
                  <div className="lg:hidden">
                    <ModeToggle />
                  </div>

                  {/* Mobile Menu Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMobileMenu}
                    className="lg:hidden flex items-center justify-center w-9 h-9 bg-accent/50 hover:bg-accent rounded-full transition-all duration-200"
                    aria-label="Toggle mobile menu"
                  >
                    <AnimatePresence mode="wait">
                      {isMobileMenuOpen ? (
                        <motion.div
                          key="close"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <X className="w-4 h-4 text-foreground" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="menu"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Menu className="w-4 h-4 text-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="mt-2 bg-background/95 backdrop-blur-xl border-2 border-blue-200/70 dark:border-blue-800/70 rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="px-4 py-4">
                  
                  {/* Mobile Navigation Links */}
                  <div className="space-y-1 mb-4">
                    {navItems.map((item, index) => (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link 
                          href={item.href}
                          className={`
                            flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                            ${isActive(item.href)
                              ? 'bg-accent/80 text-foreground'
                              : 'text-foreground/70 hover:bg-accent/50 hover:text-foreground'
                            }
                          `}
                          onClick={closeMobileMenu}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Mobile Actions Footer */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-2 pt-3 border-t border-border/50"
                  >
                    {user ? (
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-accent/30 rounded-xl">
                        <UserButton 
                          appearance={{
                            elements: {
                              avatarBox: "w-9 h-9 rounded-full border-2 border-border",
                              userButtonPopoverCard: "bg-background border border-border shadow-2xl"
                            }
                          }}
                        >
                          <UserButton.MenuItems>
                            <UserButton.Action 
                              label="Dashboard" 
                              labelIcon={<LayoutDashboard className="w-4 h-4" />} 
                              onClick={() => {
                                router.push(getDashboardUrl());
                                closeMobileMenu();
                              }} 
                            />
                          </UserButton.MenuItems>
                        </UserButton>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-foreground">My Account</span>
                          <span className="text-xs text-muted-foreground">Manage your profile</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Mobile Login Dropdown */}
                        <div>
                          <button
                            onClick={() => setIsMobileLoginOpen(!isMobileLoginOpen)}
                            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border-2 border-border hover:bg-accent transition-all duration-200"
                          >
                            <div className="flex items-center gap-2">
                              <LogIn className="w-4 h-4" />
                              <span>Login</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileLoginOpen ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {isMobileLoginOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-2 space-y-1 pl-2"
                              >
                                {loginOptions.map((option, index) => (
                                  <motion.button
                                    key={option.href}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleMobileLoginOptionClick(option.href)}
                                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-accent/60 transition-all duration-200 text-left"
                                  >
                                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br ${option.gradient} opacity-10`}>
                                      <option.icon className={`w-4 h-4 bg-gradient-to-br ${option.gradient} bg-clip-text text-transparent`} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-sm text-foreground">
                                        {option.label}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {option.description}
                                      </div>
                                    </div>
                                  </motion.button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Mobile Get Started Button */}
                        <Link 
                          href="/sign-up"
                          onClick={closeMobileMenu}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl hover:bg-foreground/90 transition-all duration-200"
                        >
                          Get Started
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </motion.div>
    </>
  );
};

export default Navbar;
