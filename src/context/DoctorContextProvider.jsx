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

  // ================= Schedule =================
  const [schedule, setSchedule] = useState({
    weekly: [],
    exceptions: [],
  })
  const [scheduleLoading, setScheduleLoading] = useState(false)

  // ================= Notifications =================
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // ================= Fetchers =================

const fetchDoctorProfile = useCallback(async () => {
  console.log('🚀 fetchDoctorProfile called, user:', user?.id)
  
  if (!user) {
    console.log('❌ No user, returning')
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

    console.log('✅ Setting doctor:', data?.profile || data?.doctor) // ✅ Handle both keys
    setDoctor(data?.profile || data?.doctor || null) // ✅ Try both 'profile' and 'doctor'
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
      const res = await fetch('/api/doctor/dashboard', { headers: { Accept: 'application/json' } })
      const data = await res.json()
      if (res.ok) setDashboard(data.dashboard || dashboard)
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
    if (!doctor?._id) return
    try {
      setAffiliationsLoading(true)
      const res = await fetch('/api/doctor/affiliations', {
        headers: { Accept: 'application/json' },
      })
      const data = await res.json()

      console.log('✅ Affiliations response:', { status: res.status, data }) // DEBUG

      if (!res.ok) {
        toast.error(data?.error || 'Failed to load affiliations')
        return
      }

      setAffiliations(data.affiliations || [])
    } catch (err) {
      console.error('❌ fetchAffiliations:', err)
      toast.error('Failed to load affiliations')
    } finally {
      setAffiliationsLoading(false)
    }
  }, [doctor?._id])

  const fetchSchedule = useCallback(async () => {
    if (!doctor?._id) return
    try {
      setScheduleLoading(true)
      const res = await fetch('/api/doctor/schedule', {
        headers: { Accept: 'application/json' },
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error || 'Failed to load schedule')
        return
      }

      setSchedule(data.schedule || { weekly: [], exceptions: [] })
    } catch (err) {
      console.error('❌ fetchSchedule:', err)
      toast.error('Failed to load schedule')
    } finally {
      setScheduleLoading(false)
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

  const markNotificationRead = useCallback(async (notificationId) => {
    try {
      const res = await fetch(`/api/doctor/notifications/${notificationId}/read`, { method: 'PATCH' })
      if (!res.ok) return
      setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('❌ markNotificationRead:', err)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    if (!doctor?._id) return
    await Promise.all([
      fetchDoctorDashboard(),
      fetchAppointments(appointmentsFilter),
      fetchAffiliations(),
      fetchSchedule(),
      fetchNotifications(),
    ])
  }, [
    doctor?._id,
    appointmentsFilter,
    fetchDoctorDashboard,
    fetchAppointments,
    fetchAffiliations,
    fetchSchedule,
    fetchNotifications,
  ])

  // ================= Effects =================

  // 1. Init once when Clerk is ready
  useEffect(() => {
    if (!isLoaded || !user) return
    if (didInitRef.current) return
    didInitRef.current = true
    fetchDoctorProfile()
  }, [isLoaded, user, fetchDoctorProfile])

  // 2. After doctor is known, fetch baseline data once
  useEffect(() => {
    if (!doctor?._id) return
    fetchDoctorDashboard()
    fetchAffiliations()    // ✅ ADDED: Fetch affiliations on mount
    fetchNotifications()
  }, [doctor?._id, fetchDoctorDashboard, fetchAffiliations, fetchNotifications])

  const value = {
    // doctor
    doctor,
    doctorLoading,
    doctorError,
    fetchDoctorProfile,

    // dashboard
    dashboard,
    dashboardLoading,
    fetchDoctorDashboard,

    // appointments
    appointments,
    appointmentsLoading,
    appointmentsFilter,
    fetchAppointments,

    // affiliations
    affiliations,
    affiliationsLoading,
    fetchAffiliations,

    // schedule
    schedule,
    scheduleLoading,
    fetchSchedule,

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
