'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser() // isSignedIn is the correct gate [web:735]

  // ===== State =====
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

  const didInitRef = useRef(false)

  // ===== Shared fetch helper =====
  const apiFetch = useCallback(async (url, options = {}) => {
    // Always include cookies for Clerk session [web:523]
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })

    // Some 401 responses can be empty; guard JSON parsing
    let data = null
    try {
      data = await res.json()
    } catch {
      data = null
    }

    return { res, data }
  }, [])

  const handleErrorToast = useCallback((res, data, fallbackMsg) => {
    // If unauthenticated, don't spam toasts—middleware auth.protect handles it [web:652]
    if (res.status === 401) return
    toast.error(data?.error || fallbackMsg)
  }, [])

  // ===== Fetchers =====
  const fetchHospital = useCallback(async () => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setHospital(null)
      setHospitalLoading(false)
      return
    }

    try {
      setHospitalLoading(true)
      setHospitalError(null)

      const { res, data } = await apiFetch('/api/hospital/profile')
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
  }, [apiFetch, isLoaded, isSignedIn])

  const fetchStats = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setStatsLoading(true)
      const { res, data } = await apiFetch('/api/hospital/dashboard/stats')
      if (res.ok) setStats(data?.stats || stats)
      else handleErrorToast(res, data, 'Failed to load stats')
    } catch (err) {
      console.error('❌ fetchStats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [apiFetch, handleErrorToast, hospital?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAppointments = useCallback(
    async (filter = 'all') => {
      if (!hospital?._id) return
      try {
        setAppointmentsLoading(true)
        const params = new URLSearchParams({ filter })
        const { res, data } = await apiFetch(`/api/hospital/appointments?${params}`)
        if (res.ok) {
          setAppointments(data?.appointments || [])
          setAppointmentsFilter(filter)
        } else {
          handleErrorToast(res, data, 'Failed to load appointments')
        }
      } catch (err) {
        console.error('❌ fetchAppointments:', err)
        toast.error('Failed to load appointments')
      } finally {
        setAppointmentsLoading(false)
      }
    },
    [apiFetch, handleErrorToast, hospital?._id]
  )

  const fetchDoctors = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setDoctorsLoading(true)
      const { res, data } = await apiFetch('/api/hospital/doctors')
      if (res.ok) {
        setDoctors(data?.doctors || [])
        setPendingDoctorRequests(data?.pendingRequests || [])
      } else {
        handleErrorToast(res, data, 'Failed to load doctors')
      }
    } catch (err) {
      console.error('❌ fetchDoctors:', err)
      toast.error('Failed to load doctors')
    } finally {
      setDoctorsLoading(false)
    }
  }, [apiFetch, handleErrorToast, hospital?._id])

  const fetchPatients = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setPatientsLoading(true)
      const { res, data } = await apiFetch('/api/hospital/patients')
      if (res.ok) {
        setPatients(data?.patients || [])
        setTodayPatients(data?.todayPatients || [])
      } else {
        handleErrorToast(res, data, 'Failed to load patients')
      }
    } catch (err) {
      console.error('❌ fetchPatients:', err)
      toast.error('Failed to load patients')
    } finally {
      setPatientsLoading(false)
    }
  }, [apiFetch, handleErrorToast, hospital?._id])

  const fetchStaff = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setStaffLoading(true)
      const { res, data } = await apiFetch('/api/hospital/staff')
      if (res.ok) setStaff(data?.staff || [])
      else handleErrorToast(res, data, 'Failed to load staff')
    } catch (err) {
      console.error('❌ fetchStaff:', err)
      toast.error('Failed to load staff')
    } finally {
      setStaffLoading(false)
    }
  }, [apiFetch, handleErrorToast, hospital?._id])

  const fetchInventory = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setInventoryLoading(true)
      const { res, data } = await apiFetch('/api/hospital/inventory')
      if (res.ok) {
        setInventory(data?.inventory || [])
        setLowStockItems(data?.lowStock || [])
      } else {
        handleErrorToast(res, data, 'Failed to load inventory')
      }
    } catch (err) {
      console.error('❌ fetchInventory:', err)
      toast.error('Failed to load inventory')
    } finally {
      setInventoryLoading(false)
    }
  }, [apiFetch, handleErrorToast, hospital?._id])

  const fetchNotifications = useCallback(async () => {
    if (!hospital?._id) return
    try {
      const { res, data } = await apiFetch('/api/hospital/notifications')
      if (res.ok) {
        setNotifications(data?.notifications || [])
        setUnreadCount(data?.unreadCount || 0)
      }
    } catch (err) {
      console.error('❌ fetchNotifications:', err)
    }
  }, [apiFetch, hospital?._id])

  // ===== Actions =====
  const approveDoctorRequest = useCallback(
    async (affiliationId) => {
      try {
        const { res, data } = await apiFetch('/api/hospital/doctors/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ affiliationId }),
        })

        if (!res.ok) {
          handleErrorToast(res, data, 'Failed to approve doctor')
          return { success: false, error: data?.error }
        }

        toast.success('Doctor approved successfully')
        await Promise.all([fetchDoctors(), fetchStats()])
        return { success: true }
      } catch (err) {
        console.error('❌ approveDoctorRequest:', err)
        toast.error('Failed to approve doctor')
        return { success: false, error: err?.message }
      }
    },
    [apiFetch, fetchDoctors, fetchStats, handleErrorToast]
  )

  const markNotificationRead = useCallback(
    async (notificationId) => {
      try {
        const { res } = await apiFetch(`/api/hospital/notifications/${notificationId}/read`, {
          method: 'PATCH',
        })
        if (!res.ok) return
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error('❌ markNotificationRead:', err)
      }
    },
    [apiFetch]
  )

  const refreshAll = useCallback(async () => {
    if (!hospital?._id) return
    await Promise.all([
      fetchStats(),
      fetchAppointments(appointmentsFilter),
      fetchDoctors(),
      fetchPatients(),
      fetchNotifications(),
    ])
  }, [
    hospital?._id,
    appointmentsFilter,
    fetchStats,
    fetchAppointments,
    fetchDoctors,
    fetchPatients,
    fetchNotifications,
  ])

  // ===== Effects =====

  // 1) init hospital fetch once when auth is ready
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) return
    if (didInitRef.current) return
    didInitRef.current = true
    fetchHospital()
  }, [isLoaded, isSignedIn, fetchHospital])

  // 2) once hospital known, load lightweight global info
  useEffect(() => {
    if (!hospital?._id) return
    fetchStats()
    fetchNotifications()
  }, [hospital?._id, fetchStats, fetchNotifications])

  // 3) redirect to setup if signed in but hospital profile missing
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) return
    if (hospitalLoading) return

    if (!hospital) router.push('/hospital-admin/setup')
  }, [isLoaded, isSignedIn, hospitalLoading, hospital, router])

  const value = useMemo(
    () => ({
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
    }),
    [
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
      refreshAll,
    ]
  )

  return <HospitalAdminContext.Provider value={value}>{children}</HospitalAdminContext.Provider>
}
