"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MoveLeft, Activity } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      
      {/* --- BRANDED BACKGROUND GLOW --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center px-4">
        
        {/* --- QLINIC BRANDED 404 --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center justify-center gap-2 sm:gap-4 select-none"
        >
          {/* The First "4" */}
          <span className="text-[8rem] sm:text-[12rem] font-black leading-none tracking-tighter text-slate-300 dark:text-slate-800">
            4
          </span>

          {/* The "0" Container */}
          <div className="relative flex items-center justify-center">
             
             {/* The "0" Ring (Mimics the font character) */}
             <div className="w-24 h-32 sm:w-40 sm:h-52 rounded-[3rem] sm:rounded-[4.5rem] border-[12px] sm:border-[20px] border-slate-200 dark:border-slate-800 bg-transparent box-border z-10 relative overflow-hidden flex items-center justify-center">
                
                {/* Inner Shadow to give depth to the 0 */}
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] rounded-[2.5rem] sm:rounded-[3.5rem] pointer-events-none" />

                {/* The Pulse Inside */}
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-20 text-blue-600 dark:text-blue-500"
                >
                    <Activity className="w-10 h-10 sm:w-16 sm:h-16 drop-shadow-sm" strokeWidth={3} />
                    
                    {/* Ripple Effect */}
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute inset-0 -m-2 rounded-full bg-blue-500/20 blur-md"
                    />
                </motion.div>

             </div>
          </div>

          {/* The Second "4" */}
          <span className="text-[8rem] sm:text-[12rem] font-black leading-none tracking-tighter text-slate-300 dark:text-slate-800">
            4
          </span>
        </motion.div>

        {/* --- MEDICAL/CLINIC COPY --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-8 space-y-6"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Looks like this page missed its appointment.
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            The record you are looking for might have been moved, deleted, or never existed in the Qlinic database.
          </p>

          {/* --- ACTIONS --- */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
                variant="ghost" 
                size="lg"
                onClick={() => window.history.back()}
                className="w-full sm:w-auto rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 h-12 px-8 transition-all hover:scale-105 active:scale-95"
            >
                <MoveLeft className="w-4 h-4 mr-2" />
                Go Back
            </Button>

            <Link href="/" passHref>
              <Button size="lg" className="w-full sm:w-auto rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-xl shadow-slate-900/10 h-12 px-8 font-semibold transition-all hover:scale-105 active:scale-95">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>

      </div>

      {/* --- SYSTEM ID FOOTER --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 flex flex-col items-center gap-2"
      >
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mb-2"></div>
        <p className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">
            Qlinic Systems • Error 404
        </p>
      </motion.div>

    </div>
  );
};

export default NotFoundPage;