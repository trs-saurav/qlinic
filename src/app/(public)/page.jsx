"use client"
import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Image from 'next/image'
import { 
  ArrowRight, Zap, Shield, Star, TrendingUp, CheckCircle, 
  Sparkles, Activity, Heart, Stethoscope, ChevronRight, MapPin,
  Building2, Navigation, Clock, Phone, Award, Users, Calendar,
  Loader2, Search, TrendingDown, Lock
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
    <div ref={containerRef} className={`flex flex-nowrap overflow-hidden ${className}`}>
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
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-24 sm:pt-32 pb-16 sm:pb-20 overflow-hidden">
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
            className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full blur-3xl"
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
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 sm:mb-6"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400">
                  India's #1 Healthcare Platform
                </span>
              </motion.div>


              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
                Your Health,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-600">
                  Instantly Connected
                </span>
              </h1>


              <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed">
                Book appointments with top doctors, get instant consultations, and access your health records - all in one place.
              </p>


              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/sign-up')}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 text-base sm:text-lg flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>


                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/aboutus')}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-base sm:text-lg"
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
                    style={{ filter: 'drop-shadow(0 25px 25px rgba(0, 100, 255, 0.3))' }}
                    aria-label="Friendly AI doctor assistant mascot for QLINIC healthcare platform"
                  />
                </div>

                {/* Clean Solid Floating Stats */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -right-4 top-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Always Available</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">24/7</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -left-4 bottom-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">AI Secured</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Safe</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Quick Services */}
      <section className="py-12 sm:py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 sm:mb-8"
          >
            What are you looking for?
          </motion.h2>

          <div className="relative overflow-hidden py-4">
            <div className="flex flex-nowrap gap-4">
              <div className="flex justify-center w-full">
                <div className="flex justify-center w-full">
                  <div className="relative w-full max-w-4xl overflow-hidden">
                    <Marquee pauseOnHover={true} duration={5}>
                      {[
                        { icon: '🩺', title: 'Find Doctors', subtitle: '500+ specialists', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-500' },
                        { icon: '🏥', title: 'Hospitals', subtitle: 'Verified centers', color: 'from-violet-500 to-violet-600', bgColor: 'bg-violet-500' },
                        { icon: '💊', title: 'Medicines', subtitle: 'Order online', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-500' },
                        { icon: '🩹', title: 'Lab Tests', subtitle: 'At home', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-500' }
                      ].map((service, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push(service.link)}
                          className="flex-shrink-0 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 border-gray-200 dark:border-gray-700 transition-all text-left group"
                        >
                          <div className={`w-20 h-20 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center text-3xl mb-4`}>
                            {service.icon}
                          </div>
                          <p className="font-bold text-lg text-gray-900 dark:text-white mb-2">{service.title}</p>
                          <p className="text-base text-gray-500 dark:text-gray-400">{service.subtitle}</p>
                        </motion.button>
                      ))}
                    </Marquee>
                  </div>
                </div>
              </div>
            </div>
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
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
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
                  className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 hover:gap-3 transition-all"
                >
                  View All
                  <ChevronRight className="w-5 h-5" />
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


      {/* Top Doctors */}
      {topDoctors.length > 0 && (
        <section className="py-12 sm:py-16 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                Top Rated Doctors
              </h2>
              <button 
                onClick={() => router.push('/user/doctors')}
                className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 hover:gap-3 transition-all text-sm sm:text-base"
              >
                View All
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>


            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
              {[
                {
                  _id: 'doc-1',
                  firstName: 'Rajesh',
                  lastName: 'Kumar',
                  profileImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
                  doctorProfile: {
                    specialization: 'Cardiology',
                    rating: 4.8,
                    experience: 15,
                    consultationFee: 800
                  }
                },
                {
                  _id: 'doc-2',
                  firstName: 'Priya',
                  lastName: 'Sharma',
                  profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
                  doctorProfile: {
                    specialization: 'Pediatrics',
                    rating: 4.9,
                    experience: 12,
                    consultationFee: 600
                  }
                },
                {
                  _id: 'doc-3',
                  firstName: 'Amit',
                  lastName: 'Patel',
                  profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face',
                  doctorProfile: {
                    specialization: 'Orthopedics',
                    rating: 4.7,
                    experience: 18,
                    consultationFee: 900
                  }
                },
                {
                  _id: 'doc-4',
                  firstName: 'Sneha',
                  lastName: 'Gupta',
                  profileImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=400&fit=crop&crop=face',
                  doctorProfile: {
                    specialization: 'Dermatology',
                    rating: 4.6,
                    experience: 10,
                    consultationFee: 700
                  }
                }
              ].map((doctor, idx) => (
                <motion.div
                  key={doctor._id}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="flex-shrink-0 w-72 sm:w-80 snap-center"
                >
                  <Card className="h-full hover:shadow-2xl transition-shadow border-2 border-blue-500">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4 mb-4">
                        <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-blue-500 flex-shrink-0">
                          <AvatarImage src={doctor.profileImage} />
                          <AvatarFallback className="text-lg sm:text-xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                            {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </h3>
                          <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mb-2 truncate">
                            {doctor.doctorProfile?.specialization}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
                                {doctor.doctorProfile?.rating?.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {doctor.doctorProfile?.experience}+ years
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Consultation</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            ₹{doctor.doctorProfile?.consultationFee}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => router.push(`/user/doctors/${doctor._id}`)}
                        >
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* Social Proof - Testimonials */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
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
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                className="p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all"
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6`}>
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{feature.desc}</p>
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
