"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Newspaper, TrendingUp, BookOpen, Briefcase, 
  ArrowRight, Construction, Bell, Mail 
} from 'lucide-react';

const ResourcesComingSoon = () => {
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

  const upcomingSections = [
    {
      title: "Newsroom",
      icon: Newspaper,
      desc: "Official press releases, media kits, and brand assets for journalists.",
      status: "Launching Q3",
      color: "blue"
    },
    {
      title: "Investor Relations",
      icon: TrendingUp,
      desc: "Financial reports, growth metrics, and shareholder updates.",
      status: "Private Beta",
      color: "indigo"
    },
    {
      title: "Qlinic Blog",
      icon: BookOpen,
      desc: "Deep dives into digital health trends, clinic management tips, and case studies.",
      status: "Writing in Progress",
      color: "emerald"
    },
    {
      title: "Careers",
      icon: Briefcase,
      desc: "Join the team building the operating system for modern healthcare.",
      status: "Hiring Soon",
      color: "violet"
    }
  ];

  return (
    <div className="min-h-screen pt-20 bg-slate-950  font-sans selection:bg-blue-900 text-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl w-full px-6 py-20 relative z-10">
        
        {/* --- HEADER --- */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
            <Construction className="w-3 h-3" />
            Under Construction
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            We are expanding <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              the ecosystem.
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            You caught us early! These resource hubs are currently being built to support our growing network of clinics and partners.
          </p>
        </motion.div>

        {/* --- CARDS GRID --- */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20"
        >
          {upcomingSections.map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="group relative p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all duration-300"
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />

              <div className="relative z-10 flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-800 group-hover:bg-blue-900/30 group-hover:text-blue-400 transition-colors mb-6 text-slate-400`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-950/50">
                  {item.status}
                </Badge>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-500 group-hover:text-slate-400 transition-colors">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>


        {/* --- FOOTER LINK --- */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.8 }}
           className="text-center mt-12"
        >
           <Button variant="link" className="text-slate-500 hover:text-white">
              &larr; Back to Home
           </Button>
        </motion.div>

      </div>
    </div>
  );
};

export default ResourcesComingSoon;