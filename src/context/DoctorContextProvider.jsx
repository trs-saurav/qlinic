'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import toast from 'react-hot-toast'

const DoctorContext = createContext(undefined)

export const useDoctor = () => {
  const ctx = useContext(DoctorContext)
  if (!ctx) throw new Error('useDoctor must be used within DoctorProvider')
  return ctx
}

export function DoctorProvider({ children }) {
  const { user, isLoaded } = useUser()
  const didInitRef = useRef(false)

  // ================= Core Doctor =================
  const [doctor, setDoctor] = useState(null)
  const [doctorLoading, setDoctorLoading] = useState(true)
  const [doctorError, setDoctorError] = useState(null)

  // ================= Dashboard =================
  const [dashboard, setDashboard] = useState({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedThisWeek: 0,
    pendingHospitalInvites: 0,
  })
  const [dashboardLoading, setDashboardLoading] = useState(false)

  // ================= Appointments =================
  const [appointments, setAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [appointmentsFilter, setAppointmentsFilter] = useState('today')

  // ================= Affiliations =================
  const [affiliations, setAffiliations] = useState([])
  const [affiliationsLoading, setAffiliationsLoading] = useState(false)

  // ================= Notifications =================
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // ================= Fetchers =================

  const fetchDoctorProfile = useCallback(async () => {
    console.log('🚀 fetchDoctorProfile called, user:', user?.id)
    
    if (!user) {
      console.log('❌ No user, returning')
      setDoctorLoading(false)
      return
    }

    try {
      setDoctorLoading(true)
      setDoctorError(null)

      console.log('📡 Fetching /api/doctor/profile...')
      const res = await fetch('/api/doctor/profile', {
        headers: { Accept: 'application/json' },
      })
      const data = await res.json()

      console.log('📊 Profile response:', { status: res.status, data })

      if (!res.ok) {
        setDoctor(null)
        setDoctorError(data?.error || 'Failed to load doctor profile')
        return
      }

      // ✅ Handle both 'profile' and 'doctor' keys
      const doctorData = data?.profile || data?.doctor || null
      console.log('✅ Setting doctor:', doctorData)
      setDoctor(doctorData)
    } catch (err) {
      console.error('❌ fetchDoctorProfile:', err)
      setDoctor(null)
      setDoctorError('Failed to load doctor profile')
      toast.error('Failed to load doctor profile')
    } finally {
      setDoctorLoading(false)
    }
  }, [user])

  const fetchDoctorDashboard = useCallback(async () => {
    if (!doctor?._id) return
    try {
      setDashboardLoading(true)
      const res = await fetch('/api/doctor/dashboard', { 
        headers: { Accept: 'application/json' } 
      })
      const data = await res.json()
      
      if (res.ok) {
        setDashboard(data.dashboard || dashboard)
      }
    } catch (err) {
      console.error('❌ fetchDoctorDashboard:', err)
    } finally {
      setDashboardLoading(false)
    }
  }, [doctor?._id])

  const fetchAppointments = useCallback(
    async (filter = 'today') => {
      if (!doctor?._id) return
      try {
        setAppointmentsLoading(true)
        const params = new URLSearchParams({ filter })
        const res = await fetch(`/api/doctor/appointments?${params}`, {
          headers: { Accept: 'application/json' },
        })
        const data = await res.json()

        if (!res.ok) {
          toast.error(data?.error || 'Failed to load appointments')
          return
        }

        setAppointments(data.appointments || [])
        setAppointmentsFilter(filter)
      } catch (err) {
        console.error('❌ fetchAppointments:', err)
        toast.error('Failed to load appointments')
      } finally {
        setAppointmentsLoading(false)
      }
    },
    [doctor?._id]
  )

  const fetchAffiliations = useCallback(async () => {
    console.log('🔄 fetchAffiliations called, doctor:', doctor?._id)
    
    if (!doctor?._id) {
      console.log('❌ No doctor ID, skipping affiliations fetch')
      return
    }
    
    try {
      setAffiliationsLoading(true)
      const res = await fetch('/api/doctor/affiliations', {
        headers: { Accept: 'application/json' },
      })
      const data = await res.json()

      console.log('✅ Affiliations response:', { status: res.status, data })

      if (!res.ok) {
        console.error('❌ Affiliations error:', data?.error)
        toast.error(data?.error || 'Failed to load affiliations')
        setAffiliations([])
        return
      }

      setAffiliations(data.affiliations || [])
    } catch (err) {
      console.error('❌ fetchAffiliations exception:', err)
      toast.error('Failed to load affiliations')
      setAffiliations([])
    } finally {
      setAffiliationsLoading(false)
    }
  }, [doctor?._id])

  const fetchNotifications = useCallback(async () => {
    if (!doctor?._id) return
    try {
      const res = await fetch('/api/doctor/notifications', {
        headers: { Accept: 'application/json' },
      })
      const data = await res.json()

      if (res.ok) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('❌ fetchNotifications:', err)
    }
  }, [doctor?._id])

  // ================= Actions =================

  const updateDoctorProfile = useCallback(async (updates) => {
    try {
      const res = await fetch('/api/doctor/profile', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Accept: 'application/json' 
        },
        body: JSON.stringify(updates),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error || 'Failed to update profile')
        return { success: false, error: data?.error }
      }

      setDoctor(data.doctor || data.profile)
      toast.success('Profile updated successfully')
      return { success: true, doctor: data.doctor || data.profile }
    } catch (err) {
      console.error('❌ updateDoctorProfile:', err)
      toast.error('Failed to update profile')
      return { success: false, error: err.message }
    }
  }, [])

  const updateAppointmentStatus = useCallback(async (appointmentId, status, notes) => {
    try {
      const res = await fetch(`/api/doctor/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Accept: 'application/json' 
        },
        body: JSON.stringify({ status, notes }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error || 'Failed to update appointment')
        return { success: false }
      }

      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status, notes: notes || apt.notes }
            : apt
        )
      )

      toast.success('Appointment updated successfully')
      return { success: true }
    } catch (err) {
      console.error('❌ updateAppointmentStatus:', err)
      toast.error('Failed to update appointment')
      return { success: false }
    }
  }, [])

  const markNotificationRead = useCallback(async (notificationId) => {
    try {
      const res = await fetch(`/api/doctor/notifications/${notificationId}/read`, { 
        method: 'PATCH' 
      })
      
      if (!res.ok) return

      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('❌ markNotificationRead:', err)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    if (!doctor?._id) return
    
    console.log('🔄 Refreshing all doctor data...')
    
    await Promise.all([
      fetchDoctorDashboard(),
      fetchAppointments(appointmentsFilter),
      fetchAffiliations(),
      fetchNotifications(),
    ])
  }, [
    doctor?._id,
    appointmentsFilter,
    fetchDoctorDashboard,
    fetchAppointments,
    fetchAffiliations,
    fetchNotifications,
  ])

  // ================= Effects =================

  // 1. Init once when Clerk is ready
  useEffect(() => {
    if (!isLoaded) return
    
    if (!user) {
      console.log('❌ No user loaded, resetting state')
      setDoctor(null)
      setDoctorLoading(false)
      return
    }
    
    if (didInitRef.current) return
    
    console.log('🎯 Initializing doctor context for user:', user.id)
    didInitRef.current = true
    fetchDoctorProfile()
  }, [isLoaded, user, fetchDoctorProfile])

  // 2. After doctor is known, fetch baseline data once
  useEffect(() => {
    if (!doctor?._id) return
    
    console.log('📊 Doctor loaded, fetching initial data for:', doctor._id)
    
    fetchDoctorDashboard()
    fetchAffiliations()
    fetchNotifications()
  }, [doctor?._id, fetchDoctorDashboard, fetchAffiliations, fetchNotifications])

  // 3. Reset when user logs out
  useEffect(() => {
    if (isLoaded && !user) {
      console.log('👋 User logged out, resetting context')
      didInitRef.current = false
      setDoctor(null)
      setDashboard({
        todayAppointments: 0,
        upcomingAppointments: 0,
        completedThisWeek: 0,
        pendingHospitalInvites: 0,
      })
      setAppointments([])
      setAffiliations([])
      setNotifications([])
      setUnreadCount(0)
    }
  }, [isLoaded, user])

  const value = {
    // doctor
    doctor,
    doctorLoading,
    doctorError,
    fetchDoctorProfile,
    updateDoctorProfile,

    // dashboard
    dashboard,
    dashboardLoading,
    fetchDoctorDashboard,

    // appointments
    appointments,
    appointmentsLoading,
    appointmentsFilter,
    fetchAppointments,
    updateAppointmentStatus,

    // affiliations
    affiliations,
    affiliationsLoading,
    fetchAffiliations,

    // notifications
    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationRead,

    // utilities
    refreshAll,
  }

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>
}
