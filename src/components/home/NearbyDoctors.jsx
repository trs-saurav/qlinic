// src/components/home/NearbyDoctors.jsx
'use client'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, MapPin, ArrowRight, Stethoscope } from 'lucide-react'
import Link from 'next/link'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function NearbyDoctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation')
    if (savedLocation) {
      const location = JSON.parse(savedLocation)
      setUserLocation(location)
      fetchNearbyDoctors(location)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchNearbyDoctors = async (location) => {
    try {
      const params = new URLSearchParams({
        lat: location.latitude,
        lng: location.longitude,
        radius: '10',
        type: 'doctors',
        limit: '6'
      })

      const response = await fetch(`/api/search/nearby?${params}`)
      const data = await response.json()

      if (data.success && data.results.doctors) {
        setDoctors(data.results.doctors)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!userLocation) return null

  return (
    <section className="py-16 bg-white">
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
              Doctors Near You
            </h2>
            <p className="text-slate-600">
              Top-rated doctors within 10 km radius
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
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : doctors.length > 0 ? (
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {doctors.map((doctor, index) => (
              <motion.div
                key={doctor._id}
                variants={item}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <Card className="hover:shadow-xl transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Avatar className="w-16 h-16 border-2 border-emerald-500">
                          <AvatarImage src={doctor.profileImage} />
                          <AvatarFallback>
                            {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </h3>
                        <p className="text-sm text-emerald-600">
                          {doctor.doctorProfile?.specialization}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">4.5</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-lg font-bold text-emerald-600">
                        ₹{doctor.doctorProfile?.consultationFee || 500}
                      </p>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        Available
                      </Badge>
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
                <Stethoscope className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg text-slate-600">No doctors found nearby</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  )
}
