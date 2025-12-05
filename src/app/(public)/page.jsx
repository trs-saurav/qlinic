"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  Users, 
  Shield, 
  Stethoscope,
  Heart,
  Star,
  CheckCircle,
  Activity
} from 'lucide-react';

const HomePage = () => {
  const router = useRouter();

  const features = [
    {
      icon: Calendar,
      title: "Easy Appointments",
      description: "Book appointments with top doctors in just a few clicks"
    },
    {
      icon: Clock,
      title: "24/7 Access",
      description: "Access your health records and book appointments anytime"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your medical data is encrypted and completely secure"
    },
    {
      icon: Users,
      title: "Expert Doctors",
      description: "Connect with verified healthcare professionals"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Patients" },
    { number: "500+", label: "Doctors" },
    { number: "50+", label: "Hospitals" },
    { number: "98%", label: "Satisfaction" }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute bottom-20 right-10 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              rotate: 360
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-300/10 to-violet-300/10 rounded-full blur-3xl"
          />
        </div>

        {/* Content */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        >
          <div className="text-center space-y-8">
            

            {/* Main Heading */}
            <motion.h1 
              variants={itemVariants}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight"
            >
              <span className="block text-gray-900 dark:text-white mb-2">
                Healthcare Made
              </span>
              <span className="block bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                Simple & Accessible
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={itemVariants}
              className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300"
            >
              Connect with top doctors, book appointments instantly, and manage your health records all in one secure platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/patient')}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 overflow-hidden"
              >
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/aboutus')}
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full font-semibold text-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 transition-all duration-300"
              >
                Learn More
              </motion.button>
            </motion.div>

            {/* Floating Medical Icons */}
            <div className="relative h-40 mt-12">
              <motion.div
                variants={floatingVariants}
                animate="animate"
                className="absolute left-1/4 top-0"
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </motion.div>

              <motion.div
                variants={floatingVariants}
                animate="animate"
                style={{ animationDelay: '1s' }}
                className="absolute right-1/4 top-0"
              >
                <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
              </motion.div>

              <motion.div
                variants={floatingVariants}
                animate="animate"
                style={{ animationDelay: '0.5s' }}
                className="absolute left-1/2 transform -translate-x-1/2 top-10"
              >
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-20">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">QLINIC</span>?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience healthcare the way it should be - simple, secure, and accessible
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1 
                  }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    y: -10,
                    transition: { duration: 0.3 }
                  }}
                  className="group relative p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  
                  <div className="relative z-10">
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-14 h-14 bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow duration-300"
                    >
                      <IconComponent className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </motion.div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

            <section className="relative w-full pt-18 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative w-full bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 overflow-hidden"
        >
          {/* Animated background pattern */}
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
              backgroundSize: '60px 60px',
            }}
          />

          {/* Floating shapes */}
          <motion.div
            animate={{ 
              y: [0, -30, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-10 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl"
          />
          <motion.div
            animate={{ 
              y: [0, 30, 0],
              rotate: [360, 180, 0]
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-10 right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"
          />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl md:text-6xl lg:text-5xl font-black text-white mb-6"
            >
              Ready to Transform Your Healthcare?
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl text-white/95 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Join thousands of patients experiencing better healthcare today. Start your journey to wellness now.
            </motion.p>
            
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 0.9 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 0.9, boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/get-started')}
              className="inline-flex items-center gap-3 px-10 py-6 bg-white text-blue-600 rounded-2xl font-black text-xl   transition-all duration-300"
            >
              Start Your Journey
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
