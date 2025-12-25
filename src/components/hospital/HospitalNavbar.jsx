"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useHospitalAdmin } from "@/context/HospitalAdminContext";
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
  Hospital,
  Loader2,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/extra/ModeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const pathname = usePathname();
  const { user } = useUser();

  // Get data from context instead of local state
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

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const isActive = (href) => pathname === href;

  // Calculate total alerts
  const totalAlerts = unreadCount + (lowStockItems?.length || 0) + (pendingDoctorRequests?.length || 0);

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Hospital Name */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              <Link href="/hospital-admin" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Hospital className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  {hospitalLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Loading...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-foreground leading-tight">
                          {hospital?.name || "Hospital"}
                        </h1>
                        {hospital?.isVerified && (
                          <CheckCircle className="w-4 h-4 text-emerald-500" title="Verified Hospital" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {hospital?.address?.city && (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span>
                              {hospital.address.city}, {hospital.address.state}
                            </span>
                          </>
                        )}
                        {!hospital?.address?.city && (
                          <span>Hospital Administration</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Link>
            </div>

            {/* Right: Theme + Notifications + User */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <div className="hidden md:block">
                <ModeToggle />
              </div>

              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {totalAlerts > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-600">
                        {totalAlerts > 9 ? '9+' : totalAlerts}
                      </Badge>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-2">
                    <h3 className="font-semibold text-sm mb-2 px-2">Notifications</h3>
                    
                    {/* Alerts Section */}
                    {(lowStockItems?.length > 0 || pendingDoctorRequests?.length > 0) && (
                      <div className="space-y-1 mb-2">
                        {lowStockItems?.length > 0 && (
                          <Link href="/hospital-admin/inventory">
                            <DropdownMenuItem className="cursor-pointer">
                              <div className="flex items-start gap-2 w-full">
                                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">Low Stock Alert</p>
                                  <p className="text-xs text-muted-foreground">
                                    {lowStockItems.length} items need restocking
                                  </p>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          </Link>
                        )}
                        {pendingDoctorRequests?.length > 0 && (
                          <Link href="/hospital-admin/staff">
                            <DropdownMenuItem className="cursor-pointer">
                              <div className="flex items-start gap-2 w-full">
                                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">Pending Approvals</p>
                                  <p className="text-xs text-muted-foreground">
                                    {pendingDoctorRequests.length} doctor requests
                                  </p>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Recent Notifications */}
                    {notifications?.length > 0 ? (
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {notifications.slice(0, 5).map((notification) => (
                          <DropdownMenuItem
                            key={notification._id}
                            className="cursor-pointer"
                            onClick={() => markNotificationRead(notification._id)}
                          >
                            <div className="flex items-start gap-2 w-full">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                notification.read ? 'bg-slate-300' : 'bg-blue-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'font-medium'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    )}

                    {notifications?.length > 5 && (
                      <Link href="/hospital-admin/notifications">
                        <DropdownMenuItem className="cursor-pointer justify-center text-sm text-blue-600 dark:text-blue-400 font-medium mt-2">
                          View all notifications
                        </DropdownMenuItem>
                      </Link>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Info */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-lg">
                <span className="text-sm font-medium">
                  {user?.firstName || "Admin"}
                </span>
              </div>

              {/* User Button */}
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);

              // Show badge for specific tabs with alerts
              let badgeCount = 0;
              if (tab.id === "INVENTORY" && lowStockItems?.length > 0) {
                badgeCount = lowStockItems.length;
              } else if (tab.id === "STAFF" && pendingDoctorRequests?.length > 0) {
                badgeCount = pendingDoctorRequests.length;
              }

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap relative ${
                    active
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {badgeCount > 0 && (
                    <Badge className="h-5 min-w-[20px] px-1 text-[10px] bg-red-500 hover:bg-red-600">
                      {badgeCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed top-0 left-0 bottom-0 w-80 bg-background shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Menu</h2>
                  {hospital && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {hospital.name}
                      </p>
                      {hospital.isVerified && (
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-accent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Alerts in Mobile Menu */}
              {(lowStockItems?.length > 0 || pendingDoctorRequests?.length > 0) && (
                <div className="space-y-2 mb-4 pb-4 border-b border-border">
                  {lowStockItems?.length > 0 && (
                    <Link href="/hospital-admin/inventory" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Low Stock</p>
                          <p className="text-xs text-muted-foreground">{lowStockItems.length} items</p>
                        </div>
                      </div>
                    </Link>
                  )}
                  {pendingDoctorRequests?.length > 0 && (
                    <Link href="/hospital-admin/staff" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Pending Approvals</p>
                          <p className="text-xs text-muted-foreground">{pendingDoctorRequests.length} requests</p>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              )}

              <nav className="space-y-2">
                {navigationTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = isActive(tab.href);

                  // Show badge for specific tabs with alerts
                  let badgeCount = 0;
                  if (tab.id === "INVENTORY" && lowStockItems?.length > 0) {
                    badgeCount = lowStockItems.length;
                  } else if (tab.id === "STAFF" && pendingDoctorRequests?.length > 0) {
                    badgeCount = pendingDoctorRequests.length;
                  }

                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                        active
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </div>
                      {badgeCount > 0 && (
                        <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-red-500 hover:bg-red-600">
                          {badgeCount}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Theme Toggle */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-medium">Theme</span>
                  <ModeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
