"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Users,
  Target,
  Heart,
  Shield,
  Zap,
  Clock,
  Lightbulb,
  Globe,
  CheckCircle2,
  Stethoscope,
  MapPin,
  Rocket,
  ArrowRight,
  Quote,
  Code,
  Github,
  Linkedin,
  Twitter,
  Database,
  Cloud,
  Lock,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// --- Helper for Tech Logos (Replace with real SVGs/Images if you have them) ---
const TechLogo = ({ name, color }) => {
  // You can replace these switch cases with <Image src="..." />
  // For now, I'll use high-quality Lucide icons or text representations that look like logos
  switch (name) {
    case "Next.js 15":
      return (
        <svg
          viewBox="0 0 180 180"
          fill="none"
          className="w-12 h-12 text-slate-900 dark:text-white"
        >
          <mask
            id="mask0"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="180"
            height="180"
          >
            <circle cx="90" cy="90" r="90" fill="black" />
          </mask>
          <g mask="url(#mask0)">
            <circle cx="90" cy="90" r="90" fill="currentColor" />
            <path
              d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z"
              fill="url(#paint0_linear)"
            />
            <rect
              x="115"
              y="54"
              width="12"
              height="72"
              fill="url(#paint1_linear)"
            />
          </g>
          <defs>
            <linearGradient
              id="paint0_linear"
              x1="109"
              y1="116.5"
              x2="144.5"
              y2="160.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint1_linear"
              x1="121"
              y1="54"
              x2="120.799"
              y2="106.875"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "MongoDB":
      return <Database className="w-10 h-10 text-green-500" />; // Replace with real SVG
    case "Firebase":
      return <Zap className="w-10 h-10 text-yellow-500" />; // Replace with real SVG
    case "Vercel":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-10 h-10 text-slate-900 dark:text-white"
        >
          <path d="M12 1L24 22H0L12 1Z" />
        </svg>
      );
    case "Cloudinary":
      return <Cloud className="w-10 h-10 text-blue-500" />; // Replace with real SVG
    case "NextAuth":
      return <Lock className="w-10 h-10 text-purple-500" />; // Replace with real SVG
    default:
      return <Code className="w-10 h-10 text-gray-500" />;
  }
};

const AboutUsPage = () => {
  const stats = [
    {
      icon: Stethoscope,
      value: "10+",
      label: "Hospital LOIs",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Users,
      value: "MVP",
      label: "Development Stage",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: MapPin,
      value: "India",
      label: "Based in Patna",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: Rocket,
      value: "2025",
      label: "Founded",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  const values = [
    {
      icon: Heart,
      title: "Patient First",
      description:
        "Every feature we build focuses on making healthcare simpler and more accessible for patients.",
      gradient: "from-red-500 to-pink-500",
    },
    {
      icon: Shield,
      title: "Trust & Security",
      description:
        "Building a platform where patient data is encrypted, secure, and handled with utmost care.",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: Zap,
      title: "Speed & Simplicity",
      description:
        "No complicated forms. Book appointments in seconds with an intuitive, modern interface.",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: Code,
      title: "Tech Innovation",
      description:
        "Leveraging Next.js, MongoDB, and modern cloud infrastructure for a seamless experience.",
      gradient: "from-purple-500 to-violet-500",
    },
  ];

  const timeline = [
    {
      year: "Nov 2025",
      title: "Vision Born",
      description:
        "Identified the gap in healthcare appointment systems and envisioned QClinic as the solution.",
      icon: Lightbulb,
    },
    {
      year: "Dec 2025",
      title: "Development Begins",
      description:
        "Started building the MVP with Next.js, MongoDB, and Firebase. Core features taking shape.",
      icon: Code,
    },
    {
      year: "Dec 2025",
      title: "Team Formation",
      description:
        "Assembled a passionate team of developers and healthcare enthusiasts to bring QClinic to life.",
      icon: Users,
    },
    {
      year: "Jan 2026",
      title: "Hospital Interest",
      description:
        "Received Letters of Intent (LOI) from 10+ hospitals and doctors ready to adopt the platform.",
      icon: Stethoscope,
    },
    {
      year: "Present",
      title: "MVP Phase",
      description:
        "Currently in MVP stage, refining features based on early feedback and preparing for launch.",
      icon: Rocket,
    },
    {
      year: "Future",
      title: "Scale Nationwide",
      description:
        "Goal to onboard 100+ hospitals, integrate AI diagnostics, and expand across Indian cities.",
      icon: Globe,
    },
  ];

  // Tech stack with color hints for the marquee
  const techStack = [
    { name: "Next.js 15", icon: <TechLogo name="Next.js 15" /> },
    { name: "MongoDB", icon: <TechLogo name="MongoDB" /> },
    { name: "Firebase", icon: <TechLogo name="Firebase" /> },
    { name: "Vercel", icon: <TechLogo name="Vercel" /> },
    { name: "Cloudinary", icon: <TechLogo name="Cloudinary" /> },
    { name: "NextAuth", icon: <TechLogo name="NextAuth" /> },
  ];

  const team = [
    {
      name: "Team Member 1",
      role: "Founder & Full-Stack Developer",
      bio: "Building QClinic from ground up",
      image: "/team/member1.jpg",
      gradient: "from-blue-500 to-cyan-500",
      socials: { github: "#", linkedin: "#", twitter: "#" },
    },
    {
      name: "Team Member 2",
      role: "Co-Founder & Tech Lead",
      bio: "Healthcare technology enthusiast",
      image: "/team/member2.jpg",
      gradient: "from-violet-500 to-purple-500",
      socials: { github: "#", linkedin: "#", twitter: "#" },
    },
    // ... add more members
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* ---------------- HERO SECTION ---------------- */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl dark:opacity-20"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute -bottom-40 -left-40 w-[700px] h-[700px] bg-gradient-to-br from-violet-400 to-purple-400 rounded-full blur-3xl dark:opacity-20"
          />

          {/* Floating Dots */}
          <motion.div
            animate={{ y: [0, -30, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-500 rounded-full opacity-60"
          />
          <motion.div
            animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute top-1/3 right-1/3 w-3 h-3 bg-violet-500 rounded-full opacity-60"
          />
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-cyan-500 rounded-full opacity-60"
          />

          {/* Dark Overlay for Readability (adjust for light mode if needed) */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white/80 dark:from-slate-950/70 dark:via-slate-950/55 dark:to-slate-950/70" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Heading */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:pt-8 lg:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight"
            >
              Healthcare, made{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 dark:from-blue-400 dark:via-violet-400 dark:to-purple-400">
                simpler to access
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-white/75 mb-8 leading-relaxed max-w-3xl mx-auto"
            >
              Qlinic is an MVP-stage platform built to streamline appointments and day-to-day workflows for patients, doctors, and hospitals—so
              care happens faster, with less confusion.
            </motion.p>

            {/* Trust Line */}
            <motion.p
              variants={fadeInUp}
              className="text-xs sm:text-sm text-slate-500 dark:text-white/55 mb-10 max-w-3xl mx-auto font-medium"
            >
              Early traction: LOIs from 10+ hospitals/doctors • Built since
              Nov–Dec 2025
            </motion.p>

            {/* Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={() => (window.location.href = "/sign-up")}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-9 py-6 text-base sm:text-lg font-bold shadow-xl shadow-blue-500/20"
                >
                  Join the Waitlist
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => (window.location.href = "/contact-us")}
                  className="rounded-2xl px-9 py-6 text-base sm:text-lg font-bold border-2 border-slate-200 dark:border-white/25 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10"
                >
                  Contact Us
                </Button>
              </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div variants={fadeInUp} className="mt-16">
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-flex flex-col items-center gap-2 text-slate-400 dark:text-white/50"
              >
                <span className="text-xs sm:text-sm font-medium">
                  Scroll to explore
                </span>
                <div className="w-6 h-10 border-2 border-slate-300 dark:border-white/30 rounded-full flex items-start justify-center p-2">
                  <motion.div
                    animate={{ y: [0, 12, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 bg-slate-500 dark:bg-white/70 rounded-full"
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- STATS SECTION ---------------- */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.05 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="text-4xl sm:text-5xl font-black text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-blue-100 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- TECH STACK (SEAMLESS LOOP) ---------------- */}
      <section className="py-14 sm:py-20 relative overflow-hidden bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
              <Code className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Tech Stack
              </span>
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              What we build with
            </h2>
          </motion.div>

          <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden">
            {/* Fade Edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent z-10" />

            {/* Seamless Marquee Track */}
            <motion.div
              className="flex items-center gap-12 py-10 will-change-transform"
              // RIGHT -> LEFT Loop
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            >
              {/* Duplicate list for seamless loop */}
              {[...techStack, ...techStack].map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className="shrink-0 w-24 sm:w-28 md:w-32 flex flex-col items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                  title={t.name}
                >
                  {/* Logo */}
                  <div className="text-4xl sm:text-5xl select-none">
                    {t.icon}
                  </div>
                  {/* Optional Name */}
                  {/* <span className="text-xs font-semibold">{t.name}</span> */}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------- MISSION & VISION ---------------- */}
      <section className="py-16 sm:py-24 bg-white dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                  Our Mission
                </h2>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                To eliminate the chaos of healthcare appointments by building a
                simple, fast, and reliable platform that connects patients with
                doctors instantly.
              </p>
              <div className="space-y-3">
                {[
                  "Multi-role platform: Patient, Doctor, Hospital, Admin",
                  "Real-time appointment queue management",
                  "Seamless booking in under 60 seconds",
                  "Secure data with NextAuth and MongoDB",
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />
              <Card className="relative border-2 border-slate-200 dark:border-violet-900 bg-white dark:bg-gray-900 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                      Our Vision
                    </h2>
                  </div>
                  <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    To become the go-to healthcare platform in India, serving
                    100+ hospitals with AI-powered diagnostics, telemedicine,
                    and comprehensive health management.
                  </p>

                  {/* Smaller Quote Block */}
                  <div className="mt-6 rounded-2xl border border-violet-100 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <Quote className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 italic">
                          "Good healthcare starts with clarity—right doctor,
                          right time, and a queue that actually moves."
                        </p>
                        <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                          — QClinic (MVP)
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vertical Timeline - Smaller & Cleaner */}
      {/* Center Line Timeline - Alternating Left/Right */}
      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">
              Our Journey
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400">
              From concept to MVP in 3 months
            </p>
          </motion.div>

          <div className="relative">
            {/* Center Vertical Line */}
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2" />

            <div className="space-y-12">
              {timeline.map((item, idx) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative flex flex-col sm:flex-row gap-8 ${
                    idx % 2 === 0 ? "sm:flex-row-reverse" : ""
                  }`}
                >
                  {/* Content Side (Alternates) */}
                  <div className="flex-1 sm:text-right">
                    <div
                      className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow ${
                        idx % 2 === 0 ? "sm:text-right" : "sm:text-left"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-3 mb-2 ${
                          idx % 2 === 0 ? "sm:justify-end" : "sm:justify-start"
                        }`}
                      >
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                          {item.year}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Center Dot */}
                  <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 border-4 border-white dark:border-slate-950 z-10 mt-6 sm:mt-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  </div>

                  {/* Empty Spacer Side (for layout balance) */}
                  <div className="hidden sm:block flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- TEAM SECTION (Placeholder) ---------------- */}
      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Meet the Team
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Passionate individuals building the future of healthcare
            </p>
          </motion.div>

          {/* Add your team mapping here as before */}
          <div className="text-center text-slate-500 italic">
            [Team Section Content]
          </div>
        </div>
      </section>

      {/* ---------------- CTA SECTION ---------------- */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_60%)]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6">
              Join the Revolution
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-10">
              We're in MVP phase and onboarding early adopters. Be part of
              transforming healthcare.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={() => (window.location.href = "/sign-up")}
                  className="px-10 py-7 rounded-2xl bg-white text-blue-700 hover:bg-white/95 font-black text-lg shadow-2xl"
                >
                  Join Waitlist
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => (window.location.href = "/contact-us")}
                  className="px-10 py-7 rounded-2xl border-2 border-white/80 text-white hover:bg-white/10 font-bold text-lg backdrop-blur-sm"
                >
                  Contact Us
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
