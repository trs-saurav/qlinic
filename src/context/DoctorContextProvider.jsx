'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const DoctorContext = createContext(undefined)

export const useDoctor = () => {
  const ctx = useContext(DoctorContext)
  if (!ctx) throw new Error('useDoctor must be used within DoctorProvider')
  return ctx
}

export function DoctorProvider({ children }) {
  const { data: session, status } = useSession()
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
    if (!session?.user) {
      setDoctorLoading(false)
      return
    }

    try {
      setDoctorLoading(true)
      const res = await fetch('/api/doctor/profile')
      const data = await res.json()

      if (!res.ok) {
        setDoctor(null)
        setDoctorError(data?.error || 'Failed to load doctor profile')
        return
      }

      const doctorData = data?.profile || data?.doctor || null
      setDoctor(doctorData)
    } catch (err) {
      console.error('❌ fetchDoctorProfile:', err)
      setDoctor(null)
      toast.error('Failed to load doctor profile')
    } finally {
      setDoctorLoading(false)
    }
  }, [session])

  const fetchDoctorDashboard = useCallback(async () => {
    if (!doctor?._id) return
    try {
      setDashboardLoading(true)
      const res = await fetch('/api/doctor/dashboard')
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

  // ✅ UPDATED: Points to centralized /api/appointment
  const fetchAppointments = useCallback(
    async (filter = 'today') => {
      if (!doctor?._id) return
      try {
        setAppointmentsLoading(true)
        
        // Pass 'role=doctor' so the API knows to filter by doctorId, not patientId
        const params = new URLSearchParams({ 
          role: 'doctor', 
          doctorId: doctor._id, 
          filter 
        })
        
        console.log('🔍 Fetching appointments with params:', params.toString())
        
        const res = await fetch(`/api/appointment?${params}`, {
          headers: { Accept: 'application/json' },
        })
        
        console.log('📡 Response status:', res.status, res.statusText)
        
        // Check if response is JSON
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('❌ Expected JSON but got:', contentType)
          const text = await res.text()
          console.error('Response body:', text.substring(0, 500))
          toast.error('Server error - please check console')
          return
        }
        
        const data = await res.json()

        if (!res.ok) {
          toast.error(data?.error || 'Failed to load appointments')
          return
        }

        console.log('✅ Appointments loaded:', data.appointments?.length || 0)
        setAppointments(data.appointments || [])
        setAppointmentsFilter(filter)
      } catch (err) {
        console.error('❌ fetchAppointments error:', err)
        console.error('Error stack:', err.stack)
        toast.error('Failed to load appointments: ' + err.message)
      } finally {
        setAppointmentsLoading(false)
      }
    },
    [doctor?._id]
  )

  const fetchAffiliations = useCallback(async () => {
    if (!doctor?._id) return
    
    try {
      setAffiliationsLoading(true)
      const res = await fetch('/api/doctor/affiliations')
      const data = await res.json()

      if (!res.ok) {
        setAffiliations([])
        return
      }

      setAffiliations(data.affiliations || [])
    } catch (err) {
      console.error('❌ fetchAffiliations:', err)
      setAffiliations([])
    } finally {
      setAffiliationsLoading(false)
    }
  }, [doctor?._id])

  const fetchNotifications = useCallback(async () => {
    if (!doctor?._id) return
    try {
      const res = await fetch('/api/doctor/notifications')
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
        headers: { 'Content-Type': 'application/json' },
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
      toast.error('Failed to update profile')
      return { success: false, error: err.message }
    }
  }, [])

  // ✅ UPDATED: Points to centralized /api/appointment/[id]
  const updateAppointmentStatus = useCallback(async (appointmentId, status, additionalData = {}) => {
    try {
      const res = await fetch(`/api/appointment/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          ...additionalData,
          updatedByRole: 'doctor' // Audit trail
        }),
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
            ? { ...apt, status, ...additionalData }
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
      const res = await fetch(`/api/doctor/notifications/${notificationId}/read`, { method: 'PATCH' })
      if (!res.ok) return
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) { console.error(err) }
  }, [])

  const refreshAll = useCallback(async () => {
    if (!doctor?._id) return
    await Promise.all([
      fetchDoctorDashboard(),
      fetchAppointments(appointmentsFilter),
      fetchAffiliations(),
      fetchNotifications(),
    ])
  }, [doctor?._id, appointmentsFilter, fetchDoctorDashboard, fetchAppointments, fetchAffiliations, fetchNotifications])

  // ================= Effects =================
  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || !session?.user) {
      setDoctor(null)
      setDoctorLoading(false)
      return
    }
    if (didInitRef.current) return
    didInitRef.current = true
    fetchDoctorProfile()
  }, [status, session, fetchDoctorProfile])

  useEffect(() => {
    if (!doctor?._id) return
    fetchDoctorDashboard()
    fetchAffiliations()
    fetchNotifications()
  }, [doctor?._id, fetchDoctorDashboard, fetchAffiliations, fetchNotifications])

  useEffect(() => {
    if (status === 'unauthenticated') {
      didInitRef.current = false
      setDoctor(null)
      setAppointments([])
      setAffiliations([])
      setNotifications([])
    }
  }, [status])

  const value = {
    doctor, doctorLoading, doctorError, fetchDoctorProfile, updateDoctorProfile,
    dashboard, dashboardLoading, fetchDoctorDashboard,
    appointments, appointmentsLoading, appointmentsFilter, fetchAppointments, updateAppointmentStatus,
    affiliations, affiliationsLoading, fetchAffiliations,
    notifications, unreadCount, fetchNotifications, markNotificationRead,
    refreshAll,
  }

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>
}
