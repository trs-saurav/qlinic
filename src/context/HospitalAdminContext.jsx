'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const HospitalAdminContext = createContext(undefined)

export const useHospitalAdmin = () => {
  const ctx = useContext(HospitalAdminContext)
  if (!ctx) throw new Error('useHospitalAdmin must be used within HospitalAdminProvider')
  return ctx
}

export const HospitalAdminProvider = ({ children }) => {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // ============ STATE ============
  const [hospital, setHospital] = useState(null)
  const [hospitalLoading, setHospitalLoading] = useState(true)
  const [hospitalError, setHospitalError] = useState(null)

  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalStaff: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    totalBeds: 0,
    revenue: { today: 0, month: 0, year: 0 },
  })
  const [statsLoading, setStatsLoading] = useState(false)

  const [appointments, setAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [appointmentsFilter, setAppointmentsFilter] = useState('all')

  const [doctors, setDoctors] = useState([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [pendingDoctorRequests, setPendingDoctorRequests] = useState([])

  const [patients, setPatients] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [todayPatients, setTodayPatients] = useState([])

  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)

  const [inventory, setInventory] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [lowStockItems, setLowStockItems] = useState([])

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const [settings, setSettings] = useState({
    notifications: { email: true, sms: false, push: true },
    privacy: { showProfile: true, allowMessages: true },
    theme: 'light',
  })

  // Prevent duplicate initial fetches (helps dev/StrictMode too)
  const didInitRef = useRef(false)

  // ============ FETCHERS ============

  const fetchHospital = useCallback(async () => {
    if (!user) return

    try {
      setHospitalLoading(true)
      setHospitalError(null)

      const res = await fetch('/api/hospital/profile', {
        headers: { Accept: 'application/json' },
      })
      const data = await res.json()

      if (!res.ok) {
        setHospital(null)
        setHospitalError(data?.error || 'Failed to load hospital')
        return
      }

      setHospital(data?.hospital || null)
    } catch (err) {
      console.error('❌ fetchHospital:', err)
      setHospital(null)
      setHospitalError('Failed to load hospital data')
      toast.error('Failed to load hospital data')
    } finally {
      setHospitalLoading(false)
    }
  }, [user])

  const fetchStats = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setStatsLoading(true)
      const res = await fetch('/api/hospital/dashboard/stats', { headers: { Accept: 'application/json' } })
      const data = await res.json()
      if (res.ok) setStats(data.stats)
    } catch (err) {
      console.error('❌ fetchStats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [hospital?._id])

  const fetchAppointments = useCallback(async (filter = 'all') => {
    if (!hospital?._id) return
    try {
      setAppointmentsLoading(true)
      const params = new URLSearchParams({ filter })
      const res = await fetch(`/api/hospital/appointments?${params}`)
      const data = await res.json()

      if (res.ok) {
        setAppointments(data.appointments || [])
        setAppointmentsFilter(filter)
      } else {
        toast.error(data?.error || 'Failed to load appointments')
      }
    } catch (err) {
      console.error('❌ fetchAppointments:', err)
      toast.error('Failed to load appointments')
    } finally {
      setAppointmentsLoading(false)
    }
  }, [hospital?._id])

  const fetchDoctors = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setDoctorsLoading(true)
      const res = await fetch('/api/hospital/doctors')
      const data = await res.json()

      if (res.ok) {
        setDoctors(data.doctors || [])
        setPendingDoctorRequests(data.pendingRequests || [])
      } else {
        toast.error(data?.error || 'Failed to load doctors')
      }
    } catch (err) {
      console.error('❌ fetchDoctors:', err)
      toast.error('Failed to load doctors')
    } finally {
      setDoctorsLoading(false)
    }
  }, [hospital?._id])

  const fetchPatients = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setPatientsLoading(true)
      const res = await fetch('/api/hospital/patients')
      const data = await res.json()

      if (res.ok) {
        setPatients(data.patients || [])
        setTodayPatients(data.todayPatients || [])
      } else {
        toast.error(data?.error || 'Failed to load patients')
      }
    } catch (err) {
      console.error('❌ fetchPatients:', err)
      toast.error('Failed to load patients')
    } finally {
      setPatientsLoading(false)
    }
  }, [hospital?._id])

  const fetchStaff = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setStaffLoading(true)
      const res = await fetch('/api/hospital/staff')
      const data = await res.json()

      if (res.ok) setStaff(data.staff || [])
      else toast.error(data?.error || 'Failed to load staff')
    } catch (err) {
      console.error('❌ fetchStaff:', err)
      toast.error('Failed to load staff')
    } finally {
      setStaffLoading(false)
    }
  }, [hospital?._id])

  const fetchInventory = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setInventoryLoading(true)
      const res = await fetch('/api/hospital/inventory')
      const data = await res.json()

      if (res.ok) {
        setInventory(data.inventory || [])
        setLowStockItems(data.lowStock || [])
      } else {
        toast.error(data?.error || 'Failed to load inventory')
      }
    } catch (err) {
      console.error('❌ fetchInventory:', err)
      toast.error('Failed to load inventory')
    } finally {
      setInventoryLoading(false)
    }
  }, [hospital?._id])

  const fetchNotifications = useCallback(async () => {
    if (!hospital?._id) return
    try {
      const res = await fetch('/api/hospital/notifications')
      const data = await res.json()

      if (res.ok) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('❌ fetchNotifications:', err)
    }
  }, [hospital?._id])

  // ============ ACTIONS ============

  const approveDoctorRequest = useCallback(async (affiliationId) => {
    try {
      const res = await fetch('/api/hospital/doctors/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliationId }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error || 'Failed to approve doctor')
        return { success: false, error: data?.error }
      }

      toast.success('Doctor approved successfully')
      await Promise.all([fetchDoctors(), fetchStats()])
      return { success: true }
    } catch (err) {
      console.error('❌ approveDoctorRequest:', err)
      toast.error('Failed to approve doctor')
      return { success: false, error: err.message }
    }
  }, [fetchDoctors, fetchStats])

  const markNotificationRead = useCallback(async (notificationId) => {
    try {
      const res = await fetch(`/api/hospital/notifications/${notificationId}/read`, { method: 'PATCH' })
      if (!res.ok) return
      setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('❌ markNotificationRead:', err)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    if (!hospital?._id) return
    await Promise.all([
      fetchStats(),
      fetchAppointments(appointmentsFilter),
      fetchDoctors(),
      fetchPatients(),
      fetchNotifications(),
    ])
  }, [hospital?._id, appointmentsFilter, fetchStats, fetchAppointments, fetchDoctors, fetchPatients, fetchNotifications])

  // ============ EFFECTS ============

  // 1) Fetch hospital once when auth is ready (NOT on pathname changes)
  useEffect(() => {
    if (!isLoaded) return
    if (!user) return

    if (didInitRef.current) return
    didInitRef.current = true

    fetchHospital()
  }, [isLoaded, user, fetchHospital])

  // 2) After hospital is known, load “global” data once
  useEffect(() => {
    if (!hospital?._id) return
    fetchStats()
    fetchNotifications()
  }, [hospital?._id, fetchStats, fetchNotifications])

  // 3) Redirect if hospital missing (but only after fetch finishes)
  useEffect(() => {
    if (!isLoaded || !user) return
    if (hospitalLoading) return

    if (!hospital) {
      router.push('/hospital-admin/setup')
    }
  }, [isLoaded, user, hospitalLoading, hospital, router])

  const value = {
    hospital,
    hospitalLoading,
    hospitalError,
    fetchHospital,

    stats,
    statsLoading,
    fetchStats,

    appointments,
    appointmentsLoading,
    appointmentsFilter,
    fetchAppointments,

    doctors,
    doctorsLoading,
    pendingDoctorRequests,
    fetchDoctors,
    approveDoctorRequest,

    patients,
    patientsLoading,
    todayPatients,
    fetchPatients,

    staff,
    staffLoading,
    fetchStaff,

    inventory,
    inventoryLoading,
    lowStockItems,
    fetchInventory,

    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationRead,

    settings,
    setSettings,

    refreshAll,
  }

  return <HospitalAdminContext.Provider value={value}>{children}</HospitalAdminContext.Provider>
}
