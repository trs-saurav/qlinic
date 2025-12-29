"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useHospitalAdmin } from "@/context/HospitalAdminContext";
import Image from "next/image";
import {
  Home,
  Calendar,
  Users,
  Stethoscope,
  Package,
  MessageSquare,
  Settings,
  Bell,
  Menu,
  X,
  BarChart3,
  ClipboardList,
  Loader2,
  MapPin,
  CheckCircle,
  Hash,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
  Building2,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/extra/ModeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const navigationTabs = [
  { id: "OVERVIEW", label: "Overview", icon: Home, href: "/hospital-admin" },
  {
    id: "RECEPTION",
    label: "Reception",
    icon: ClipboardList,
    href: "/hospital-admin/reception",
  },
  {
    id: "APPOINTMENTS",
    label: "Appointments",
    icon: Calendar,
    href: "/hospital-admin/appointments",
  },
  {
    id: "STAFF",
    label: "Staff",
    icon: Stethoscope,
    href: "/hospital-admin/staff",
  },
  {
    id: "PATIENTS",
    label: "Patients",
    icon: Users,
    href: "/hospital-admin/patients",
  },
  {
    id: "INVENTORY",
    label: "Inventory",
    icon: Package,
    href: "/hospital-admin/inventory",
  },
  {
    id: "FEEDBACK",
    label: "Feedback",
    icon: MessageSquare,
    href: "/hospital-admin/feedback",
  },
  {
    id: "REPORTS",
    label: "Reports",
    icon: BarChart3,
    href: "/hospital-admin/reports",
  },
  {
    id: "SETTINGS",
    label: "Settings",
    icon: Settings,
    href: "/hospital-admin/settings",
  },
];

export default function HospitalNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  const {
    hospital,
    hospitalLoading,
    notifications,
    unreadCount,
    lowStockItems,
    pendingDoctorRequests,
    markNotificationRead,
    fetchNotifications,
  } = useHospitalAdmin();

  const shortId = hospital?._id?.toString().slice(-8).toUpperCase();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const isActive = (href) => pathname === href;

  const totalAlerts =
    unreadCount +
    (lowStockItems?.length || 0) +
    (pendingDoctorRequests?.length || 0);

  const copyShortId = async () => {
    if (!shortId) return;

    try {
      await navigator.clipboard.writeText(shortId);
      setIdCopied(true);
      toast.success("Hospital ID copied");
      setTimeout(() => setIdCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy ID");
    }
  };

  return (
    <>
      {/* ========== TIER 1: QLINIC BRANDING BAR ========== */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-b border-blue-900/50 shadow-lg">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left: Qlinic Logo & Brand */}
            <Link href="/" className="flex items-center gap-3 group">
              {/* WHITE BACKGROUND FOR LOGO VISIBILITY */}
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                <Image
                  src="/LOGO.png"
                  alt="Qlinic"
                  width={32}
                  height={32}
                  className="object-contain p-0.5"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Qlinic
                </h1>
                <p className="text-[10px] text-blue-100 -mt-0.5 font-medium">
                  Healthcare Platform
                </p>
              </div>
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              {/* Theme Toggle */}
              <div className="hidden md:block">
                <ModeToggle />
              </div>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-white/10 text-white"
                  >
                    <Bell className="w-5 h-5" />
                    {totalAlerts > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1"
                      >
                        <Badge className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-600 border-2 border-blue-700">
                          {totalAlerts > 9 ? "9+" : totalAlerts}
                        </Badge>
                      </motion.div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[380px]">
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      {totalAlerts > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {totalAlerts} new
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="max-h-[400px]">
                    {/* Alerts */}
                    {(lowStockItems?.length > 0 ||
                      pendingDoctorRequests?.length > 0) && (
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                          System Alerts
                        </p>
                        {lowStockItems?.length > 0 && (
                          <Link href="/hospital-admin/inventory">
                            <DropdownMenuItem className="cursor-pointer p-3 rounded-lg">
                              <div className="flex items-start gap-3 w-full">
                                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">
                                    Low Stock Alert
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {lowStockItems.length} items need restocking
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </DropdownMenuItem>
                          </Link>
                        )}
                        {pendingDoctorRequests?.length > 0 && (
                          <Link href="/hospital-admin/staff">
                            <DropdownMenuItem className="cursor-pointer p-3 rounded-lg">
                              <div className="flex items-start gap-3 w-full">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                  <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">
                                    Pending Approvals
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {pendingDoctorRequests.length} requests
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </DropdownMenuItem>
                          </Link>
                        )}
                      </div>
                    )}

                    {(lowStockItems?.length > 0 ||
                      pendingDoctorRequests?.length > 0) &&
                      notifications?.length > 0 && <DropdownMenuSeparator />}

                    {/* Notifications */}
                    {notifications?.length > 0 ? (
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                          Recent Activity
                        </p>
                        {notifications.slice(0, 5).map((notification) => (
                          <DropdownMenuItem
                            key={notification._id}
                            className="cursor-pointer p-3 rounded-lg"
                            onClick={() =>
                              markNotificationRead(notification._id)
                            }
                          >
                            <div className="flex items-start gap-3 w-full">
                              <div
                                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                  notification.read
                                    ? "bg-slate-300 dark:bg-slate-700"
                                    : "bg-blue-500"
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm ${
                                    notification.read
                                      ? "text-muted-foreground"
                                      : "font-medium"
                                  }`}
                                >
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {new Date(
                                      notification.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : (
                      !lowStockItems?.length &&
                      !pendingDoctorRequests?.length && (
                        <div className="p-8 text-center">
                          <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No notifications
                          </p>
                        </div>
                      )
                    )}
                  </ScrollArea>

                  {notifications?.length > 5 && (
                    <>
                      <DropdownMenuSeparator />
                      <Link href="/hospital-admin/notifications">
                        <DropdownMenuItem className="cursor-pointer justify-center text-sm text-blue-600 dark:text-blue-400 font-medium py-3">
                          View all notifications
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Info */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <span className="text-sm font-medium text-white">
                  {user?.firstName || "Admin"}
                </span>
              </div>

              {/* User Button */}
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 ring-2 ring-white/30",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========== TIER 2: HOSPITAL PROFILE BAR ========== */}
      <div className="sticky top-14 z-40 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between py-3">
            {/* Hospital Profile */}
            <div className="flex items-center gap-4">
              {/* Hospital Logo */}
              <div className="relative">
                {hospitalLoading ? (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ) : hospital?.logo ? (
                  <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700 shadow-sm">
                    <Image
                      src={hospital.logo}
                      alt={hospital.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-700">
                    <Building2 className="w-7 h-7 text-slate-400 dark:text-slate-600" />
                  </div>
                )}
              </div>

              {/* Hospital Info */}
              <div className="hidden sm:block">
                {hospitalLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Name & Verification */}
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {hospital?.name || "Hospital"}
                      </h2>
                      {hospital?.isVerified && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 rounded-full border border-blue-200 dark:border-blue-800">
                          <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">
                            Verified
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ID & Location */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                      {shortId && (
                        <>
                          <button
                            onClick={copyShortId}
                            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/copy"
                            title="Click to copy ID"
                          >
                            <Hash className="w-3.5 h-3.5" />
                            <span className="font-mono font-medium">
                              {shortId}
                            </span>
                            <div className="opacity-0 group-hover/copy:opacity-100 transition-opacity">
                              {idCopied ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </div>
                          </button>
                          <Separator
                            orientation="vertical"
                            className="h-3"
                          />
                        </>
                      )}
                      {hospital?.address?.city && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>
                            {hospital.address.city}, {hospital.address.state}
                          </span>
                        </div>
                      )}
                      {hospital?.contactDetails?.phone && (
                        <>
                          <Separator
                            orientation="vertical"
                            className="h-3"
                          />
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{hospital.contactDetails.phone}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {lowStockItems?.length > 0 && (
                <Link href="/hospital-admin/inventory">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-orange-200 dark:border-orange-900 hover:bg-orange-50 dark:hover:bg-orange-950"
                  >
                    <AlertCircle className="w-3 h-3 mr-1.5 text-orange-600 dark:text-orange-400" />
                    {lowStockItems.length} Low Stock
                  </Button>
                </Link>
              )}
              {pendingDoctorRequests?.length > 0 && (
                <Link href="/hospital-admin/staff">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Stethoscope className="w-3 h-3 mr-1.5 text-blue-600 dark:text-blue-400" />
                    {pendingDoctorRequests.length} Pending
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* ========== NAVIGATION TABS ========== */}
          <div className="hidden lg:flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);

              let badgeCount = 0;
              if (tab.id === "INVENTORY" && lowStockItems?.length > 0) {
                badgeCount = lowStockItems.length;
              } else if (
                tab.id === "STAFF" &&
                pendingDoctorRequests?.length > 0
              ) {
                badgeCount = pendingDoctorRequests.length;
              }

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap relative ${
                    active
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {badgeCount > 0 && (
                    <Badge className="h-4 min-w-[16px] px-1 text-[10px] bg-red-500 hover:bg-red-600">
                      {badgeCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========== MOBILE MENU ========== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-80 bg-white dark:bg-slate-950 shadow-2xl lg:hidden"
            >
              <ScrollArea className="h-full">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6 pb-6 border-b">
                    <div className="flex items-center gap-3">
                      {hospital?.logo ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700">
                          <Image
                            src={hospital.logo}
                            alt={hospital.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-base font-bold flex items-center gap-1">
                          {hospital?.name || "Hospital"}
                          {hospital?.isVerified && (
                            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                          )}
                        </h2>
                        {shortId && (
                          <button
                            onClick={copyShortId}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-600 transition-colors mt-0.5"
                          >
                            <Hash className="w-3 h-3" />
                            <span className="font-mono">{shortId}</span>
                            {idCopied ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Alerts */}
                  {(lowStockItems?.length > 0 ||
                    pendingDoctorRequests?.length > 0) && (
                    <div className="space-y-2 mb-6 pb-6 border-b">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Alerts
                      </p>
                      {lowStockItems?.length > 0 && (
                        <Link
                          href="/hospital-admin/inventory"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/50">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Low Stock</p>
                              <p className="text-xs text-muted-foreground">
                                {lowStockItems.length} items
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </Link>
                      )}
                      {pendingDoctorRequests?.length > 0 && (
                        <Link
                          href="/hospital-admin/staff"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                              <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                Pending Approvals
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {pendingDoctorRequests.length} requests
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Navigation */}
                  <nav className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                      Navigation
                    </p>
                    {navigationTabs.map((tab) => {
                      const Icon = tab.icon;
                      const active = isActive(tab.href);

                      let badgeCount = 0;
                      if (tab.id === "INVENTORY" && lowStockItems?.length > 0) {
                        badgeCount = lowStockItems.length;
                      } else if (
                        tab.id === "STAFF" &&
                        pendingDoctorRequests?.length > 0
                      ) {
                        badgeCount = pendingDoctorRequests.length;
                      }

                      return (
                        <Link
                          key={tab.id}
                          href={tab.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                            active
                              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 shadow-sm"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            <span className="text-sm">{tab.label}</span>
                          </div>
                          {badgeCount > 0 && (
                            <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-red-500">
                              {badgeCount}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Theme Toggle */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm font-medium">Theme</span>
                      <ModeToggle />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
