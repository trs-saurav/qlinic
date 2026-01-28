"use client"
import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Image from 'next/image'
import { 
  ArrowRight, Zap, Shield, Star, TrendingUp, CheckCircle, 
  Sparkles, Activity, Heart, Stethoscope, ChevronRight, MapPin,
  Building2, Navigation, Clock, Phone, Award, Users, Calendar,
  Loader2, Search, TrendingDown, Lock, Pill, TestTube, User
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

// Marquee Component
const Marquee = ({ children, reverse, duration = 20, pauseOnHover = true, className = '' }) => {
  const containerRef = React.useRef(null);
  const isInView = useInView(containerRef, { once: false, margin: '-100px' });
  
  return (
    <div ref={containerRef} className={`flex flex-nowrap overflow-hidden ${className} hidden sm:flex`}>
      <motion.div
        className="flex flex-nowrap gap-8" // Increased gap for bigger spacing
        animate={isInView ? {
          x: [reverse ? 100 : -100, reverse ? -100 : 100],
        } : {
          x: reverse ? 100 : -100
        }}
        transition={{
          duration: duration,
          ease: "linear",
          repeat: isInView ? Infinity : 0,
          repeatType: "loop",
        }}
        style={{ width: 'max-content' }}
        initial={{
          x: reverse ? 100 : -100
        }}
        whileHover={{
          animationPlayState: pauseOnHover ? "paused" : "running"
        }}
      >
        {children}
        {/* Removed duplicate children */}
      </motion.div>
    </div>
  );
};

// Vertical Marquee Component for Mobile
const VerticalMarquee = ({ children, reverse, duration = 20, pauseOnHover = true, className = '' }) => {
  const containerRef = React.useRef(null);
  const isInView = useInView(containerRef, { once: false, margin: '-100px' });
  
  return (
    <div ref={containerRef} className={`flex flex-col overflow-hidden ${className} sm:hidden`}>
      <motion.div
        className="flex flex-col gap-4" // Smaller gap for mobile
        animate={isInView ? {
          y: [reverse ? 100 : -100, reverse ? -100 : 100],
        } : {
          y: reverse ? 100 : -100
        }}
        transition={{
          duration: duration,
          ease: "linear",
          repeat: isInView ? Infinity : 0,
          repeatType: "loop",
        }}
        style={{ height: 'max-content' }}
        initial={{
          y: reverse ? 100 : -100
        }}
        whileHover={{
          animationPlayState: pauseOnHover ? "paused" : "running"
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const HomePage = () => {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const [stats, setStats] = useState(null)
  const [topDoctors, setTopDoctors] = useState([])
  const [featuredHospitals, setFeaturedHospitals] = useState([])
  const [nearbyHospitals, setNearbyHospitals] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [locationLoading, setLocationLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [locationName, setLocationName] = useState('')

  // Sample doctors fallback for the homepage carousel
  const sampleDoctors = [
    {
      _id: 'doc-1',
      firstName: 'Ananya',
      lastName: 'Roy',
      profileImage: 'https://images.unsplash.com/photo-1550831107-1553da8c8464?w=600&h=600&fit=crop&crop=face',
      doctorProfile: { specialization: 'Cardiologist', rating: 4.9, reviews: 128, experience: 18, patients: 2000 },
      hospitalName: 'Apollo Hospitals',
      location: 'MG Road, Bengaluru'
    },
    {
      _id: 'doc-2',
      firstName: 'Rohan',
      lastName: 'Mehta',
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop&crop=face',
      doctorProfile: { specialization: 'Pediatrician', rating: 4.8, reviews: 98, experience: 12, patients: 1500 },
      hospitalName: 'Cloud Nine Clinic',
      location: 'Indiranagar, Bengaluru'
    },
    {
      _id: 'doc-3',
      firstName: 'Sneha',
      lastName: 'Gupta',
      profileImage: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=600&h=600&fit=crop&crop=face',
      doctorProfile: { specialization: 'Dermatologist', rating: 4.7, reviews: 76, experience: 10, patients: 900 },
      hospitalName: 'GreenCare Hospital',
      location: 'Koramangala, Bengaluru'
    },
    {
      _id: 'doc-4',
      firstName: 'Arjun',
      lastName: 'Kumar',
      profileImage: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=600&h=600&fit=crop&crop=face',
      doctorProfile: { specialization: 'Orthopedist', rating: 4.8, reviews: 110, experience: 15, patients: 1700 },
      hospitalName: 'Swasthya Center',
      location: 'Whitefield, Bengaluru'
    }
  ]

  const displayDoctors = (topDoctors && topDoctors.length > 0) ? topDoctors : sampleDoctors
  const carouselRef = React.useRef(null)
  const rafRef = React.useRef(null)
  const [isPaused, setIsPaused] = useState(false)
  const [activeDot, setActiveDot] = useState(0)

  // Auto-scroll loop: gentle continuous scroll that resets when reaching the end
  useEffect(() => {
    const el = carouselRef.current
    if (!el) return

    const speed = 0.6 // pixels per frame
    let running = true

    const step = () => {
      if (!running) return
      if (!isPaused) {
        el.scrollLeft += speed
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0
        }
        // update active dot based on nearest card
        const card = el.querySelector('[data-doctor-card]')
        if (card) {
          const cardW = card.clientWidth + parseInt(getComputedStyle(card).marginRight || 0)
          setActiveDot(Math.round(el.scrollLeft / cardW) % displayDoctors.length)
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPaused, displayDoctors.length])


  useEffect(() => {
    fetchHomeData()
    loadSavedLocation()
  }, [])

  useLayoutEffect(() => {
    setHydrated(true)
  }, [])


  const loadSavedLocation = () => {
    const savedLocation = localStorage.getItem('userLocation')
    if (savedLocation) {
      const location = JSON.parse(savedLocation)
      setUserLocation(location)
      setLocationName(location.name)
      fetchNearbyHospitals(location)
    }
  }


  const fetchHomeData = async () => {
    try {
      const response = await fetch('/api/home/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
        setTopDoctors(data.topDoctors || [])
        setFeaturedHospitals(data.featuredHospitals || [])
        setTestimonials(data.testimonials || [])
      }
    } catch (error) {
      console.error('Error fetching home data:', error)
    } finally {
      setLoading(false)
    }
  }


  const getUserLocation = () => {
    setLocationLoading(true)

    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const city = data.address?.city || data.address?.town || 'Your Location'
          const state = data.address?.state || ''
          const name = `${city}${state ? ', ' + state : ''}`

          const location = {
            latitude,
            longitude,
            name,
            timestamp: new Date().toISOString(),
          }

          setUserLocation(location)
          setLocationName(name)
          localStorage.setItem('userLocation', JSON.stringify(location))
          toast.success(`Location detected: ${name}`)

          fetchNearbyHospitals(location)
        } catch (err) {
          console.error('Geocoding error:', err)
          const location = {
            latitude,
            longitude,
            name: 'Your Location',
            timestamp: new Date().toISOString(),
          }
          setUserLocation(location)
          setLocationName('Your Location')
          localStorage.setItem('userLocation', JSON.stringify(location))
          fetchNearbyHospitals(location)
        }

        setLocationLoading(false)
      },
      (error) => {
        console.error('Location error:', error)
        toast.error('Unable to get location')
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }


  const fetchNearbyHospitals = async (location = userLocation) => {
    if (!location) return

    try {
      const params = new URLSearchParams({
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
        radius: '20',
        limit: '6',
      })

      const response = await fetch(`/api/search/nearby?${params}`)
      const data = await response.json()

      if (data.success) {
        setNearbyHospitals(data.results.hospitals || [])
      }
    } catch (error) {
      console.error('Nearby search error:', error)
    }
  }


  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" suppressHydrationWarning>

      {/* Hero Section */}
      <section className="relative qlinic-hero pt-24 sm:pt-32 pb-16 sm:pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-r from-blue-400 to-blue-400 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full blur-3xl"
          />
        </div>


        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-100 rounded-full mb-4 sm:mb-6"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-semibold text-blue-700">
                  India's #1 Healthcare Platform
                </span>
              </motion.div>


              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-4 sm:mb-6 leading-tight">
                Your Health,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                  Instantly Connected
                </span>
              </h1>


              <p className="text-base sm:text-xl text-slate-600 mb-6 sm:mb-8 leading-relaxed">
                Book appointments with top doctors, get instant consultations, and access your health records - all in one place.
              </p>


              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/sign-up')}
                  className="btn-primary px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-102 text-base sm:text-lg flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>


                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/aboutus')}
                  className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl border-2 text-base sm:text-lg transition-all duration-200 transform hover:scale-102"
                  style={{ borderColor: '#2563eb', color: 'var(--qlinic-text)' }}
                >
                  Learn More
                </motion.button>
              </div>


              {/* Trust Indicators */}
              <div className="mt-8 sm:mt-12 flex flex-wrap items-center gap-4 sm:gap-8">
                <div>
                </div>
              </div>
            </motion.div>


            {/* Right Content - AI Robot Video - No Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* AI Robot Video - No Container */}
                <div className="flex justify-center items-center">
                  <motion.video
                    src="/qliniagent.webm"
                    autoPlay
                    loop
                    muted
                    playsInline
                    animate={{
                      y: [-5, 5, -5],
                      scale: [1.05, 1.1, 1.05],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-full h-auto max-h-[500px] object-contain drop-shadow-2xl"
                    style={{ filter: 'drop-shadow(0 25px 25px rgba(37, 99, 235, 0.3))' }}
                    aria-label="Friendly AI doctor assistant mascot for QLINIC healthcare platform"
                  />
                </div>

                {/* Clean Solid Floating Stats */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -right-4 top-20 qlinic-card shadow-xl p-4 bg-white rounded-xl border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0ea5e9, #22c55e)' }}>
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Always Available</p>
                      <p className="text-lg font-bold text-slate-900">24/7</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -left-4 bottom-20 qlinic-card shadow-xl p-4 bg-white rounded-xl border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22c55e, #0ea5e9)' }}>
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">AI Secured</p>
                      <p className="text-sm font-bold text-slate-900">Safe</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Quick Services */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-6 sm:mb-8"
          >
            What are you looking for?
          </motion.h2>

          <div className="relative overflow-hidden py-4">
            <div className="flex flex-nowrap gap-4">
              <div className="flex justify-center w-full">
                <div className="flex justify-center w-full">
                  <div className="relative w-full max-w-4xl overflow-hidden">
                    <div className="hidden sm:block">
                      <Marquee pauseOnHover={true} duration={5}>
                        {[
                          { icon: '🩺', title: 'Find Doctors', subtitle: '500+ specialists', color: 'blue' },
                          { icon: '🏥', title: 'Hospitals', subtitle: 'Verified centers', color: 'green' },
                          { icon: '💊', title: 'Medicines', subtitle: 'Order online', color: 'blue' },
                          { icon: '🩹', title: 'Lab Tests', subtitle: 'At home', color: 'green' }
                        ].map((service, idx) => (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if(service.link) {
                                router.push(service.link);
                              } else {
                                // Handle default routing for services
                                if(service.title === 'Find Doctors') {
                                  router.push('/user/doctors');
                                } else if(service.title === 'Hospitals') {
                                  router.push('/user/hospitals');
                                } else if(service.title === 'Medicines') {
                                  router.push('/user/medicines');
                                } else if(service.title === 'Lab Tests') {
                                  router.push('/user/lab-tests');
                                }
                              }
                            }}
                            className="flex-shrink-0 w-full sm:w-64 p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-slate-200 transition-all text-left group"
                          >
                            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center text-3xl mb-4">
                              {service.icon}
                            </div>
                            <p className="font-bold text-lg text-slate-900 mb-2">{service.title}</p>
                            <p className="text-base text-slate-600">{service.subtitle}</p>
                          </motion.button>
                        ))}
                      </Marquee>
                    </div>
                    <div className="flex flex-col gap-4 sm:hidden">
                      {[
                        { icon: '🩺', title: 'Find Doctors', subtitle: '500+ specialists', color: 'blue' },
                        { icon: '🏥', title: 'Hospitals', subtitle: 'Verified centers', color: 'green' },
                        { icon: '💊', title: 'Medicines', subtitle: 'Order online', color: 'blue' },
                        { icon: '🩹', title: 'Lab Tests', subtitle: 'At home', color: 'green' }
                      ].map((service, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if(service.link) {
                              router.push(service.link);
                            } else {
                              // Handle default routing for services
                              if(service.title === 'Find Doctors') {
                                router.push('/user/doctors');
                              } else if(service.title === 'Hospitals') {
                                router.push('/user/hospitals');
                              } else if(service.title === 'Medicines') {
                                router.push('/user/medicines');
                              } else if(service.title === 'Lab Tests') {
                                router.push('/user/lab-tests');
                              }
                            }
                          }}
                          className="w-full p-6 bg-white rounded-2xl shadow-sm border border-slate-200 transition-all text-left group"
                        >
                          <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center text-3xl mb-4">
                            {service.icon}
                          </div>
                          <p className="font-bold text-lg text-slate-900 mb-2">{service.title}</p>
                          <p className="text-base text-slate-600">{service.subtitle}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Section Separator */}
      <div className="h-px bg-gray-200 dark:bg-gray-800 w-full max-w-7xl mx-auto"></div>


      {/* Clinics/Patients mini-banner removed */}


      {/* How It Works Section */}
      <section className="py-12 sm:py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Simple steps to connect with healthcare
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Search, 
                title: 'Search', 
                description: 'Find doctors, hospitals, or book appointments',
                color: 'blue'
              },
              { 
                icon: Stethoscope, 
                title: 'Choose', 
                description: 'Select your preferred doctor or hospital',
                color: 'violet'
              },
              { 
                icon: Calendar, 
                title: 'Book & Consult', 
                description: 'Schedule appointment and get treated',
                color: 'green'
              }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="text-center"
              >
                <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 rounded-2xl flex items-center justify-center`}>
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Section Separator */}
      <div className="h-px bg-gray-200 dark:bg-gray-800 w-full max-w-7xl mx-auto"></div>


      {/* Specialties Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Stethoscope className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Popular Specialties
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Find doctors in your preferred specialty
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {[
              { name: 'Cardiology', icon: Heart, color: 'red' },
              { name: 'Dermatology', icon: Activity, color: 'amber' },
              { name: 'Pediatrics', icon: Users, color: 'emerald' },
              { name: 'Orthopedics', icon: Shield, color: 'blue' },
              { name: 'Neurology', icon: Activity, color: 'violet' },
              { name: 'Gynecology', icon: Users, color: 'pink' },
              { name: 'Dentistry', icon: Shield, color: 'gray' },
              { name: 'Ophthalmology', icon: Activity, color: 'cyan' },
              { name: 'ENT', icon: Activity, color: 'orange' },
              { name: 'Psychiatry', icon: Sparkles, color: 'purple' },
              { name: 'General Medicine', icon: Stethoscope, color: 'indigo' },
              { name: 'Diabetology', icon: Activity, color: 'sky' }
            ].map((specialty, idx) => (
              <motion.div
                key={specialty.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => router.push(`/search?q=${specialty.name.toLowerCase()}`)}
                className="qlinic-card p-6 shadow-lg hover:shadow-xl cursor-pointer transition-all text-center group card-hover"
              >
                <div className={`w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-${specialty.color}-500 to-${specialty.color}-600 rounded-xl flex items-center justify-center`}>
                  <specialty.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-[var(--qlinic-text)] group-hover:text-[var(--qlinic-primary)] transition-colors">
                  {specialty.name}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Section Separator */}
      <div className="h-px bg-gray-200 dark:bg-gray-800 w-full max-w-7xl mx-auto"></div>


      {/* Nearby Hospitals - NEW SECTION */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-blue-50 via-blue-50 to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Hospitals Near You
              </h2>
              {locationName && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{locationName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!userLocation ? (
                <Button 
                  onClick={getUserLocation}
                  disabled={locationLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      Enable Location
                    </>
                  )}
                </Button>
              ) : nearbyHospitals.length > 0 && (
                <button 
                  onClick={() => router.push('/user/hospitals')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
                >
                  View All
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>
          </div>


          {!userLocation ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700"
            >
              <Navigation className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Find Hospitals Near You
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Enable location to discover verified hospitals in your area with real-time availability
              </p>
              <Button 
                onClick={getUserLocation}
                disabled={locationLoading}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {locationLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Detecting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 mr-2" />
                    Enable Location
                  </>
                )}
              </Button>
            </motion.div>
          ) : nearbyHospitals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {nearbyHospitals.map((hospital, idx) => (
                <motion.div
                  key={hospital.id || hospital._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group"
                >
                      <Card className="h-full hover:shadow-2xl transition-all border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 overflow-hidden">
                    <CardContent className="p-0">
                      {/* Hospital Image */}
                      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/30 overflow-hidden">
                        {hospital.logo || hospital.image ? (
                          <Image
                            src={hospital.logo || hospital.image}
                            alt={hospital.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Building2 className="w-20 h-20 text-blue-600/30" />
                          </div>
                        )}

                        {/* Distance Badge */}
                        {hospital.distance && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-white/95 dark:bg-gray-900/95 text-blue-600 dark:text-blue-400 border-0 font-bold">
                              <MapPin className="w-3 h-3 mr-1" />
                              {hospital.distance.toFixed(1)} km
                            </Badge>
                          </div>
                        )}

                        {/* Rating Badge */}
                        {hospital.rating > 0 && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-yellow-100 dark:bg-yellow-900/80 text-yellow-700 dark:text-yellow-300 border-0 font-bold">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              {hospital.rating.toFixed(1)}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Hospital Info */}
                      <div className="p-5">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {hospital.name}
                        </h3>

                        <div className="space-y-2 mb-4">
                          {/* Location */}
                          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                            <span className="line-clamp-2">
                              {hospital.address || hospital.city || hospital.location || 'Location not available'}
                            </span>
                          </div>

                          {/* Specialties */}
                          {hospital.specialties && hospital.specialties.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Stethoscope className="w-4 h-4 flex-shrink-0 text-blue-600" />
                              <span className="truncate">
                                {hospital.specialties.slice(0, 2).join(', ')}
                                {hospital.specialties.length > 2 && ` +${hospital.specialties.length - 2}`}
                              </span>
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-4 pt-2">
                            {hospital.totalDoctors > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                <Users className="w-3.5 h-3.5" />
                                <span>{hospital.totalDoctors} Doctors</span>
                              </div>
                            )}
                            {hospital.establishedYear && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                <Award className="w-3.5 h-3.5" />
                                <span>Est. {hospital.establishedYear}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => router.push(`/user/hospitals/${hospital.id || hospital._id}`)}
                          >
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                          <Button 
                            variant="outline"
                            size="icon"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => window.open(`tel:${hospital.phone || hospital.contactNumber}`, '_self')}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Location Header with Map Icon */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Top Hospitals in Patna
                </h3>
                <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Patna, Bihar</span>
                </div>
              </div>
              
              {/* Recommended Popular Hospitals */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    id: 'patna-aiims',
                    name: 'AIIMS Patna',
                    logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
                    address: 'Phulwari Sharif, Patna, Bihar 801505',
                    rating: 4.8,
                    specialties: ['Cardiology', 'Neurology', 'Orthopedics'],
                    totalDoctors: 250,
                    establishedYear: 2012,
                    phone: '0612-2222222'
                  },
                  {
                    id: 'igims-patna',
                    name: 'Indira Gandhi Institute of Medical Sciences',
                    logo: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop',
                    address: 'Sheikhpura, Patna, Bihar 800014',
                    rating: 4.6,
                    specialties: ['General Medicine', 'Pediatrics', 'Surgery'],
                    totalDoctors: 180,
                    establishedYear: 1999,
                    phone: '0612-2255225'
                  },
                  {
                    id: 'pmch-patna',
                    name: 'Patna Medical College & Hospital',
                    logo: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&h=400&fit=crop',
                    address: 'Fraser Road, Patna, Bihar 800001',
                    rating: 4.4,
                    specialties: ['Emergency', 'Dermatology', 'Psychiatry'],
                    totalDoctors: 200,
                    establishedYear: 1925,
                    phone: '0612-2236666'
                  }
                ].map((hospital, idx) => (
                  <motion.div
                    key={hospital.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-2xl transition-all border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 overflow-hidden">
                      <CardContent className="p-0">
                        {/* Hospital Image */}
                        <div className="relative h-40 bg-gradient-to-br from-blue-100 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/30 overflow-hidden">
                          <Image
                            src={hospital.logo}
                            alt={hospital.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Building2 className="w-16 h-16 text-white/70" />
                          </div>
                          
                          {/* Rating Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-yellow-100 dark:bg-yellow-900/80 text-yellow-700 dark:text-yellow-300 border-0 font-bold">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              {hospital.rating}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Hospital Info */}
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {hospital.name}
                          </h3>
                          
                          <div className="space-y-2 mb-4">
                            {/* Location */}
                            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                              <span className="line-clamp-2">
                                {hospital.address}
                              </span>
                            </div>
                            
                            {/* Specialties */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Stethoscope className="w-4 h-4 flex-shrink-0 text-blue-600" />
                              <span className="truncate">
                                {hospital.specialties.join(', ')}
                              </span>
                            </div>
                            
                            {/* Stats */}
                            <div className="flex items-center gap-4 pt-2">
                              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                <Users className="w-3.5 h-3.5" />
                                <span>{hospital.totalDoctors} Doctors</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                <Award className="w-3.5 h-3.5" />
                                <span>Est. {hospital.establishedYear}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => router.push(`/user/hospitals/${hospital.id}`)}
                            >
                              View Details
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            <Button 
                              variant="outline"
                              size="icon"
                              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              onClick={() => window.open(`tel:${hospital.phone}`, '_self')}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              
              <div className="text-center pt-4">
                <Button 
                  onClick={() => router.push('/user/hospitals')}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Browse All Hospitals in India
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </section>


      {/* Section Separator */}
      <div className="h-px bg-gray-200 dark:bg-gray-800 w-full max-w-7xl mx-auto"></div>


      {/* Top rated doctors near you */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">Top rated doctors near you</div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 flex items-center gap-3">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous"
                onClick={() => {
                  const el = carouselRef.current
                  if (!el) return
                  el.scrollBy({ left: -Math.round(el.clientWidth / 3), behavior: 'smooth' })
                }}
                className="p-2 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:bg-blue-50 hover:border-blue-300"
              >
                <ChevronRight className="w-5 h-5 rotate-180 text-slate-700" />
              </button>
              <button
                aria-label="Next"
                onClick={() => {
                  const el = carouselRef.current
                  if (!el) return
                  el.scrollBy({ left: Math.round(el.clientWidth / 3), behavior: 'smooth' })
                }}
                className="p-2 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:bg-blue-50 hover:border-blue-300"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>

          <div
            ref={carouselRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative overflow-hidden"
          >
            <div className="flex gap-4 py-2 px-2 md:px-4 overflow-x-auto scrollbar-hide items-stretch" style={{scrollBehavior: 'smooth'}}>
              {displayDoctors.map((doc, idx) => (
                <article key={doc._id || idx} data-doctor-card className="flex-shrink-0 w-72 sm:w-80 lg:w-80" >
                  <motion.div whileHover={{ scale: 1.03 }} className="h-full">
                    <Card className="h-full border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-50 to-green-50 flex items-center justify-center overflow-hidden border border-slate-100">
                            <Image src={doc.profileImage} alt={`${doc.firstName} ${doc.lastName}`} width={80} height={80} className="object-cover w-20 h-20 rounded-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">Dr. {doc.firstName} {doc.lastName}</h3>
                            <p className="text-xs text-sky-600 mt-1 truncate">{doc.doctorProfile?.specialization}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1 text-sm text-yellow-600">
                                <Star className="w-4 h-4" />
                                <span className="font-bold">{(doc.doctorProfile?.rating || 4.8).toFixed(1)}</span>
                              </div>
                              <span className="text-xs text-slate-500">({doc.doctorProfile?.reviews || 120} reviews)</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-2 truncate">{doc.hospitalName} – {doc.location}</p>
                            <p className="text-xs text-slate-500 mt-2">{doc.doctorProfile?.experience}+ years experience • Trusted by {doc.doctorProfile?.patients?.toLocaleString?.() || '2,000+'} patients</p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                          <Button onClick={() => router.push(`/user/doctors/${doc._id}`)} className="flex-1 bg-sky-600 hover:bg-sky-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-102">Book Appointment</Button>
                          <button onClick={() => router.push(`/user/doctors/${doc._id}`)} className="text-sm text-sky-600 underline hover:text-sky-700">View Profile</button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </article>
              ))}
            </div>

            {/* Dots */}
            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-2 flex items-center gap-2">
              {displayDoctors.map((_, i) => (
                <button key={i} onClick={() => {
                  const el = carouselRef.current
                  const card = el?.querySelector('[data-doctor-card]')
                  if (el && card) {
                    const cardW = card.clientWidth + parseInt(getComputedStyle(card).marginRight || 0)
                    el.scrollTo({ left: i * cardW, behavior: 'smooth' })
                  }
                }} className={`w-2 h-2 rounded-full ${i === activeDot ? 'bg-blue-600' : 'bg-slate-300'}`} aria-label={`Go to slide ${i+1}`} />
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Social Proof - Testimonials */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Heart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Trusted by Thousands
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Hear what our patients and doctors have to say
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                quote: "QLINIC made booking so easy. Got an appointment with a cardiologist within minutes!",
                name: "Priya Sharma",
                role: "Patient",
                location: "Delhi",
                avatar: "PS"
              },
              {
                quote: "As a doctor, I appreciate the streamlined process. QLINIC helps me manage my schedule efficiently.",
                name: "Dr. Rajesh Kumar",
                role: "Cardiologist",
                location: "Mumbai",
                avatar: "RK"
              },
              {
                quote: "The platform is intuitive and reliable. My family trusts QLINIC for all our healthcare needs.",
                name: "Amit Patel",
                role: "Patient",
                location: "Bangalore",
                avatar: "AP"
              }
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                whileHover={{ y: -10 }}
                className="qlinic-card p-6 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4" style={{ background: 'linear-gradient(135deg, var(--qlinic-primary), #6D28D9)' }}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--qlinic-text)]">{testimonial.name}</h4>
                    <p className="text-sm text-[var(--qlinic-text-muted)]">
                      {testimonial.role} • {testimonial.location}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">"{testimonial.quote}"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: "10K+", label: "Patients", icon: Users },
                { number: "200+", label: "Doctors", icon: Stethoscope },
                { number: "50+", label: "Cities", icon: MapPin },
                { number: "99%", label: "Satisfaction", icon: Heart }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <stat.icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            {[
              { icon: Shield, text: "ISO Certified Data Security", color: "green" },
              { icon: Award, text: "HIPAA-like Standards", color: "blue" },
              { icon: Lock, text: "End-to-End Encryption", color: "purple" },
              { icon: CheckCircle, text: "100% Secure", color: "indigo" }
            ].map((badge, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <badge.icon className={`w-4 h-4 text-${badge.color}-600 dark:text-${badge.color}-400`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {badge.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Separator */}
      <div className="h-px bg-gray-200 dark:bg-gray-800 w-full max-w-7xl mx-auto"></div>

      {/* Features */}
      <section className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3 sm:mb-4">
              Why Choose QLINIC?
            </h2>
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400">
              Healthcare made simple and accessible
            </p>
          </motion.div>


          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {[
              { icon: Zap, title: 'Instant Booking', desc: 'Book in 30 seconds', color: 'blue' },
              { icon: Shield, title: '100% Secure', desc: 'Your data is safe', color: 'blue' },
              { icon: TrendingUp, title: 'Track Health', desc: 'Monitor progress', color: 'violet' },
              { icon: MapPin, title: 'Nearby Hospitals', desc: 'Find hospitals near you', color: 'orange' },
              { icon: Clock, title: '24/7 Support', desc: 'Always available', color: 'pink' },
              { icon: Award, title: 'Top Doctors', desc: 'Verified experts', color: 'indigo' }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="p-6 sm:p-8 qlinic-card sm:rounded-3xl hover:border-[var(--qlinic-primary)] transition-all card-hover"
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6`}>
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-[var(--qlinic-text)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-[var(--qlinic-text-muted)]">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Section Separator */}
      <div className="h-px bg-gray-200 dark:bg-gray-800 w-full max-w-7xl mx-auto"></div>


      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8 sm:mb-10">
              Join {stats?.totalPatients ? `${(stats.totalPatients/1000).toFixed(0)}K+` : '10K+'} patients experiencing better healthcare
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/sign-up')}
              className="px-8 sm:px-12 py-4 sm:py-5 bg-white text-blue-600 rounded-2xl font-black text-lg sm:text-xl shadow-2xl inline-flex items-center gap-2 sm:gap-3"
            >
              Book Your First Appointment
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          </motion.div>
        </div>
      </section>


      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}


export default HomePage
