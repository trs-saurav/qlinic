"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Check, Users, Monitor, Smartphone, FileText, Clock, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const WhyQlinicPage = () => {
  const availableFeatures = [
    {
      title: "Live Queue Tracking",
      subtitle: "Patients don't need guesses, They need clarity.",
      badge: "Available Now",
      badgeColor: "bg-emerald-500",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?q=80&w=800&auto=format&fit=crop",
      icon: Clock,
      items: [
        "Unified clinic queue",
        "Real-time token movement",
        "Patients know when their turn is",
        "Fewer interruptions at reception"
      ]
    },
    {
      title: "Simple Web-Based Setup",
      badge: "Available Now",
      badgeColor: "bg-emerald-500",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
      icon: Monitor,
      items: [
        "Runs directly in the browser",
        "No heavy installation",
        "Easy for reception and doctors"
      ]
    }
  ];

  const comingSoonFeatures = [
    {
      title: "Smart Queue Automation",
      badge: "Coming Soon",
      badgeColor: "bg-teal-400",
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop",
      icon: BarChart3,
      items: [
        "Intelligent wait-time estimation",
        "Priority handling when needed",
        "Smarter flow, less manual effort"
      ]
    },
    {
      title: "Patient Mobile Experience",
      badge: "Coming Soon",
      badgeColor: "bg-teal-400",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop",
      icon: Smartphone,
      items: [
        "Queue updates on phone",
        "Visit history access",
        "Medication reminders"
      ]
    },
    {
      title: "Structured Digital Records",
      badge: "Coming Soon",
      badgeColor: "bg-teal-400",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
      icon: FileText,
      items: [
        "Cleaner prescriptions",
        "Searchable patient history",
        "Better continuity of care"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Main Hero Section */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-r from-blue-400 to-blue-400 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              Why Qlinic?
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6 sm:mb-8">
              Clear OPDs. Calm Patients. Focused Doctors.
            </p>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Qlinic helps clinics reduce daily OPD chaos, by giving patients visibility and clinics control. Built for how OPDs actually run.
            </p>
          </motion.div>

          {/* Clinic Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-blue-200/50 dark:border-blue-800/50 aspect-video bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
              <Image
                src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=1200&auto=format&fit=crop"
                alt="Modern clinic waiting area with patients and doctors"
                fill
                className="object-cover opacity-90"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border-2 border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">Token #12</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Next in Queue</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Available Now Features */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {availableFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="h-full border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-xl bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl overflow-hidden">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white pr-2">
                        {feature.title}
                      </h2>
                      <Badge 
                        className={`${feature.badgeColor} text-white border-0 text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap`}
                      >
                        {feature.badge}
                      </Badge>
                    </div>
                    {feature.subtitle && (
                      <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 font-medium">
                        {feature.subtitle}
                      </p>
                    )}
                    <ul className="space-y-3 mb-6">
                      {feature.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {/* Feature Image */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 group">
                        <Image
                          src={feature.image}
                          alt={feature.title}
                          fill
                          className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
                          <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mid-Section Divider */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Designed for Growing Clinics
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              Qlinic focuses on reducing friction today, while building towards deeper capabilities tomorrow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What's Coming Next Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
              What's Coming Next
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {comingSoonFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="h-full border-2 border-gray-200 dark:border-gray-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all shadow-xl bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl overflow-hidden">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white pr-2">
                        {feature.title}
                      </h3>
                      <Badge 
                        className={`${feature.badgeColor} text-white border-0 text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap`}
                      >
                        {feature.badge}
                      </Badge>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {feature.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {/* Feature Image */}
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-teal-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 group">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
                        <feature.icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Section Divider */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Designed for Growing Clinics
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              Qlinic focuses on reducing friction today, while building towards deeper capabilities tomorrow.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default WhyQlinicPage;
