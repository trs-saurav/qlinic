"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  ArrowRight, Zap, Shield, Star, TrendingUp, CheckCircle, 
  Sparkles, Activity, Heart, Stethoscope, ChevronRight, MapPin,
  Building2, Navigation, Clock, Phone, Award, Users, Calendar,
  Loader2, Search, TrendingDown
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'


const HomePage = () => {
  const router = useRouter()
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
    <div className="min-h-screen bg-white dark:bg-gray-950">

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
                Healthcare in
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-600">
                  Minutes
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
                  <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                    {stats?.totalPatients ? `${(stats.totalPatients/1000).toFixed(0)}K+` : '10K+'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Happy Patients</p>
                </div>
                <div className="w-px h-10 sm:h-12 bg-gray-300 dark:bg-gray-700" />
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                    {stats?.totalDoctors || '500'}+
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Expert Doctors</p>
                </div>
                <div className="w-px h-10 sm:h-12 bg-gray-300 dark:bg-gray-700" />
                <div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-400 text-yellow-400" />
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">4.8</p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">User Rating</p>
                </div>
              </div>
            </motion.div>


            {/* Right Content - Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main Card */}
                <motion.div
                  whileHover={{ y: -10 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                      <Stethoscope className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Next Available</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">In 15 minutes</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 rounded-lg" />
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        </div>
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      </div>
                    ))}
                  </div>
                </motion.div>


                {/* Floating Stats */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -right-4 top-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Avg Response</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">2 mins</p>
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
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">100% Secure</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Verified</p>
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


          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: '🩺', title: 'Find Doctors', subtitle: '500+ specialists', color: 'from-blue-500 to-blue-600', link: '/patient/doctors' },
              { icon: '🏥', title: 'Hospitals', subtitle: 'Verified centers', color: 'from-violet-500 to-violet-600', link: '/patient/hospitals' },
              { icon: '💊', title: 'Medicines', subtitle: 'Order online', color: 'from-blue-500 to-blue-600', link: '/medicines' },
              { icon: '🩹', title: 'Lab Tests', subtitle: 'At home', color: 'from-orange-500 to-orange-600', link: '/lab-tests' }
            ].map((service, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(service.link)}
                className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl sm:rounded-3xl border-2 border-gray-200 dark:border-gray-800 transition-all text-left group"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${service.color} rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">{service.title}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{service.subtitle}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>


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
                  onClick={() => router.push('/patient/hospitals')}
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
                            onClick={() => router.push(`/patient/hospitals/${hospital.id || hospital._id}`)}
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
              className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700"
            >
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No hospitals found nearby
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try expanding your search radius or check back later
              </p>
              <Button 
                onClick={() => router.push('/patient/hospitals')}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Browse All Hospitals
              </Button>
            </motion.div>
          )}
        </div>
      </section>


      {/* Top Doctors */}
      {topDoctors.length > 0 && (
        <section className="py-12 sm:py-16 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                Top Rated Doctors
              </h2>
              <button 
                onClick={() => router.push('/patient/doctors')}
                className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 hover:gap-3 transition-all text-sm sm:text-base"
              >
                View All
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>


            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
              {topDoctors.map((doctor, idx) => (
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
                                {doctor.doctorProfile?.rating?.toFixed(1) || '4.5'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {doctor.doctorProfile?.experience || 5}+ years
                            </span>
                          </div>
                        </div>
                      </div>


                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Consultation</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            ₹{doctor.doctorProfile?.consultationFee || 500}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => router.push(`/patient/doctors/${doctor._id}`)}
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
