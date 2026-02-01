"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Leaf, Trees, CloudLightning, FileDigit, 
  Recycle, Wind, ArrowRight, Sprout, HeartHandshake
} from 'lucide-react';

const SustainabilityPage = () => {
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
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Organic Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] right-[10%] w-[60%] h-[60%] rounded-full bg-blue-100/60 dark:bg-blue-900/20 blur-[120px]" />
            <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-teal-100/60 dark:bg-teal-900/20 blur-[120px]" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="outline" className="mb-6 border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-4 py-1.5 text-sm rounded-full backdrop-blur-md">
              <Leaf className="w-3.5 h-3.5 mr-2" />
              Green Healthcare Initiative
            </Badge>
            
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8">
              Healthcare that doesn't <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                cost the Earth.
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              We believe modern medicine shouldn't come with mountains of paperwork. Qlinic is designed to digitize the entire OPD workflow, saving millions of pages every year.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- THE IMPACT GRID --- */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 w-full max-w-[1400px] mx-auto">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          
          {/* Card 1: The Paper Problem (Wide) */}
          <motion.div variants={itemVariants} className="md:col-span-8 group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all">
            <div className="grid md:grid-cols-2 h-full">
                <div className="p-10 flex flex-col justify-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                        <FileDigit className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">The Paperless Clinic</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
                        A single busy clinic generates over <strong>20,000 sheets</strong> of paper annually in prescriptions, receipts, and files. Qlinic brings that number to near zero.
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-slate-500"><Recycle className="w-4 h-4 text-blue-500"/> Digital Prescriptions (Rx)</li>
                        <li className="flex items-center gap-2 text-sm text-slate-500"><Recycle className="w-4 h-4 text-blue-500"/> SMS/App Receipts</li>
                        <li className="flex items-center gap-2 text-sm text-slate-500"><Recycle className="w-4 h-4 text-blue-500"/> Cloud Medical Records</li>
                    </ul>
                </div>
                <div className="relative h-64 md:h-auto bg-slate-100 dark:bg-slate-800">
                    <Image 
                        src="https://images.unsplash.com/photo-1584036561566-b937640331d3?q=80&w=800&auto=format&fit=crop" 
                        alt="Paperless tablet workflow" 
                        fill 
                        className="object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-slate-900 to-transparent md:via-transparent" />
                </div>
            </div>
          </motion.div>

          {/* Card 2: Impact Counter (Square) */}
          <motion.div variants={itemVariants} className="md:col-span-4 bg-blue-900 text-white rounded-[2.5rem] p-10 flex flex-col justify-between relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="relative z-10">
                <Trees className="w-10 h-10 text-blue-300 mb-6" />
                <h3 className="text-xl font-medium text-blue-100 mb-2">Projected Impact</h3>
                <p className="text-5xl font-bold mb-2">1,200+</p>
                <p className="text-blue-300">Trees saved annually by our partner clinics.</p>
            </div>
            
            <div className="mt-8 pt-8 border-t border-blue-800/50">
                <p className="text-sm text-blue-400">Every 8,333 sheets of paper = 1 Tree.</p>
            </div>
          </motion.div>

          {/* Card 3: Cloud Efficiency (Wide) */}
          <motion.div variants={itemVariants} className="md:col-span-6 group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 hover:border-blue-200 transition-all">
             <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-600 mb-6">
                <CloudLightning className="w-6 h-6" />
             </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Green Cloud Infrastructure</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
                Physical storage requires climate-controlled rooms (AC) 24/7. Qlinic runs on efficient, scalable cloud servers that optimize energy usage based on demand.
            </p>
          </motion.div>

           {/* Card 4: Reducing Travel (Wide) */}
           <motion.div variants={itemVariants} className="md:col-span-6 group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 hover:border-teal-200 transition-all">
             <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
                <Wind className="w-6 h-6" />
             </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Reduced Carbon Emissions</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
                By enabling smart queuing, we reduce vehicle idling time outside clinics. By enabling digital follow-ups, we reduce unnecessary travel entirely.
            </p>
          </motion.div>

        </motion.div>
      </section>

      {/* --- VISUAL COMPARISON --- */}
      <section className="py-20 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">The Qlinic Difference</h2>
                <p className="text-slate-500">Sustainability is built into the workflow, not added as an afterthought.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Old Way */}
                <div className="opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                             <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Traditional Clinic</h3>
                             <Badge variant="outline" className="border-red-200 text-red-500">High Waste</Badge>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-500">
                                <span className="w-2 h-2 bg-red-400 rounded-full"/> Physical Patient Files (Storage heavy)
                            </li>
                            <li className="flex items-center gap-3 text-slate-500">
                                <span className="w-2 h-2 bg-red-400 rounded-full"/> Paper Prescriptions (Lost easily)
                            </li>
                            <li className="flex items-center gap-3 text-slate-500">
                                <span className="w-2 h-2 bg-red-400 rounded-full"/> Printed Lab Reports
                            </li>
                            <li className="flex items-center gap-3 text-slate-500">
                                <span className="w-2 h-2 bg-red-400 rounded-full"/> Thermal Paper Receipts (Non-recyclable)
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex justify-center text-blue-200">
                    <ArrowRight size={48} />
                </div>

                {/* New Way */}
                <div className="transform md:scale-105 shadow-2xl rounded-3xl">
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-3xl p-8 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-6">
                             <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Qlinic Powered</h3>
                             <Badge className="bg-blue-500 text-white">Eco-Friendly</Badge>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
                                <Sprout className="w-4 h-4 text-blue-500"/> Cloud Database (Zero physical footprint)
                            </li>
                            <li className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
                                <Sprout className="w-4 h-4 text-blue-500"/> WhatsApp/App Prescriptions
                            </li>
                            <li className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
                                <Sprout className="w-4 h-4 text-blue-500"/> Digital Report Integration
                            </li>
                            <li className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
                                <Sprout className="w-4 h-4 text-blue-500"/> SMS Invoicing
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-4 text-center bg-slate-50 dark:bg-slate-950">
        <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                <HeartHandshake className="w-8 h-8" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Sustain your practice.<br/>Sustain the planet.
            </h2>
            <p className="text-lg text-slate-500 mb-10">
                Join the network of clinics that are saving time, money, and trees.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20">
                   Go Paperless Today
                </Button>
            </div>
        </div>
      </section>

    </div>
  );
};

export default SustainabilityPage;