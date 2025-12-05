"use client"
import React, { useState, useEffect } from "react";
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
  Package,
  ShoppingBag,
  Settings,
  PlusSquare,
  LogIn,
  ArrowRight
} from "lucide-react";

const Navbar = () => {
  const { router, user } = useAppContext();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/aboutus", label: "About", icon: Info },
    { href: "/solution", label: "Solutions", icon: PlusSquare },
    { href: "/contact-us", label: "Contact", icon: Phone },
  ];

  const isActive = (href) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
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
              ? 'bg-background/95 backdrop-blur-xl border-2 border-blue-200/70 dark:border-blue-800/70' 
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
                        src="/logo.png" 
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
                  
                  {/* Theme Toggle */}
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
                            labelIcon={<Package className="w-4 h-4" />} 
                            onClick={() => router.push('/dashboard')} 
                          />
                          <UserButton.Action 
                            label="Appointments" 
                            labelIcon={<ShoppingBag className="w-4 h-4" />} 
                            onClick={() => router.push('/apartments')} 
                          />
                          <UserButton.Action 
                            label="Settings" 
                            labelIcon={<Settings className="w-4 h-4" />} 
                            onClick={() => router.push('/settings')} 
                          />
                        </UserButton.MenuItems>
                      </UserButton>
                    ) : (
                      <>
                        <Link 
                          href="/sign-in"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors duration-200"
                        >
                          Login
                        </Link>
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
                className="mt-2 bg-background/95 backdrop-blur-xl border-2 border-blue-200/70 dark:border-blue-800/70 rounded-3xl overflow-hidden"
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
                              labelIcon={<Package className="w-4 h-4" />} 
                              onClick={() => {
                                router.push('/dashboard');
                                closeMobileMenu();
                              }} 
                            />
                            <UserButton.Action 
                              label="Appointments" 
                              labelIcon={<ShoppingBag className="w-4 h-4" />} 
                              onClick={() => {
                                router.push('/appointments');
                                closeMobileMenu();
                              }} 
                            />
                            <UserButton.Action 
                              label="Settings" 
                              labelIcon={<Settings className="w-4 h-4" />} 
                              onClick={() => {
                                router.push('/settings');
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
                        <Link 
                          href="/sign-in"
                          onClick={closeMobileMenu}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border-2 border-border hover:bg-accent transition-all duration-200"
                        >
                          <LogIn className="w-4 h-4" />
                          Login
                        </Link>
                        <Link 
                          href="/get-started"
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
