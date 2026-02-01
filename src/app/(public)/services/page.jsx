"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Globe, Cloud, Smartphone, Monitor, 
  Zap, Lock, ArrowRight, AppWindow, 
  Download, Wifi, RefreshCw, LayoutTemplate,
  Stethoscope, Activity // Added Stethoscope and Activity
} from 'lucide-react';

const PlatformPage = () => {
  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.5, 1, 0.5],
    transition: { duration: 3, repeat: Infinity }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      
      {/* --- HERO SECTION: WEB APP FOCUS --- */}
      <section className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
        {/* Abstract Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(to right, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-8 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-4 py-1.5 text-sm rounded-full">
               <Globe className="w-3.5 h-3.5 mr-2" />
               Cloud-First Architecture
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight leading-tight">
              Powerful Web Platform. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600">
                Accessible Everywhere.
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              Run your entire clinic from a simple browser tab. No bulky software to install, no servers to maintain. Just log in and start working.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Button size="lg" className="h-14 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                  Launch Web App
               </Button>
               <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-slate-300 text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                  See Roadmap
               </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- ARCHITECTURE VISUALIZATION --- */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
            
            {/* 1. THE WEB LAYER (The Trinity) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 relative z-20">
                
                {/* A. Hospital/Admin Web Portal */}
                <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-start relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutTemplate className="w-32 h-32 text-blue-600" />
                    </div>
                    <div className="w-14 h-14 bg-blue-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                        <Monitor className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Hospital Portal</h3>
                    <p className="text-slate-500 mb-6">
                        The command center for Receptionists and Admins to manage queues, staff shifts, and billing.
                    </p>
                    <ul className="space-y-2 mt-auto">
                        <li className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <Wifi className="w-4 h-4 text-blue-500" /> Instant Updates
                        </li>
                        <li className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <Lock className="w-4 h-4 text-blue-500" /> Role-Based Access
                        </li>
                    </ul>
                </motion.div>

                {/* B. Doctor Web Portal (New Addition) */}
                <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" transition={{delay: 0.1}} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-start relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-32 h-32 text-emerald-600" />
                    </div>
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                        <Stethoscope className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Doctor Portal</h3>
                    <p className="text-slate-500 mb-6">
                         A focused, high-speed clinical interface. View patient history, diagnose, and write Rx without distractions.
                    </p>
                    <ul className="space-y-2 mt-auto">
                        <li className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <Zap className="w-4 h-4 text-emerald-500" /> Fast Data Entry
                        </li>
                        <li className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <Monitor className="w-4 h-4 text-emerald-500" /> Tablet Ready
                        </li>
                    </ul>
                </motion.div>

                {/* C. Patient PWA */}
                <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" transition={{delay: 0.2}} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-start relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AppWindow className="w-32 h-32 text-indigo-600" />
                    </div>
                    <div className="w-14 h-14 bg-indigo-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                        <Smartphone className="w-7 h-7" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Patient PWA</h3>
                        <Badge variant="outline" className="border-indigo-200 text-indigo-600 bg-indigo-50">Web App</Badge>
                    </div>
                    <p className="text-slate-500 mb-6">
                        A mobile-optimized web experience. Patients scan a QR code or click a link to access instantly.
                    </p>
                    <ul className="space-y-2 mt-auto">
                        <li className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <Zap className="w-4 h-4 text-indigo-500" /> No Download Needed
                        </li>
                        <li className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <Cloud className="w-4 h-4 text-indigo-500" /> Save Storage Space
                        </li>
                    </ul>
                </motion.div>
            </div>

            {/* 2. THE REAL-TIME SYNC ENGINE */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative bg-slate-900 rounded-3xl p-1 text-center text-white overflow-hidden shadow-2xl shadow-blue-900/20 max-w-4xl mx-auto mb-12"
            >
                <div className="relative bg-slate-950 rounded-[1.4rem] p-10 md:p-12 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-left">
                        <div className="flex items-center gap-3 mb-2">
                            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin-slow" />
                            <h3 className="text-lg font-bold text-blue-100">Live Sync Engine</h3>
                        </div>
                        <p className="text-slate-400 max-w-md text-sm">
                            Any action taken on the Web Portal reflects instantly on the Patient PWA. 
                            If a doctor marks a patient "Done", the next patient gets a notification immediately.
                        </p>
                    </div>
                    <div className="flex items-center gap-6 opacity-80">
                         <div className="text-center">
                            <div className="text-2xl font-bold text-white">&lt;100ms</div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500">Latency</div>
                         </div>
                         <div className="h-8 w-[1px] bg-slate-700"></div>
                         <div className="text-center">
                            <div className="text-2xl font-bold text-white">100%</div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500">Web Based</div>
                         </div>
                    </div>
                </div>
            </motion.div>

            {/* 3. FUTURE ROADMAP: NATIVE APP */}
            <div className="max-w-4xl mx-auto">
                <div className="relative border-l-2 border-dashed border-slate-300 dark:border-slate-700 ml-6 md:ml-0 md:border-l-0 md:border-t-2 md:mt-8 pt-8 md:pt-12">
                     <div className="absolute -top-3 left-[-5px] md:left-1/2 md:-translate-x-1/2 bg-slate-50 dark:bg-slate-950 px-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
                        Evolution Roadmap
                     </div>

                     <motion.div 
                        variants={fadeInUp} 
                        initial="hidden" 
                        whileInView="visible"
                        className="bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center gap-8 md:gap-12"
                    >
                        <div className="shrink-0 w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                            <Download className="w-10 h-10" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Native Apps</h3>
                                <Badge className="bg-blue-600 text-white hover:bg-blue-700">COMING SOON</Badge>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                We are building dedicated iOS and Android apps for doctors who prefer a native experience. 
                                Featuring biometric login, offline mode, and deeper hardware integration.
                            </p>
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

        </div>
      </section>

      {/* --- WHY WEB FIRST? --- */}
      <section className="py-20 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Why we started with the Web
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto">
                    A web-based platform offers distinct advantages for clinics just starting their digital journey.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Reason 1 */}
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Instant Onboarding</h3>
                    <p className="text-slate-500 text-sm">
                        Doctors don't have time to download setups or configure servers. With Qlinic, you just log in and you are live.
                    </p>
                </div>

                {/* Reason 2 */}
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                        <Monitor className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Device Agnostic</h3>
                    <p className="text-slate-500 text-sm">
                        Old Windows 7 PC at reception? Brand new iPad Pro? Android phone? Qlinic works perfectly on all of them.
                    </p>
                </div>

                {/* Reason 3 */}
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                        <Cloud className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Always Up to Date</h3>
                    <p className="text-slate-500 text-sm">
                        We push updates daily. You never have to click "Update" or wait for a maintenance window.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* --- BOTTOM CTA --- */}
      <section className="py-24 px-4 text-center bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Open your browser.<br/>Run your clinic.
            </h2>
            <p className="text-xl text-slate-500 mb-10">
                Join the platform that grows with you. Web today, Native apps tomorrow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="h-14 px-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-xl transition-transform hover:-translate-y-1">
                    Get Started for Free
                </Button>
            </div>
        </div>
      </section>

    </div>
  );
};

export default PlatformPage;