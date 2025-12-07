// app/hospital/profile/route.js (or wherever you call this)
'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import ReceptionDashboard from '@/components/hospital/ReceptionDashboard'

export default function HospitalAdminPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [hospital, setHospital] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && (!user || user.publicMetadata?.role !== 'hospital_admin')) {
      router.push('/sign-in?role=hospital_admin')
    } else if (isLoaded) {
      fetchHospital()
    }
  }, [isLoaded, user, router])

  const fetchHospital = async () => {
    try {
      const response = await fetch('/api/hospital/profile')
      const data = await response.json()
      
      if (data.hospital) {
        setHospital(data.hospital)
      }
    } catch (error) {
      console.error('Error fetching hospital:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['hospital_admin']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        {/* ✅ PASS HOSPITAL PROP HERE */}
        <ReceptionDashboard hospital={hospital} />
      </div>
    </ProtectedRoute>
  )
}
