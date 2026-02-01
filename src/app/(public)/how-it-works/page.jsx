"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, CalendarCheck, MapPin, Smartphone, 
  Stethoscope, FileText, CheckCircle2, ArrowRight,
  User, Building2, Zap 
} from 'lucide-react';

const HowItWorksPage = () => {
  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const steps = [
    {
      id: 1,
      role: "patient",
      title: "Discovery & Booking",
      desc: "Patients find the right doctor and book a slot without calling.",
      icon: Search,
      color: "bg-blue-500",
      image: "https://images.unsplash.com/photo-1516574187841-693083f69802?q=80&w=800&auto=format&fit=crop",
      features: ["Search by Specialist", "View Clinic Profile", "Instant Confirmation"]
    },
    {
      id: 2,
      role: "system",
      title: "The Smart Queue",
      desc: "Qlinic's engine optimizes the schedule and assigns a live token.",
      icon: Zap,
      color: "bg-amber-500",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
      features: ["Real-time Token #", "Wait Time Estimation", "SMS/App Alerts"]
    },
    {
      id: 3,
      role: "clinic",
      title: "Check-in & Vitals",
      desc: "Receptionist checks the patient in. Vitals are logged instantly.",
      icon: Building2,
      color: "bg-emerald-500",
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop",
      features: ["QR Code Scan", "Vitals Entry", "Queue Management"]
    },
    {
      id: 4,
      role: "doctor",
      title: "The Consultation",
      desc: "Doctor sees history, diagnoses, and prescribes digitally.",
      icon: Stethoscope,
      color: "bg-indigo-500",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop",
      features: ["Patient History View", "Digital Rx Pad", "Zero Paperwork"]
    },
    {
      id: 5,
      role: "patient",
      title: "Digital Records",
      desc: "Patient walks out with the prescription already on their phone.",
      icon: FileText,
      color: "bg-purple-500",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?q=80&w=800&auto=format&fit=crop",
      features: ["Cloud Storage", "Share with Pharmacy", "Family Accounts"]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden text-center">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-6 border-blue-200 bg-blue-50 text-blue-700 px-4 py-1.5 text-sm rounded-full">
               End-to-End Workflow
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              How Qlinic Connects <br/>
              <span className="text-blue-600">Care</span> to <span className="text-emerald-600">Cure</span>.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
              From the moment a patient books an appointment to the moment they receive their digital prescription, Qlinic powers every step.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- THE JOURNEY (Vertical Timeline) --- */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="relative">
          {/* Vertical Connecting Line (Hidden on mobile, visible on lg) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-slate-200 dark:bg-slate-800 hidden lg:block rounded-full" />

          <div className="space-y-12 lg:space-y-24">
            {steps.map((step, index) => (
              <motion.div 
                key={step.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                  index % 2 === 0 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* 1. TEXT CONTENT SIDE */}
                <div className="flex-1 w-full lg:text-right relative z-10">
                   {/* Mobile Label */}
                   <div className={`flex items-center gap-2 mb-4 lg:hidden`}>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase text-white ${step.color}`}>
                        Step {step.id}
                      </span>
                   </div>

                   {/* Desktop Alignment Logic */}
                   <div className={`flex flex-col ${index % 2 === 0 ? "lg:items-start lg:text-left" : "lg:items-end lg:text-right"}`}>
                      
                      {/* Step Number Badge (Desktop) */}
                      <div className={`hidden lg:flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg shadow-xl mb-6 ${step.color} absolute top-1/2 -translate-y-1/2 ${index % 2 === 0 ? "-right-[4.25rem]" : "-left-[4.25rem]"}`}>
                        {step.id}
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        {step.role === 'patient' && <Badge variant="secondary" className="bg-blue-100 text-blue-700"><User size={12} className="mr-1"/> Patient</Badge>}
                        {step.role === 'clinic' && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700"><Building2 size={12} className="mr-1"/> Clinic</Badge>}
                        {step.role === 'doctor' && <Badge variant="secondary" className="bg-indigo-100 text-indigo-700"><Stethoscope size={12} className="mr-1"/> Doctor</Badge>}
                        {step.role === 'system' && <Badge variant="secondary" className="bg-amber-100 text-amber-700"><Zap size={12} className="mr-1"/> Qlinic Cloud</Badge>}
                      </div>

                      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                        {step.desc}
                      </p>
                      
                      {/* Feature List */}
                      <ul className={`space-y-2 ${index % 2 === 0 ? "lg:items-start" : "lg:items-end"} flex flex-col`}>
                        {step.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                            {index % 2 !== 0 && <span>{feat}</span>}
                            <CheckCircle2 className={`w-5 h-5 ${step.color.replace('bg-', 'text-')}`} />
                            {index % 2 === 0 && <span>{feat}</span>}
                          </li>
                        ))}
                      </ul>
                   </div>
                </div>

                {/* 2. IMAGE CONTENT SIDE */}
                <div className="flex-1 w-full">
                  <div className={`relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-[4/3] group`}>
                    <div className={`absolute inset-0 opacity-20 ${step.color} mix-blend-overlay z-10`} />
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Floating Icon Card */}
                    <div className={`absolute bottom-6 ${index % 2 === 0 ? "right-6" : "left-6"} z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3`}>
                      <div className={`p-2 rounded-lg ${step.color} text-white`}>
                        <step.icon size={24} />
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {step.title}
                      </div>
                    </div>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ECOSYSTEM SUMMARY --- */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">
              One Platform. Three Interfaces.
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Patients */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors">
                 <div className="w-14 h-14 mx-auto bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-6">
                    <Smartphone className="w-7 h-7" />
                 </div>
                 <h3 className="text-xl font-bold mb-3">For Patients</h3>
                 <p className="text-slate-500 mb-6">The booking and tracking app. Simple, fast, and informative.</p>
                 <Button variant="outline" className="rounded-full w-full">Learn More</Button>
              </div>

              {/* Card 2: Clinics */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors">
                 <div className="w-14 h-14 mx-auto bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <Building2 className="w-7 h-7" />
                 </div>
                 <h3 className="text-xl font-bold mb-3">For Clinics</h3>
                 <p className="text-slate-500 mb-6">The admin dashboard for reception, queue management, and staff.</p>
                 <Button variant="outline" className="rounded-full w-full">Learn More</Button>
              </div>

               {/* Card 3: Doctors */}
               <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-colors">
                 <div className="w-14 h-14 mx-auto bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                    <Stethoscope className="w-7 h-7" />
                 </div>
                 <h3 className="text-xl font-bold mb-3">For Doctors</h3>
                 <p className="text-slate-500 mb-6">The dedicated clinical interface for history and rapid prescriptions.</p>
                 <Button variant="outline" className="rounded-full w-full">Learn More</Button>
              </div>
            </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 px-4 text-center bg-slate-50 dark:bg-slate-950">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-8">
                Experience the flow yourself.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/sign-up">
                    <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-xl">
                    Join Qlinic Network
                    </Button>
                </Link>
                <Link href="/contact-us">
                    <Button variant="ghost" size="lg" className="h-12 px-8 text-lg rounded-full text-slate-600 hover:bg-slate-200">
                    Contact Sales <ArrowRight className="ml-2 w-4 h-4"/>
                    </Button>
                </Link>
            </div>
        </div>
      </section>

    </div>
  );
};

export default HowItWorksPage;