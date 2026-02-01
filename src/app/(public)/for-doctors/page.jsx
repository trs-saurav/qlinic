"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, Stethoscope, ClipboardCheck, Brain, 
  History, Mic, Zap, ChevronRight, Tablets, 
  Laptop, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ForDoctorsPage = () => {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-10">
        {/* Abstract Clinical Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-100/50 dark:bg-indigo-900/10 blur-[100px]" />
            <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-[100px]" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="outline" className="mb-8 border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 px-4 py-1.5 text-sm rounded-full backdrop-blur-md">
              <Stethoscope className="w-3.5 h-3.5 mr-2" />
              Dedicated Clinician Interface
            </Badge>
            
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8">
              Zero Admin. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                100% Clinical Focus.
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
              A streamlined, distraction-free app designed for the doctor's desk. See your patient, write the Rx, and move to the next.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Button size="lg" className="h-14 px-10 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl shadow-indigo-600/20 transition-all hover:scale-105">
                View Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- BENTO GRID: THE DOCTOR'S WORKSPACE --- */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 w-full max-w-[1600px] mx-auto">
        <div className="flex items-end justify-between mb-12 px-2">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                The Physician's Console
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Tools built for speed and accuracy.
              </p>
            </div>
        </div>

        {/* GRID */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(300px,auto)]"
        >
          
          {/* 1. THE ACTIVE PATIENT DASHBOARD (Wide - Spans 8 cols) */}
          <motion.div variants={itemVariants} className="md:col-span-8 group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-500 overflow-hidden flex flex-col">
            <div className="p-8 relative z-10">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Active Patient View</h3>
                        <p className="text-slate-500 text-sm">Everything on one screen.</p>
                    </div>
                 </div>
                 <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">OPD ACTIVE</Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                        <div className="mt-1 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-indigo-600">1</span>
                        </div>
                        <span><strong>Current Patient</strong> details visible instantly upon entry.</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                        <div className="mt-1 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-indigo-600">2</span>
                        </div>
                        <span><strong>Vitals History</strong> (BP, Weight, Pulse) trend lines.</span>
                    </li>
                  </ul>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                        <div className="mt-1 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-indigo-600">3</span>
                        </div>
                        <span><strong>One-Click Actions:</strong> Repeat Last Rx, Admit, or Refer.</span>
                    </li>
                  </ul>
              </div>
            </div>
            
            {/* Visual: Simulated Dashboard Interface */}
            <div className="relative h-64 w-full mt-auto bg-slate-100 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
                {/* TODO: Replace with Real Doctor App Screenshot */}
                <Image 
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop" 
                  alt="Doctor Active Dashboard" 
                  fill 
                  className="object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-700" 
                />
            </div>
          </motion.div>

          {/* 2. DIGITAL RX (Vertical - Spans 4 cols) */}
          <motion.div variants={itemVariants} className="md:col-span-4 group relative bg-indigo-600 dark:bg-indigo-700 rounded-[2rem] shadow-xl overflow-hidden flex flex-col text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="p-8 relative z-10 flex-1 flex flex-col">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-3xl font-bold mb-3">Lightning Rx</h3>
              <p className="text-indigo-100 text-lg mb-6">
                Generate a prescription in under 30 seconds.
              </p>

              <div className="space-y-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                    <div className="text-xs font-bold text-indigo-200 uppercase mb-1">Templates</div>
                    <p className="text-sm">"Viral Fever", "Typhoid", "General Pain" - load presets in one tap.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                    <div className="text-xs font-bold text-indigo-200 uppercase mb-1">AI Assist</div>
                    <p className="text-sm">Frequency and dosage auto-suggestions.</p>
                </div>
              </div>

              {/* Simulated Mobile/Tab View */}
              <div className="mt-auto relative w-full h-48 bg-white dark:bg-slate-900 rounded-t-2xl shadow-lg border-t-4 border-indigo-400 p-4">
                  <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Tablets className="w-4 h-4 text-slate-500"/></div>
                      <div className="text-sm font-bold text-slate-700">Paracetamol 650mg</div>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Tablets className="w-4 h-4 text-slate-500"/></div>
                      <div className="text-sm font-bold text-slate-700">Azithromycin 500</div>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">PRINT / SHARE</div>
              </div>
            </div>
          </motion.div>

          {/* 3. PATIENT HISTORY (Wide - Spans 6 cols) */}
          <motion.div variants={itemVariants} className="md:col-span-6 group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 hover:border-blue-400 transition-all hover:shadow-lg">
             <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                    <History className="w-6 h-6" />
                 </div>
             </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Longitudinal History</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Instantly toggle to view a patient's past visits, diagnosis, and lab reports without leaving the current screen.</p>
            
            {/* Timeline Visual */}
            <div className="mt-auto pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-4">
                <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900"></div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Today</div>
                    <div className="text-xs text-slate-500">Viral Fever - OPD</div>
                </div>
                <div className="relative opacity-60">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900"></div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">12 Aug 2024</div>
                    <div className="text-xs text-slate-500">Regular Checkup</div>
                </div>
            </div>
          </motion.div>

           {/* 4. DEVICE AGNOSTIC (Wide - Spans 6 cols) */}
           <motion.div variants={itemVariants} className="md:col-span-6 group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 hover:border-purple-400 transition-all hover:shadow-lg">
             <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 text-purple-600">
                <Laptop className="w-6 h-6" />
              </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Any Device. Anywhere.</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
                The doctor app is a lightweight PWA. It works on your <strong>Laptop</strong>, your <strong>iPad</strong> during rounds, or your <strong>Phone</strong> for quick checks.
            </p>
            <div className="flex gap-4 mt-auto">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600"><Zap size={12} className="mr-1"/> Fast Load</Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600"><ShieldCheck size={12} className="mr-1"/> Secure Data</Badge>
            </div>
          </motion.div>

        </motion.div>
      </section>

      {/* --- ROADMAP SECTION --- */}
      <section className="py-24 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Coming to the Doctor App</h2>
                <Badge variant="outline" className="mt-2 md:mt-0 border-indigo-200 text-indigo-600">Q3 Roadmap</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Feature 1 */}
                <div className="flex gap-6 p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="shrink-0 w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600">
                        <Mic className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Scribe</h3>
                        <p className="text-slate-500">Listen to the consultation and auto-fill the diagnosis notes. No more typing.</p>
                    </div>
                </div>

                {/* Feature 2 */}
                <div className="flex gap-6 p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600">
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Interaction Checker</h3>
                        <p className="text-slate-500">Real-time alerts if prescribed medicines conflict with patient allergies.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-4 text-center bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Medicine is hard.<br/>Your software shouldn't be.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 shadow-xl">
                   Start Using Qlinic
                </Button>
            </div>
        </div>
      </section>
    </div>
  );
};

export default ForDoctorsPage;