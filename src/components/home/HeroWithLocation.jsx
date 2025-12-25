// src/components/home/HeroWithLocation.jsx
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import UniversalSearch from '@/components/UniversalSearch'
import { 
  MapPin, Navigation, Loader2, CheckCircle, 
  AlertCircle, Stethoscope, Hospital, Heart, Users
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function HeroWithLocation({ stats }) {
  const [locationStatus, setLocationStatus] = useState('idle')
  const [userLocation, setUserLocation] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [showLocationModal, setShowLocationModal] = useState(false)

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation')
    if (savedLocation) {
      const location = JSON.parse(savedLocation)
      setUserLocation(location)
      setLocationName(location.name)
      setLocationStatus('success')
    } else {
      setTimeout(() => setShowLocationModal(true), 1000)
    }
  }, [])

  const handleLocationRequest = () => {
    setLocationStatus('loading')
    setShowLocationModal(false)

    if (!navigator.geolocation) {
      setLocationStatus('error')
      toast.error('Geolocation is not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const locationName = await getLocationName(latitude, longitude)
          
          const locationData = {
            latitude,
            longitude,
            name: locationName,
            timestamp: new Date().toISOString()
          }

          setUserLocation(locationData)
          setLocationName(locationName)
          setLocationStatus('success')
          
          localStorage.setItem('userLocation', JSON.stringify(locationData))
          toast.success(`Location detected: ${locationName}`)
        } catch (error) {
          console.error('Location name error:', error)
          setLocationStatus('success')
          setUserLocation({ latitude, longitude, name: 'Your Location' })
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        setLocationStatus('error')
        toast.error('Unable to get your location')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const getLocationName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      const data = await response.json()
      
      if (data.address) {
        const city = data.address.city || data.address.town || data.address.village
        const state = data.address.state
        return city ? `${city}, ${state}` : state || 'Your Location'
      }
      return 'Your Location'
    } catch (error) {
      return 'Your Location'
    }
  }

  // Format numbers for display
  const formatNumber = (num) => {
    if (!num) return '0'
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // Stats data with real values or fallback
  const statsData = [
    { 
      icon: Stethoscope, 
      value: stats?.totalDoctors ? `${stats.totalDoctors}+` : '500+', 
      label: 'Doctors', 
      color: 'emerald', 
      delay: 0 
    },
    { 
      icon: Hospital, 
      value: stats?.totalHospitals ? `${stats.totalHospitals}+` : '100+', 
      label: 'Hospitals', 
      color: 'blue', 
      delay: 0.1 
    },
    { 
      icon: Users, 
      value: stats?.totalPatients ? `${formatNumber(stats.totalPatients)}+` : '10K+', 
      label: 'Patients', 
      color: 'purple', 
      delay: 0.2 
    },
    { 
      icon: Heart, 
      value: stats?.satisfactionRate || '98%', 
      label: 'Satisfaction', 
      color: 'pink', 
      delay: 0.3 
    }
  ]

  return (
    <>
      {/* Location Permission Modal with Motion */}
      <AnimatePresence>
        {showLocationModal && locationStatus === 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Card className="max-w-md w-full">
                <CardContent className="p-8">
                  <div className="text-center">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <MapPin className="w-8 h-8 text-emerald-600" />
                    </motion.div>
                    
                    <motion.h2 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3"
                    >
                      Enable Location Access
                    </motion.h2>
                    
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-slate-600 dark:text-slate-400 mb-6"
                    >
                      We need your location to show nearby doctors and hospitals.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        onClick={handleLocationRequest}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                        disabled={locationStatus === 'loading'}
                      >
                        {locationStatus === 'loading' ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Detecting...
                          </>
                        ) : (
                          <>
                            <Navigation className="w-5 h-5 mr-2" />
                            Allow Location Access
                          </>
                        )}
                      </Button>
                    </motion.div>

                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-xs text-slate-500 dark:text-slate-400 mt-4"
                    >
                      We'll only use your location to show relevant healthcare providers
                    </motion.p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-20 overflow-hidden">
        {/* Animated Background Blobs */}
        <motion.div 
          className="absolute inset-0 opacity-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
        >
          <motion.div 
            animate={{ 
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-10 left-10 w-72 h-72 bg-emerald-500 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              x: [0, -50, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 25, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"
          />
        </motion.div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Location Status Banner */}
          <AnimatePresence mode="wait">
            {locationStatus === 'success' && userLocation && (
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="max-w-4xl mx-auto mb-6"
              >
                <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </motion.div>
                        <div>
                          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                            Showing results near you
                          </p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {locationName}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleLocationRequest}
                        variant="ghost"
                        size="sm"
                        className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200"
                      >
                        Change
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {locationStatus === 'error' && (
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="max-w-4xl mx-auto mb-6"
              >
                <Card className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                            Location access denied
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            Enable location to see nearby providers
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleLocationRequest}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6"
            >
              Find the Best Healthcare
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="block text-emerald-600 dark:text-emerald-400 mt-2"
              >
                Near You
              </motion.span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-slate-600 dark:text-slate-300 mb-8"
            >
              {locationStatus === 'success' && userLocation
                ? `Discover top-rated doctors and hospitals in ${locationName}`
                : 'Search doctors, hospitals, and specialists. Book appointments instantly.'
              }
            </motion.p>

            {/* Universal Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <UniversalSearch 
                variant="hero" 
                defaultLocation={userLocation}
              />
            </motion.div>

            {/* Location Request Button */}
            {locationStatus === 'idle' && !showLocationModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={handleLocationRequest}
                  variant="outline"
                  size="lg"
                  className="mt-6"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  Detect My Location
                </Button>
              </motion.div>
            )}

            {/* Stats Grid with Real Data */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
            >
              {statsData.map((stat, index) => {
                const IconComponent = stat.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + stat.delay, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    className="text-center"
                  >
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`w-12 h-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-full flex items-center justify-center mx-auto mb-2`}
                    >
                      <IconComponent className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    </motion.div>
                    <motion.p 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1 + stat.delay + 0.2, type: "spring" }}
                      className="text-2xl font-bold text-slate-900 dark:text-white"
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
