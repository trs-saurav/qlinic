"use client";

import React, { useState } from "react";
import HospitalSettingsSidebar from "@/components/hospital/HospitalSettingsSidebar";
import HospitalProfileSettings from "@/components/hospital/settings/HospitalProfileSettings";
import LanguageSettings from "@/components/hospital/settings/LanguageSettings";
import PrivacySettings from "@/components/hospital/settings/PrivacySettings";

export default function HospitalSettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return <HospitalProfileSettings />;
      case "language":
        return <LanguageSettings />;
      case "privacy":
        return <PrivacySettings />;
      case "notifications":
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Notifications settings coming soon...
          </div>
        );
      case "staff":
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Staff management coming soon...
          </div>
        );
      case "billing":
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Billing settings coming soon...
          </div>
        );
      case "help":
        return <HelpSupport />;
      case "about":
        return <AboutQlinic />;
      default:
        return <HospitalProfileSettings />;
    }
  };

  return (
    <>
      {/* Fixed Sidebar */}
      <HospitalSettingsSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Main Content - Responsive padding for sidebar */}
      <div className="pl-72 min-h-screen bg-background">
        <main className="p-6 max-w-6xl">
          {renderContent()}
        </main>
      </div>
    </>
  );
}

// Help & Support Component
function HelpSupport() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Help & Support</h2>
        <p className="text-sm text-muted-foreground">
          Get assistance and contact our support team
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 border border-border rounded-2xl bg-card hover:bg-accent/20 transition-colors cursor-pointer">
          <h3 className="font-semibold mb-2">📚 Documentation</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Browse our comprehensive guides and tutorials
          </p>
          <a href="#" className="text-sm text-primary hover:underline">
            View Documentation →
          </a>
        </div>

        <div className="p-6 border border-border rounded-2xl bg-card hover:bg-accent/20 transition-colors cursor-pointer">
          <h3 className="font-semibold mb-2">💬 Live Chat</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Chat with our support team in real-time
          </p>
          <a href="#" className="text-sm text-primary hover:underline">
            Start Chat →
          </a>
        </div>

        <div className="p-6 border border-border rounded-2xl bg-card hover:bg-accent/20 transition-colors cursor-pointer">
          <h3 className="font-semibold mb-2">📧 Email Support</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Send us an email and we'll respond within 24 hours
          </p>
          <a href="mailto:support@qlinic.com" className="text-sm text-primary hover:underline">
            support@qlinic.com →
          </a>
        </div>

        <div className="p-6 border border-border rounded-2xl bg-card hover:bg-accent/20 transition-colors cursor-pointer">
          <h3 className="font-semibold mb-2">📞 Phone Support</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Call us for urgent assistance (Mon-Fri, 9 AM - 6 PM IST)
          </p>
          <a href="tel:+911234567890" className="text-sm text-primary hover:underline">
            +91 123 456 7890 →
          </a>
        </div>
      </div>
    </div>
  );
}

// About Qlinic Component
function AboutQlinic() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">About Qlinic</h2>
        <p className="text-sm text-muted-foreground">
          System information and version details
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-6 border border-border rounded-2xl bg-card">
          <h3 className="font-semibold mb-4">System Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Release Date</span>
              <span className="font-medium">December 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License</span>
              <span className="font-medium">Commercial</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-medium">Web Application</span>
            </div>
          </div>
        </div>

        <div className="p-6 border border-border rounded-2xl bg-card">
          <h3 className="font-semibold mb-4">About</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Qlinic is a comprehensive healthcare management platform designed to streamline 
            hospital operations, improve patient care, and enhance doctor-patient interactions. 
            Built with modern technology to provide a seamless experience for hospitals, 
            doctors, and patients alike.
          </p>
        </div>

        <div className="p-6 border border-border rounded-2xl bg-card">
          <h3 className="font-semibold mb-4">Legal</h3>
          <div className="space-y-2">
            <a href="#" className="block text-sm text-primary hover:underline">
              Terms of Service →
            </a>
            <a href="#" className="block text-sm text-primary hover:underline">
              Privacy Policy →
            </a>
            <a href="#" className="block text-sm text-primary hover:underline">
              Cookie Policy →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
