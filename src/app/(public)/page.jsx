// src/app/(public)/page.jsx
"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { 
  ArrowRight, Zap, Shield, Star, TrendingUp, CheckCircle, 
  Sparkles, Activity, Heart, Stethoscope, ChevronRight
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const HomePage = () => {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [topDoctors, setTopDoctors] = useState([])
  const [featuredHospitals, setFeaturedHospitals] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHomeData()
  }, [])

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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-32 pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full blur-3xl"
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  India's #1 Healthcare Platform
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                Healthcare in
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
                  Minutes
                </span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Book appointments with top doctors, get instant consultations, and access your health records - all in one place.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/sign-up')}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 text-lg flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/about')}
                  className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-lg"
                >
                  Learn More
                </motion.button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 flex items-center gap-8">
                <div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">
                    {stats?.totalPatients ? `${(stats.totalPatients/1000).toFixed(0)}K+` : '10K+'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Happy Patients</p>
                </div>
                <div className="w-px h-12 bg-gray-300 dark:bg-gray-700" />
                <div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">
                    {stats?.totalDoctors || '500'}+
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expert Doctors</p>
                </div>
                <div className="w-px h-12 bg-gray-300 dark:bg-gray-700" />
                <div>
                  <div className="flex items-center gap-1">
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    <p className="text-3xl font-black text-gray-900 dark:text-white">4.8</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">User Rating</p>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                {/* Main Card */}
                <motion.div
                  whileHover={{ y: -10 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
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
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
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
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
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
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-8"
          >
            What are you looking for?
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🩺', title: 'Find Doctors', subtitle: '500+ specialists', color: 'from-blue-500 to-blue-600', link: '/doctors' },
              { icon: '🏥', title: 'Hospitals', subtitle: 'Verified centers', color: 'from-violet-500 to-violet-600', link: '/hospitals' },
              { icon: '💊', title: 'Medicines', subtitle: 'Order online', color: 'from-emerald-500 to-emerald-600', link: '/medicines' },
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
                className="p-6 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-800 transition-all text-left group"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <p className="font-bold text-gray-900 dark:text-white mb-1">{service.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{service.subtitle}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Top Doctors */}
      {topDoctors.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                Top Rated Doctors
              </h2>
              <button 
                onClick={() => router.push('/doctors')}
                className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2 hover:gap-3 transition-all"
              >
                View All
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {topDoctors.map((doctor, idx) => (
                <motion.div
                  key={doctor._id}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="flex-shrink-0 w-72 snap-center"
                >
                  <Card className="h-full hover:shadow-2xl transition-shadow border-2">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-16 h-16 border-4 border-emerald-500">
                          <AvatarImage src={doctor.profileImage} />
                          <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                            {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </h3>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2">
                            {doctor.doctorProfile?.specialization}
                          </p>
                          <div className="flex items-center gap-2">
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
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            ₹{doctor.doctorProfile?.consultationFee || 500}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => router.push(`/doctors/${doctor._id}`)}
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
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
              Why Choose QLINIC?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Healthcare made simple and accessible
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'Instant Booking', desc: 'Book in 30 seconds', color: 'emerald' },
              { icon: Shield, title: '100% Secure', desc: 'Your data is safe', color: 'blue' },
              { icon: TrendingUp, title: 'Track Health', desc: 'Monitor progress', color: 'violet' }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700"
              >
                <div className={`w-16 h-16 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-500 via-emerald-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join {stats?.totalPatients ? `${(stats.totalPatients/1000).toFixed(0)}K+` : '10K+'} patients experiencing better healthcare
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/sign-up')}
              className="px-12 py-5 bg-white text-emerald-600 rounded-2xl font-black text-xl shadow-2xl inline-flex items-center gap-3"
            >
              Book Your First Appointment
              <ArrowRight className="w-6 h-6" />
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
