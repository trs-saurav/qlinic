"use client"
import React from 'react';
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
  Youtube,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: 'About Us', href: '/aboutus' },
      { label: 'Our Team', href: '/team' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
    services: [
      { label: 'For Patients', href: '/patient' },
      { label: 'For Doctors', href: '/doctor' },
      { label: 'For Hospitals', href: '/hospital' },
      { label: 'Telemedicine', href: '/telemedicine' },
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
    resources: [
      { label: 'Blog', href: '/blog' },
      { label: 'Health Tips', href: '/health-tips' },
      { label: 'Medical News', href: '/news' },
      { label: 'Solutions', href: '/solution' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:text-blue-600' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-sky-500' },
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-pink-600' },
    { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:text-blue-700' },
    { icon: Youtube, href: '#', label: 'YouTube', color: 'hover:text-red-600' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        {/* Main Footer Content */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
            
            {/* Brand Section */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src="/LOGO.png"
                    alt="QLINIC Logo"
                    width={40}
                    height={40}
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent flex items-center gap-1">
                    QLINIC
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  </h3>
                  <p className="text-xs text-gray-400">Your healthcare partner</p>
                </div>
              </Link>
              
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Transforming healthcare with technology. Connect with top doctors, book appointments, and manage your health all in one platform.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <motion.a 
                  href="mailto:support@qlinic.com"
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-sm hover:text-blue-400 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  support@qlinic.com
                </motion.a>
                
                <motion.a 
                  href="tel:+911234567890"
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-sm hover:text-blue-400 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-violet-600/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  +91 123 456 7890
                </motion.a>
                
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="w-8 h-8 bg-purple-600/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  Mumbai, India
                </motion.div>
              </div>
            </motion.div>

            {/* Links Sections */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <motion.div key={category} variants={itemVariants}>
                <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link 
                        href={link.href}
                        className="text-sm hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
                      >
                        <span className="w-0 group-hover:w-4 transition-all duration-200">
                          <ArrowRight className="w-3 h-3" />
                        </span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Newsletter Section */}
          <motion.div 
            variants={itemVariants}
            className="mt-12 pt-8 border-t border-gray-700/50"
          >
            <div className="max-w-md">
              <h4 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Stay Updated
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Subscribe to our newsletter for health tips and updates
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-sm transition-colors duration-200"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-200"
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Social Links & Bottom Bar */}
          <motion.div 
            variants={itemVariants}
            className="mt-8 pt-8 border-t border-gray-700/50 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center ${social.color} transition-colors duration-200 group`}
                    aria-label={social.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>

            {/* Copyright */}
            <div className="flex flex-col md:flex-row items-center gap-4 text-xs text-gray-500">
              <p>© {currentYear} QLINIC. All rights reserved.</p>
              <div className="flex items-center gap-3">
                <Link href="/terms" className="hover:text-blue-400 transition-colors duration-200">
                  Terms
                </Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-blue-400 transition-colors duration-200">
                  Privacy
                </Link>
                <span>•</span>
                <Link href="/cookies" className="hover:text-blue-400 transition-colors duration-200">
                  Cookies
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Made with love tag */}
          <motion.div 
            variants={itemVariants}
            className="mt-6 text-center"
          >
            <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
              Made with 
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Image
                  src="/LOGO.png"
                  alt="QLINIC Logo"
                  width={12}
                  height={12}
                  className="w-3 h-3 object-contain"
                />
              </motion.span>
              in India
            </p>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
