"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Lock,
  Zap,
  Activity,
  Search,
  Stethoscope,
  Calendar,
  Heart,
  Users,
  MapPin,
  CheckCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [testimonials, setTestimonials] = useState([]);

  useLayoutEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await fetch("/api/home/stats");
        if (!res.ok) return;

        const data = await res.json();
        if (data?.success) {
          setStats(data?.stats || null);
          setTestimonials(Array.isArray(data?.testimonials) ? data.testimonials : []);
        }
      } catch {
        // Keep UI stable with fallbacks
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const fallbackTestimonials = useMemo(
    () => [
      {
        quote: "Booking an appointment took less than a minute. Clean UI and fast flow.",
        name: "Priya Sharma",
        role: "Patient",
        location: "Delhi",
        avatar: "PS",
      },
      {
        quote: "Scheduling and patient queue feels organized. It saves time daily.",
        name: "Dr. Rajesh Kumar",
        role: "Cardiologist",
        location: "Mumbai",
        avatar: "RK",
      },
      {
        quote: "Simple, reliable, and easy to use for my whole family.",
        name: "Amit Patel",
        role: "Patient",
        location: "Bengaluru",
        avatar: "AP",
      },
    ],
    []
  );

  const shownTestimonials = testimonials.length > 0 ? testimonials.slice(0, 3) : fallbackTestimonials;

  const shownStats = useMemo(() => {
    const p = stats?.totalPatients ?? 10000;
    const d = stats?.totalDoctors ?? 250;
    const c = stats?.totalCities ?? 50;
    const s = stats?.satisfaction ?? 99;

    const patientsLabel = p >= 1000 ? `${(p / 1000).toFixed(p >= 10000 ? 0 : 1)}K+` : `${p}+`;

    return [
      { icon: Users, label: "Patients", value: patientsLabel },
      { icon: Stethoscope, label: "Doctors", value: `${d}+` },
      { icon: MapPin, label: "Cities", value: `${c}+` },
      { icon: Heart, label: "Satisfaction", value: `${s}%` },
    ];
  }, [stats]);

  if (!hydrated) {
    return <div className="min-h-screen bg-white dark:bg-gray-950" />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* HERO - Full Screen */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated Background blobs */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1], 
              rotate: [0, 90, 0],
              x: [0, 40, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 sm:top-20 -left-32 sm:-left-56 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.25, 1], 
              rotate: [0, -90, 0],
              x: [0, -40, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 sm:bottom-12 -right-32 sm:-right-56 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-r from-cyan-400 to-violet-400 rounded-full blur-3xl"
          />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-100/80 dark:bg-blue-900/30 rounded-full mb-5">
                <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                <span className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-200">
                  QLINIC • Smarter healthcare booking
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-tight">
                Book care faster.
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  Stay in control.
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-xl text-slate-600 dark:text-gray-300 leading-relaxed max-w-xl">
                QLINIC helps patients find verified doctors, book appointments quickly, and manage care with a simple,
                modern experience.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={() => router.push("/sign-up")}
                  className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-7 py-6 text-base sm:text-lg shadow-lg"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/aboutus")}
                  className="rounded-2xl px-7 py-6 text-base sm:text-lg border-2 border-blue-600 text-blue-700 dark:text-blue-300 dark:border-blue-500"
                >
                  Learn More
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Badge className="bg-white/90 dark:bg-gray-900/60 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 px-3 py-2">
                  <Shield className="w-4 h-4 mr-2" />
                  Secure by design
                </Badge>
                <Badge className="bg-white/90 dark:bg-gray-900/60 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 px-3 py-2">
                  <Zap className="w-4 h-4 mr-2" />
                  Fast booking flow
                </Badge>
                <Badge className="bg-white/90 dark:bg-gray-900/60 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 px-3 py-2">
                  <Lock className="w-4 h-4 mr-2" />
                  Privacy-first
                </Badge>
              </div>
            </motion.div>

           {/* Right: Robot with UPPER HAND extending outside */}
{/* Right: Robot - Clean layered approach */}
{/* Right: Robot - Clean layered approach */}
<div className="order-1 lg:order-2 relative flex justify-center items-center min-h-[350px] sm:min-h-[450px] lg:min-h-[500px]">
  {/* Pulsing background ring */}
  <motion.div
    animate={{ 
      scale: [1, 1.15, 1],
      opacity: [0.4, 0.2, 0.4]
    }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className="absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] lg:w-[450px] lg:h-[450px] rounded-full bg-gradient-to-br from-blue-400/40 via-cyan-400/40 to-violet-400/40 blur-2xl"
  />

  {/* Main Robot Container */}
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
    className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] lg:w-[400px] lg:h-[400px]"
  >
    {/* LAYER 1: Rotating gradient border (bottom) */}
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 rounded-full p-[6px] sm:p-[8px] z-0"
      style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #8b5cf6 100%)',
        boxShadow: '0 20px 60px rgba(37, 99, 235, 0.4)'
      }}
    />
    
    {/* LAYER 2: Static white ring background */}
    <div className="absolute inset-[6px] sm:inset-[8px] rounded-full bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm z-10">
      {/* Inner padding for border */}
      <div className="absolute inset-[6px] sm:inset-[8px] rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 z-10" />
    </div>
 
{/* LAYER 3: Robot video (bigger + controlled bottom cut) */}
<div className="absolute inset-0 z-20 overflow-visible">
  {/* Bottom cut mask (clips ONLY the bottom part) */}
  <div className="absolute inset-0 overflow-hidden rounded-full">
    <video
      src="/robot.webm"
      autoPlay
      loop
      muted
      playsInline
      className="absolute"
      style={{
        // width: "165%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center 42%",     // a bit higher focus than before
        transform: "translateX(4%) translateY(10%)", // push slightly right + down
        filter: "drop-shadow(0 8px 20px rgba(37, 99, 235, 0.22))",
      }}
      aria-label="Friendly AI doctor assistant mascot for QLINIC"
    />
  </div>

  {/* Hand pass-through (top overlay area is NOT clipped by circle) */}
  <div className="absolute inset-0 pointer-events-none">
    <video
      src="/robot.webm"
      autoPlay
      loop
      muted
      playsInline
      className="absolute"
      style={{
        // width: "165%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center 42%",
        transform: "translateX(4%) translateY(10%)",
        // show only the left-top hand area so it can appear outside cleanly
        clipPath: "polygon(0% 0%, 52% 0%, 52% 55%, 0% 55%)",
        filter: "drop-shadow(0 10px 25px rgba(37, 99, 235, 0.28))",
      }}
      aria-hidden="true"
    />
  </div>
</div>

{/* LAYER 4: Circular border mask on top (crisp edge) */}
<div className="absolute inset-[12px] sm:inset-[16px] rounded-full border-4 border-white dark:border-white/20 shadow-2xl z-15 pointer-events-none" />


    {/* AI Assistant Badge */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 z-40"
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        className="px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-white dark:bg-gray-900 border-2 border-blue-500 dark:border-blue-400 shadow-xl"
      >
        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-gray-100">AI Assistant</span>
      </motion.div>
    </motion.div>

    {/* Floating stat card - Right (24/7) */}
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        y: [0, -10, 0]
      }}
      transition={{ 
        opacity: { delay: 1.3, duration: 0.8 },
        x: { delay: 1.3, duration: 0.8 },
        y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }}
      whileHover={{ scale: 1.08 }}
      className="hidden sm:block absolute -right-2 lg:-right-6 top-16 lg:top-20 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl p-2.5 sm:p-4 border-2 border-blue-100 dark:border-blue-900/50 z-40"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-gray-400 font-medium">Available</p>
          <p className="text-base sm:text-xl font-black text-slate-900 dark:text-white">24/7</p>
        </div>
      </div>
    </motion.div>

    {/* Floating stat card - Left (Secure) */}
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        y: [0, -12, 0]
      }}
      transition={{ 
        opacity: { delay: 1.5, duration: 0.8 },
        x: { delay: 1.5, duration: 0.8 },
        y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
      }}
      whileHover={{ scale: 1.08 }}
      className="hidden sm:block absolute -left-2 lg:-left-6 bottom-20 lg:bottom-24 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl p-2.5 sm:p-4 border-2 border-emerald-100 dark:border-emerald-900/50 z-40"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-gray-400 font-medium">Secure</p>
          <p className="text-base sm:text-xl font-black text-slate-900 dark:text-white">100%</p>
        </div>
      </div>
    </motion.div>

    {/* Floating particles */}
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        animate={{
          y: [0, -25, 0],
          x: [0, Math.random() * 15 - 7.5, 0],
          opacity: [0.2, 0.6, 0.2],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{
          duration: 2.5 + i * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.4
        }}
        className="hidden lg:block absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-400/60 z-35"
        style={{
          top: `${15 + i * 12}%`,
          left: `${8 + i * 18}%`
        }}
      />
    ))}
  </motion.div>
</div>






          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
              What do you want to do?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-gray-300">
              Jump straight to the most common actions on QLINIC.
            </p>
          </motion.div>

          <div className="mt-6 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[
              { icon: "🩺", title: "Find Doctors", subtitle: "Verified specialists", href: "/user/doctors" },
              { icon: "🏥", title: "Hospitals", subtitle: "Trusted centers", href: "/user/hospitals" },
              { icon: "💊", title: "Medicines", subtitle: "Order online", href: "/user/medicines" },
              { icon: "🧪", title: "Lab Tests", subtitle: "Book from home", href: "/user/lab-tests" },
            ].map((x, idx) => (
              <motion.button
                key={x.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(x.href)}
                className="text-left p-4 sm:p-6 lg:p-7 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-shadow"
              >
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4"
                >
                  {x.icon}
                </motion.div>
                <div className="font-bold text-sm sm:text-base lg:text-lg text-slate-900 dark:text-white">{x.title}</div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 mt-1">{x.subtitle}</div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200 dark:bg-gray-800 w-full max-w-7xl mx-auto" />

      {/* HOW IT WORKS */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2 sm:gap-3">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
              How QLINIC works
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300">
              Simple steps designed for speed and clarity.
            </p>
          </motion.div>

          <div className="mt-8 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                icon: Search,
                title: "Search",
                desc: "Find doctors and hospitals quickly with verified profiles.",
                bg: "from-blue-500 to-cyan-500",
              },
              {
                icon: Stethoscope,
                title: "Choose",
                desc: "Compare experience, ratings, and availability confidently.",
                bg: "from-violet-500 to-indigo-500",
              },
              {
                icon: Calendar,
                title: "Book",
                desc: "Pick a slot and confirm your appointment in seconds.",
                bg: "from-emerald-500 to-teal-500",
              },
            ].map((s, idx) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.6 }}
                whileHover={{ y: -10 }}
              >
                <Card className="border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-shadow bg-white dark:bg-gray-900 h-full">
                  <CardContent className="p-5 sm:p-6 lg:p-7">
                    <motion.div 
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${s.bg} flex items-center justify-center`}
                    >
                      <s.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                    </motion.div>
                    <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{s.title}</h3>
                    <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200 dark:bg-gray-800 w-full max-w-7xl mx-auto" />

      {/* TESTIMONIALS + STATS */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2 sm:gap-3">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
              Trusted by users
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300">
              Real feedback from patients and doctors.
            </p>
          </motion.div>

          <div className="mt-8 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {shownTestimonials.map((t, idx) => (
              <motion.div
                key={`${t.name}-${t.location}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-shadow h-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0"
                      >
                        {t.avatar}
                      </motion.div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">{t.name}</div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 truncate">
                          {t.role} • {t.location}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-200 italic leading-relaxed">"{t.quote}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-10 sm:mt-14 bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-200 dark:border-gray-800 shadow-lg"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
              {shownStats.map((s, idx) => (
                <motion.div 
                  key={s.label} 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + (idx * 0.1), duration: 0.5 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="flex flex-col items-center"
                >
                  <s.icon className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-blue-600 dark:text-blue-400 mb-2 sm:mb-3" />
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white">
                    {loading ? "…" : s.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium mt-1 sm:mt-2">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 sm:mt-10 flex flex-wrap justify-center gap-2 sm:gap-3">
              {[
                { icon: Shield, text: "Secure platform" },
                { icon: Lock, text: "Privacy-first" },
                { icon: Zap, text: "Fast booking" },
                { icon: CheckCircle, text: "Verified listings" },
              ].map((b, idx) => (
                <motion.div
                  key={b.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 + (idx * 0.1), duration: 0.4 }}
                  whileHover={{ scale: 1.1 }}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-gray-950 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm"
                >
                  <b.icon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">{b.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <motion.div
            animate={{ 
              scale: [1, 1.5, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white"
            >
              Ready to try QLINIC?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-3 sm:mt-5 text-sm sm:text-lg lg:text-xl text-white/90"
            >
              Create your account and start booking appointments with confidence.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-6 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => router.push("/sign-up")}
                  className="w-full sm:w-auto px-8 sm:px-10 py-5 sm:py-6 rounded-2xl bg-white text-blue-700 hover:bg-white/95 font-black text-base sm:text-lg shadow-2xl"
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={() => router.push("/user/doctors")}
                  className="w-full sm:w-auto px-8 sm:px-10 py-5 sm:py-6 rounded-2xl border-2 border-white/80 text-white hover:bg-white/10 font-bold text-base sm:text-lg"
                >
                  Browse Doctors
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
