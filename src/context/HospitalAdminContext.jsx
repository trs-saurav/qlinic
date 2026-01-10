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
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import toast from 'react-hot-toast'

const HospitalAdminContext = createContext(undefined)

export const useHospitalAdmin = () => {
  const ctx = useContext(HospitalAdminContext)
  if (!ctx) throw new Error('useHospitalAdmin must be used within HospitalAdminProvider')
  return ctx
}

export const HospitalAdminProvider = ({ children }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Auth state
  const isLoaded = status !== 'loading'
  const isSignedIn = status === 'authenticated'
  const user = session?.user

  // ===== State =====
  const [hospital, setHospital] = useState(null)
  const [hospitalLoading, setHospitalLoading] = useState(true)
  const [hospitalError, setHospitalError] = useState(null)
  const [adminInfo, setAdminInfo] = useState(null)

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
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    categories: 0,
    totalValue: 0,
    expiringSoon: 0,
    categoryBreakdown: [],
  })
  const [inventoryFilters, setInventoryFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
  })
  const [lowStockItems, setLowStockItems] = useState([])

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const [settings, setSettings] = useState({
    notifications: { email: true, sms: false, push: true },
    privacy: { showProfile: true, allowMessages: true },
    theme: 'light',
  })

  // Ref to track if we've already fetched the initial hospital profile
  const didInitRef = useRef(false)

  // ===== Shared fetch helper =====
  const apiFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })

    let data = null
    try {
      data = await res.json()
    } catch {
      data = null
    }

    return { res, data }
  }, [])

  const handleErrorToast = useCallback((res, data, fallbackMsg) => {
    if (res.status === 401) {
      console.log('🔒 Unauthorized')
      return
    }
    toast.error(data?.error || fallbackMsg)
  }, [])

  // ===== Fetchers =====
  
  const fetchHospital = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return

    // Prevent fetching if role is wrong
    if (user?.role !== 'hospital_admin') {
      setHospital(null)
      setHospitalLoading(false)
      setHospitalError('Access denied: Hospital admin role required')
      return
    }

    try {
      setHospitalLoading(true)
      setHospitalError(null)

      const { res, data } = await apiFetch('/api/hospital/profile')
      
      if (!res.ok) {
        setHospital(null)
        setAdminInfo(null)
        setHospitalError(data?.error || 'Failed to load hospital')
        return
      }

      setHospital(data?.hospital || null)
      setAdminInfo(data?.admin || null)
    } catch (err) {
      console.error('❌ fetchHospital exception:', err)
      setHospital(null)
      setAdminInfo(null)
      setHospitalError('Failed to load hospital data')
    } finally {
      setHospitalLoading(false)
    }
  }, [apiFetch, isLoaded, isSignedIn, user?.role]) 

  const fetchStats = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setStatsLoading(true)
      const { res, data } = await apiFetch('/api/hospital/dashboard/stats')
      if (res.ok && data?.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('❌ fetchStats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [apiFetch, hospital?._id])

  const fetchAppointments = useCallback(
    async (filter = 'all') => {
      if (!hospital?._id) return
      try {
        setAppointmentsLoading(true)
        const params = new URLSearchParams({ 
          role: 'hospital_admin',
          filter
        })
        const { res, data } = await apiFetch(`/api/appointment?${params}`)
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
      }
    } catch (err) {
      console.error('❌ fetchDoctors:', err)
    } finally {
      setDoctorsLoading(false)
    }
  }, [apiFetch, hospital?._id])

  const fetchPatients = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setPatientsLoading(true)
      const { res, data } = await apiFetch('/api/hospital/patients')
      if (res.ok) {
        setPatients(data?.patients || [])
        setTodayPatients(data?.todayPatients || [])
      }
    } catch (err) {
      console.error('❌ fetchPatients:', err)
    } finally {
      setPatientsLoading(false)
    }
  }, [apiFetch, hospital?._id])

  const fetchStaff = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setStaffLoading(true)
      const { res, data } = await apiFetch('/api/hospital/staff')
      if (res.ok) setStaff(data?.staff || [])
    } catch (err) {
      console.error('❌ fetchStaff:', err)
    } finally {
      setStaffLoading(false)
    }
  }, [apiFetch, hospital?._id])

  const fetchInventoryStats = useCallback(async () => {
    if (!hospital?._id) return
    try {
      const params = new URLSearchParams({ hospitalId: hospital._id })
      const { res, data } = await apiFetch(`/api/hospital/inventory/stats?${params}`)
      if (res.ok && data?.stats) {
        setInventoryStats(data.stats)
      }
    } catch (err) {
      console.error('❌ fetchInventoryStats:', err)
    }
  }, [apiFetch, hospital?._id])

  const fetchInventory = useCallback(
    async (filters) => {
      // Use passed filters, or fallback to state
      const activeFilters = filters || inventoryFilters
      
      if (!hospital?._id) return
      try {
        setInventoryLoading(true)
        const params = new URLSearchParams({
          hospitalId: hospital._id,
          ...(activeFilters.category !== 'all' && { category: activeFilters.category }),
          ...(activeFilters.status !== 'all' && { status: activeFilters.status }),
          ...(activeFilters.search && { search: activeFilters.search }),
        })
        
        const { res, data } = await apiFetch(`/api/hospital/inventory?${params}`)
        if (res.ok) {
          setInventory(data?.items || [])
          // Only update filter state if arguments were passed explicitly
          if (filters) setInventoryFilters(filters)
          
          const lowStock = (data?.items || []).filter(
            item => item.status === 'low-stock' || item.status === 'out-of-stock'
          )
          setLowStockItems(lowStock)
        }
      } catch (err) {
        console.error('❌ fetchInventory:', err)
      } finally {
        setInventoryLoading(false)
      }
    },
    [apiFetch, hospital?._id, inventoryFilters]
  )

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

  const addInventoryItem = useCallback(
    async (itemData) => {
      try {
        const { res, data } = await apiFetch('/api/hospital/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...itemData, hospitalId: hospital._id }),
        })

        if (!res.ok) {
          handleErrorToast(res, data, 'Failed to add item')
          return { success: false, error: data?.error }
        }

        toast.success('Item added successfully')
        fetchInventory(inventoryFilters) 
        fetchInventoryStats()
        
        return { success: true, item: data?.item }
      } catch (err) {
        console.error('❌ addInventoryItem:', err)
        toast.error('Failed to add item')
        return { success: false, error: err?.message }
      }
    },
    [apiFetch, handleErrorToast, hospital?._id, fetchInventory, fetchInventoryStats, inventoryFilters]
  )

  const updateInventoryItem = useCallback(
    async (itemId, updates) => {
      try {
        const { res, data } = await apiFetch(`/api/hospital/inventory/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!res.ok) {
          handleErrorToast(res, data, 'Failed to update item')
          return { success: false, error: data?.error }
        }

        toast.success('Item updated successfully')
        fetchInventory(inventoryFilters)
        fetchInventoryStats()
        
        return { success: true, item: data?.item }
      } catch (err) {
        console.error('❌ updateInventoryItem:', err)
        toast.error('Failed to update item')
        return { success: false, error: err?.message }
      }
    },
    [apiFetch, handleErrorToast, fetchInventory, fetchInventoryStats, inventoryFilters]
  )

  const deleteInventoryItem = useCallback(
    async (itemId) => {
      try {
        const { res, data } = await apiFetch(`/api/hospital/inventory/${itemId}`, {
          method: 'DELETE',
        })

        if (!res.ok) {
          handleErrorToast(res, data, 'Failed to delete item')
          return { success: false, error: data?.error }
        }

        toast.success('Item deleted successfully')
        fetchInventory(inventoryFilters)
        fetchInventoryStats()
        
        return { success: true }
      } catch (err) {
        console.error('❌ deleteInventoryItem:', err)
        toast.error('Failed to delete item')
        return { success: false, error: err?.message }
      }
    },
    [apiFetch, handleErrorToast, fetchInventory, fetchInventoryStats, inventoryFilters]
  )

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
        fetchDoctors()
        fetchStats()
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

  const updateAppointmentStatus = useCallback(
    async (appointmentId, status, additionalData = {}) => {
      try {
        const { res, data } = await apiFetch(`/api/appointment/${appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status, 
            ...additionalData,
            updatedByRole: 'hospital_admin' 
          }),
        })

        if (!res.ok) {
          throw new Error(data?.error || 'Failed to update appointment')
        }

        setAppointments(prev => 
          prev.map(apt => 
            apt._id === appointmentId 
              ? { ...apt, status, ...additionalData }
              : apt
          )
        )

        return { success: true }
      } catch (err) {
        console.error('❌ updateAppointmentStatus:', err)
        return { success: false, error: err.message }
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
      fetchInventoryStats(),
      fetchNotifications(),
    ])
  }, [
    hospital?._id,
    appointmentsFilter, 
    fetchStats,
    fetchAppointments,
    fetchDoctors,
    fetchPatients,
    fetchInventoryStats,
    fetchNotifications,
  ])

  // ===== Effects =====

  // 1) Init Hospital Profile (Runs once per session load)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (didInitRef.current) return 
    
    didInitRef.current = true
    fetchHospital()
  }, [isLoaded, isSignedIn, fetchHospital])

  // 2) Load secondary data ONLY when hospital ID changes
  useEffect(() => {
    if (!hospital?._id) return
    
    fetchStats()
    fetchInventoryStats()
    fetchNotifications()
    fetchDoctors() 
  }, [hospital?._id, fetchStats, fetchInventoryStats, fetchNotifications, fetchDoctors])

  // 3) Setup Redirect
  useEffect(() => {
    if (!isLoaded || !isSignedIn || hospitalLoading) return
    if (pathname?.includes('/hospital-admin/setup')) return

    if (user?.role === 'hospital_admin' && !hospital && !hospitalError) {
      router.push('/hospital-admin/setup')
    }
  }, [isLoaded, isSignedIn, hospitalLoading, hospital, hospitalError, router, pathname, user?.role])

  // 4) Cleanup on logout
  useEffect(() => {
    if (isLoaded && !isSignedIn && didInitRef.current) {
      setHospital(null)
      setAdminInfo(null)
      setHospitalError('Session expired')
      didInitRef.current = false
    }
  }, [isLoaded, isSignedIn])

  const value = useMemo(() => ({
      user, isLoaded, isSignedIn,
      hospital, hospitalLoading, hospitalError, adminInfo, fetchHospital,
      stats, statsLoading, fetchStats,
      appointments, appointmentsLoading, appointmentsFilter, fetchAppointments, updateAppointmentStatus,
      doctors, doctorsLoading, pendingDoctorRequests, fetchDoctors, approveDoctorRequest,
      patients, patientsLoading, todayPatients, fetchPatients,
      staff, staffLoading, fetchStaff,
      inventory, inventoryLoading, inventoryStats, inventoryFilters, lowStockItems, fetchInventory, fetchInventoryStats,
      addInventoryItem, updateInventoryItem, deleteInventoryItem,
      notifications, unreadCount, fetchNotifications, markNotificationRead,
      settings, setSettings,
      refreshAll,
    }),
    [
      user, isLoaded, isSignedIn,
      hospital, hospitalLoading, hospitalError, adminInfo, fetchHospital,
      stats, statsLoading, fetchStats,
      appointments, appointmentsLoading, appointmentsFilter, fetchAppointments, updateAppointmentStatus,
      doctors, doctorsLoading, pendingDoctorRequests, fetchDoctors, approveDoctorRequest,
      patients, patientsLoading, todayPatients, fetchPatients,
      staff, staffLoading, fetchStaff,
      inventory, inventoryLoading, inventoryStats, inventoryFilters, lowStockItems, fetchInventory, fetchInventoryStats,
      addInventoryItem, updateInventoryItem, deleteInventoryItem,
      notifications, unreadCount, fetchNotifications, markNotificationRead,
      settings, setSettings,
      refreshAll
    ]
  )

  return <HospitalAdminContext.Provider value={value}>{children}</HospitalAdminContext.Provider>
}
