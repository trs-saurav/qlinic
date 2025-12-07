// app/doctor/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import DoctorDashboard from '@/components/doctor/DoctorDashboard'

export default function DoctorPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && (!user || user.publicMetadata?.role !== 'doctor')) {
      router.push('/sign-in?role=doctor')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    // <ProtectedRoute allowedRoles={['doctor']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <DoctorDashboard />
      </div>
    // </ProtectedRoute>
  )
}
