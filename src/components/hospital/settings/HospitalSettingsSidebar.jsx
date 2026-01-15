"use client";

import React from "react";
import { ModeToggle } from "@/components/extra/ModeToggle";
import {
  Building2,
  Globe,
  Shield,
  BellRing,
  Users,
  Wallet,
  Settings,
  HelpCircle,
  Info,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const settingsItems = [
  {
    id: "profile",
    icon: Building2,
    label: "Hospital Profile",
    description: "Manage hospital details & info",
  },
  {
    id: "language",
    icon: Globe,
    label: "Language & Region",
    description: "Language, timezone & preferences",
  },
  {
    id: "privacy",
    icon: Shield,
    label: "Privacy & Security",
    description: "Data sharing & access control",
  },
  {
    id: "notifications",
    icon: BellRing,
    label: "Notifications",
    description: "Email, SMS & app alerts",
  },
  {
    id: "staff",
    icon: Users,
    label: "Staff Management",
    description: "Roles & permissions",
  },
  {
    id: "billing",
    icon: Wallet,
    label: "Billing & Payments",
    description: "Payment methods & invoices",
  },
];

const otherItems = [
  {
    id: "help",
    icon: HelpCircle,
    label: "Help & Support",
    description: "Get help and contact support",
  },
  {
    id: "about",
    icon: Info,
    label: "About Qlinic",
    description: "Version and system info",
  },
];

export default function HospitalSettingsSidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="w-72 bg-card border-r border-border h-screen fixed left-0 top-0 overflow-y-auto z-20">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="pb-3 border-b border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage hospital preferences
          </p>
        </div>

        {/* Main Settings */}
        <nav className="space-y-1">
          {settingsItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                activeSection === item.id
                  ? "bg-primary/10 border-2 border-primary/30"
                  : "bg-transparent hover:bg-accent/50 border-2 border-transparent"
              }`}
            >
              <div className="mt-0.5">
                <item.icon
                  className={`w-5 h-5 ${
                    activeSection === item.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    activeSection === item.id ? "text-primary" : ""
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Other Items */}
        <nav className="space-y-1">
          {otherItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                activeSection === item.id
                  ? "bg-primary/10 border-2 border-primary/30"
                  : "bg-transparent hover:bg-accent/50 border-2 border-transparent"
              }`}
            >
              <div className="mt-0.5">
                <item.icon
                  className={`w-5 h-5 ${
                    activeSection === item.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    activeSection === item.id ? "text-primary" : ""
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Theme Toggle */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-accent/30">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">Theme</div>
          </div>
          <ModeToggle />
        </div>

        {/* Account Section */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-accent/30">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">Account</div>
          </div>
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 rounded-full",
              },
            }}
          />
        </div>
      </div>
    </aside>
  );
}
