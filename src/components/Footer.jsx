"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Send,
  Heart,
  Sparkles,
  Stethoscope,
  Shield,
  Zap,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import Image from 'next/image';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  const footerSections = {
    product: [
      { label: 'Find Doctors', href: '/user/doctors', icon: Stethoscope },
      { label: 'Book Appointments', href: '/user/appointments', icon: CheckCircle2 },
      { label: 'Hospitals', href: '/user/hospitals', icon: MapPin },
      { label: 'Telemedicine', href: '/telemedicine', icon: Zap },
    ],
    company: [
      { label: 'About Us', href: '/aboutus' },
      { label: 'Our Mission', href: '/aboutus' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact-us' },
    ],
    resources: [
      { label: 'Blog', href: '/blog' },
      { label: 'Health Tips', href: '/health-tips' },
      { label: 'Help Center', href: '/help' },
      { label: 'FAQ', href: '/faq' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter', gradient: 'from-sky-400 to-blue-500' },
    { icon: Linkedin, href: '#', label: 'LinkedIn', gradient: 'from-blue-600 to-blue-700' },
    { icon: Instagram, href: '#', label: 'Instagram', gradient: 'from-purple-500 to-pink-500' },
    { icon: Facebook, href: '#', label: 'Facebook', gradient: 'from-blue-500 to-blue-600' },
  ];

  const stats = [
    { value: '10K+', label: 'Patients' },
    { value: '250+', label: 'Doctors' },
    { value: '50+', label: 'Cities' },
    { value: '99%', label: 'Satisfaction' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.05, 0.03]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.03, 0.05, 0.03]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-500 to-purple-500 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section - Brand & Newsletter */}
        <div className="pt-16 pb-12 border-b border-gray-200 dark:border-gray-800">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-12 h-12 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25"
                >
                  <Image
                    src="/LOGO.png"
                    alt="QLINIC"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    QLINIC
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Healthcare made simple</p>
                </div>
              </Link>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-w-md">
                Book verified doctors instantly, manage appointments seamlessly, and take control of your healthcare journey—all in one platform.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Secure Platform</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Verified Doctors</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-900">
                  <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Fast Booking</span>
                </div>
              </div>
            </motion.div>

            {/* Newsletter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Stay in the loop</h4>
                </div>
                
                <p className="text-blue-100 mb-6 text-sm">
                  Get health tips, platform updates, and exclusive offers delivered to your inbox.
                </p>

                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3.5 bg-white/95 backdrop-blur-sm rounded-xl border-2 border-transparent focus:border-white focus:outline-none text-gray-900 placeholder:text-gray-500 transition-all"
                      required
                    />
                  </div>
                  
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={subscribed}
                    className="w-full px-6 py-3.5 bg-white text-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {subscribed ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Subscribed!
                      </>
                    ) : (
                      <>
                        Subscribe Now
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>

   

        {/* Links Section */}
        <div className="py-12 border-b border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {Object.entries(footerSections).map(([category, links], idx) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
                      >
                        {link.icon && <link.icon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        <span>{link.label}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="py-12 border-b border-gray-200 dark:border-gray-800">
          <div className="grid sm:grid-cols-3 gap-6">
            <motion.a
              href="mailto:support@qlinichealth.com"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -2 }}
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Email us</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">support@qlinichealth.com</div>
              </div>
            </motion.a>

            <motion.a
              href="tel:+911234567890"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -2 }}
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group"
            >
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Call us</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">+91 123 456 7890</div>
              </div>
            </motion.a>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl"
            >
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Patna, Bihar, India</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3"
            >
              {socialLinks.map((social, idx) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-11 h-11 bg-gradient-to-br ${social.gradient} rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all`}
                    aria-label={social.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </motion.div>

            {/* Copyright & Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600 dark:text-gray-400"
            >
              <div className="flex items-center gap-2">
                <span>© {currentYear} QLINIC</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  Made with 
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  </motion.span>
                  in India
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
