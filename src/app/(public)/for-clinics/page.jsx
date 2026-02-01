"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { 
  Check, Tablet, Monitor, Users, Package, 
  FileText, CreditCard, FlaskConical, Database, 
  ArrowRight, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ForClinicsPage = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-900/20 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-4 py-1.5 text-sm rounded-full">
              <Sparkles className="w-3.5 h-3.5 mr-2 fill-blue-500 text-blue-500" />
              The Operating System for Modern Clinics
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
              Finish OPD Faster. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Manage Better.
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              OPD queue management for clinics that see hundreds of patients per day. 
              Bring control back to the clinic side.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-12 text-base shadow-lg shadow-blue-600/20">
                  Get Started Now
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="ghost" size="lg" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800 rounded-full h-12 px-6">
                  See How It Works <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- BENTO GRID: AVAILABLE FEATURES --- */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              The Command Center
            </h2>
            <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Live & Available</span>
            </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-6 gap-6"
        >
          {/* Feature 1: Receptionist (Large - Spans 4 cols) */}
          <motion.div variants={itemVariants} className="md:col-span-4 group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-8 h-full flex flex-col justify-between relative z-10">
              <div className="mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                  <Tablet className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Receptionist Dashboard</h3>
                <ul className="space-y-2 mb-6">
                  {["Fast Check-In at Reception", "Unified queue for App & Walk-Ins", "Easy to use, no tech headaches"].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* IMAGE SLOT: RECEPTIONIST DASHBOARD */}
              <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-inner border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                {/* TODO: Replace src with your real Receptionist App screenshot */}
                <Image 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?q=80&w=800&auto=format&fit=crop" 
                  alt="Reception Dashboard Interface" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Doctor (Tall - Spans 2 cols) */}
          <motion.div variants={itemVariants} className="md:col-span-2 group relative bg-blue-600 rounded-3xl border border-blue-500 shadow-lg shadow-blue-900/20 overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <div className="p-8 flex-1 flex flex-col relative z-10 text-white">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Doctor Dashboards</h3>
              <p className="text-blue-100 mb-6 text-sm">
                A dedicated, simplified interface for doctors. Full patient history and Rx generation in a focused view.
              </p>
              
              {/* IMAGE SLOT: DOCTOR DEDICATED APP */}
              <div className="mt-auto bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span className="text-sm font-medium">Two-click Rx generator</span>
                </div>
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-blue-800">
                   {/* TODO: Replace src with your real Doctor App screenshot */}
                   <Image 
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop" 
                    alt="Doctor Dedicated App Interface" 
                    fill 
                    className="object-cover opacity-90" 
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 3: Inventory (Spans 2 cols) */}
          <motion.div variants={itemVariants} className="md:col-span-2 group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 hover:border-blue-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Clinic Inventory & Tasks</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" /> Track medical stock levels</li>
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" /> Receive low stock alerts</li>
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" /> Manage suppliers</li>
            </ul>
          </motion.div>

          {/* Feature 4: Staff Mgmt (Spans 2 cols) */}
          <motion.div variants={itemVariants} className="md:col-span-2 group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 hover:border-purple-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Doctor & Staff Management</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" /> Add/manage doctors & staff</li>
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" /> View all schedules</li>
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" /> Customize clinic hours</li>
            </ul>
          </motion.div>

           {/* Feature 5: Patient History (Spans 2 cols) */}
           <motion.div variants={itemVariants} className="md:col-span-2 group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 hover:border-teal-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Patient History & Documents</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" /> Access past visits easily</li>
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" /> Upload medical records</li>
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" /> Control document viewing</li>
            </ul>
          </motion.div>
        </motion.div>
      </section>

      {/* --- ROADMAP SECTION --- */}
      <section className="py-20 bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <Badge variant="outline" className="mb-4 border-teal-500/50 text-teal-400 px-3 py-1">Roadmap</Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What's Coming Next</h2>
                <p className="text-slate-400">We are constantly building to make your clinic smarter.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Coming Soon 1 */}
                <div className="relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-all">
                    <div className="absolute -top-3 left-6 bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded">COMING SOON</div>
                    <div className="h-10 w-10 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                        <CreditCard className="w-5 h-5 text-teal-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Integrated Billing</h3>
                    <p className="text-sm text-slate-400 mb-4">Generate invoices, track payments, and handle insurance claims seamlessly.</p>
                </div>

                {/* Coming Soon 2 */}
                <div className="relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-all">
                    <div className="absolute -top-3 left-6 bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded">COMING SOON</div>
                    <div className="h-10 w-10 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                        <FlaskConical className="w-5 h-5 text-teal-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Lab Test Integrations</h3>
                    <p className="text-sm text-slate-400 mb-4">Order lab tests during OPD and receive results directly into Qlinic dashboard.</p>
                </div>

                {/* Coming Soon 3 */}
                <div className="relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-all">
                    <div className="absolute -top-3 left-6 bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded">COMING SOON</div>
                    <div className="h-10 w-10 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                        <Database className="w-5 h-5 text-teal-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Structured Digital Records</h3>
                    <p className="text-sm text-slate-400 mb-4">Cleaner, safer medical history making patient data significantly easier to find.</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-4 text-center bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Manage OPDs Easier. <br/>Deliver Better Care.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/sign-up">
                    <Button size="lg" className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                        Get Started with Qlinic
                    </Button>
                </Link>
            </div>
        </div>
      </section>
    </div>
  );
};

export default ForClinicsPage;