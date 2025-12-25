// src/components/home/NearbyHospitals.jsx
'use client'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, MapPin, ArrowRight, Hospital } from 'lucide-react'
import Link from 'next/link'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
}

const item = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 }
}

export default function NearbyHospitals() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation')
    if (savedLocation) {
      const location = JSON.parse(savedLocation)
      setUserLocation(location)
      fetchNearbyHospitals(location)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchNearbyHospitals = async (location) => {
    try {
      const params = new URLSearchParams({
        lat: location.latitude,
        lng: location.longitude,
        radius: '15',
        type: 'hospitals',
        limit: '6'
      })

      const response = await fetch(`/api/search/nearby?${params}`)
      const data = await response.json()

      if (data.success && data.results.hospitals) {
        setHospitals(data.results.hospitals)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!userLocation) return null

  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Hospitals Near You
            </h2>
            <p className="text-slate-600">
              Verified hospitals within 15 km
            </p>
          </div>
          <Link href="/patient/hospitals">
            <Button variant="outline">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : hospitals.length > 0 ? (
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {hospitals.map((hospital) => (
              <motion.div
                key={hospital._id}
                variants={item}
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3, type: "spring", stiffness: 300 }
                }}
              >
                <Card className="hover:shadow-2xl transition-shadow h-full overflow-hidden">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="h-48 bg-slate-100 overflow-hidden"
                  >
                    {hospital.images?.[0] ? (
                      <img 
                        src={hospital.images[0]} 
                        alt={hospital.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Hospital className="w-16 h-16 text-slate-300" />
                      </div>
                    )}
                  </motion.div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl text-slate-900 mb-2">
                      {hospital.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">4.5</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span>{hospital.address?.city}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card>
              <CardContent className="p-12 text-center">
                <Hospital className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg text-slate-600">No hospitals found nearby</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  )
}
