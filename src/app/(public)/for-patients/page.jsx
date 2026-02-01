"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { 
  Check, Heart, Calendar, Clock, FolderPlus, 
  Bell, Pill, FileSearch, Smartphone, MapPin, 
  ArrowRight, Search, Zap, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ForPatientsPage = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-10">
        {/* Modern Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-400/20 blur-[120px]" />
            <div className="absolute top-[20%] -right-[10%] w-[50%] h-[60%] rounded-full bg-indigo-400/20 blur-[120px]" />
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="secondary" className="mb-8 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-4 py-1.5 text-sm rounded-full backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 mr-2 fill-blue-500 text-blue-500" />
              The Modern Way to See a Doctor
            </Badge>
            
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-slate-900 dark:text-white mb-8 leading-[0.9]">
              Book Fast. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Wait Less.
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
              Skip the crowded waiting room. Track your live position in the queue from your phone and arrive just in time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Button size="lg" className="h-14 px-10 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-600/30 transition-all hover:scale-105 border border-blue-500/50">
                Find a Doctor
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-10 text-lg border-slate-200 bg-white/50 backdrop-blur-sm text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 rounded-full">
                Download App <Smartphone className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- BENTO GRID LAYOUT --- */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 w-full max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 px-2">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Your Health Command Center
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Everything you need to manage your clinic visits.
              </p>
            </div>
        </div>

        {/* THE GRID */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(320px,auto)]"
        >
          
          {/* 1. FIND DOCTORS (Wide Card) */}
          <motion.div variants={itemVariants} className="md:col-span-7 group relative bg-white dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 dark:hover:shadow-blue-900/20 transition-all duration-500 overflow-hidden flex flex-col">
            <div className="p-8 relative z-10 flex-1">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600">
                    <Search className="w-5 h-5" />
                 </div>
                 <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">Discovery</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Find Care Nearby</h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 max-w-sm">
                Search specialists, view clinic profiles, and check consultation fees before you book.
              </p>
              
              <div className="flex flex-wrap gap-2">
                 {['Cardiologist', 'Dentist', 'Pediatrician', 'Dermatologist'].map(tag => (
                     <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-sm border border-slate-200 dark:border-slate-700">
                        {tag}
                     </span>
                 ))}
              </div>
            </div>
            
            {/* Visual: Simulated Map Interface */}
            <div className="relative h-56 w-full mt-auto bg-slate-100 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
                {/* TODO: Replace with Real Map/Search Screenshot */}
                <Image 
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200&auto=format&fit=crop" 
                  alt="Doctor Search Map" 
                  fill 
                  className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent dark:from-slate-900/50" />
            </div>
          </motion.div>

          {/* 2. LIVE QUEUE (Vertical "Phone" Card) */}
          <motion.div variants={itemVariants} className="md:col-span-5 md:row-span-2 group relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] shadow-2xl shadow-blue-900/30 overflow-hidden flex flex-col text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="p-10 relative z-10 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-bold tracking-wide">LIVE TRACKING</span>
                </div>
                <Clock className="w-6 h-6 text-blue-100" />
              </div>
              
              <h3 className="text-4xl font-bold mb-4">No More Waiting.</h3>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                Watch the queue move in real-time from your home. We'll tell you exactly when to leave.
              </p>

              {/* Simulated Phone Screen UI */}
              <div className="mt-auto relative mx-auto w-full max-w-[280px] h-[380px] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl transform translate-y-8 group-hover:translate-y-4 transition-transform duration-500 overflow-hidden">
                {/* App Header */}
                <div className="bg-blue-50 dark:bg-slate-800 p-4 flex items-center justify-between border-b border-blue-100 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-400">QLINIC APP</div>
                    <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
                </div>
                {/* App Body */}
                <div className="p-6 flex flex-col items-center justify-center h-full pb-20">
                    <p className="text-slate-500 text-sm mb-2 font-medium">Current Token</p>
                    <div className="text-6xl font-black text-blue-600 mb-6">24</div>
                    
                    <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-1 bg-blue-500"></div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Your Turn</span>
                            <span className="text-sm font-bold text-blue-600">#29</span>
                        </div>
                        <p className="text-xs text-slate-400">Approx wait: 15 mins</p>
                    </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. BOOK APPOINTMENTS (Standard Card) */}
          <motion.div variants={itemVariants} className="md:col-span-4 group relative bg-white dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 hover:border-blue-300 transition-all hover:shadow-lg">
             <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                <Calendar className="w-6 h-6" />
              </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Instant Booking</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">Select a date, pick a slot, and get instant confirmation via WhatsApp & App.</p>
            
            {/* Abstract Calendar Visual */}
            <div className="flex gap-2 mt-auto">
                {[1,2,3].map(d => (
                    <div key={d} className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center border border-slate-100 dark:border-slate-700">
                        <div className="text-xs text-slate-400 mb-1">MON</div>
                        <div className={`font-bold ${d===2 ? 'text-blue-600' : 'text-slate-700 dark:text-white'}`}>{10+d}</div>
                    </div>
                ))}
            </div>
          </motion.div>

           {/* 4. DOCUMENTS (Standard Card) */}
           <motion.div variants={itemVariants} className="md:col-span-3 group relative bg-white dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 hover:border-sky-300 transition-all hover:shadow-lg">
             <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mb-6 text-sky-600">
                <FolderPlus className="w-6 h-6" />
              </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Digital Records</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">Never lose a prescription again. Upload and organize securely.</p>
            <div className="mt-auto">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="bg-red-100 p-1.5 rounded text-red-500"><FileSearch size={14}/></div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">Blood_Report.pdf</div>
                </div>
            </div>
          </motion.div>

        </motion.div>
      </section>

      {/* --- ROADMAP SECTION --- */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <Badge variant="outline" className="mb-4 border-blue-200 bg-blue-50 text-blue-700 px-3 py-1">Coming Soon</Badge>
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Building for Tomorrow</h2>
                <p className="text-slate-500 max-w-2xl mx-auto">We are constantly adding features to give you more control over your health.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-blue-600">
                        <Bell className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Smart Queue Alerts</h3>
                    <p className="text-slate-500 text-sm">"You are 5th in line." Get notified automatically so you never have to guess.</p>
                </div>

                {/* Feature 2 */}
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-blue-600">
                        <Pill className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Medicine Reminders</h3>
                    <p className="text-slate-500 text-sm">We'll parse your digital prescription and remind you when to take your meds.</p>
                </div>

                {/* Feature 3 */}
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-blue-600">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Family Health Accounts</h3>
                    <p className="text-slate-500 text-sm">Manage appointments for your parents, children, and spouse from one app.</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-32 px-4 text-center bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl sm:text-7xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">
                Ready to visit the clinic?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 shadow-xl transition-transform hover:-translate-y-1">
                    Book an Appointment
                </Button>
            </div>
        </div>
      </section>
    </div>
  );
};

export default ForPatientsPage;