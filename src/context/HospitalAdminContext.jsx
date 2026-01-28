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

// ✅ FIREBASE REALTIME DB IMPORTS
import { ref, onValue, off } from 'firebase/database' 
import { realtimeDb } from '@/config/firebase'

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
  const [selectedDate, setSelectedDate] = useState(new Date())

  // ✅ LIVE QUEUE DATA STATE
  const [liveQueueData, setLiveQueueData] = useState({}) 

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
  const [inventoryStats, setInventoryStats] = useState({})
  const [inventoryFilters, setInventoryFilters] = useState({ search: '', category: 'all', status: 'all' })
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
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })
    let data = null
    try { data = await res.json() } catch { data = null }
    return { res, data }
  }, [])

  const handleErrorToast = useCallback((res, data, fallbackMsg) => {
    if (res.status === 401) return
    toast.error(data?.error || fallbackMsg)
  }, [])

  // ===== Fetchers =====
  
  const fetchHospital = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return
    if (user?.role !== 'hospital_admin') {
      setHospital(null)
      setHospitalLoading(false)
      setHospitalError('Access denied')
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
      if (res.ok && data?.stats) setStats(data.stats)
    } catch (err) { } finally { setStatsLoading(false) }
  }, [apiFetch, hospital?._id])

  const fetchAppointments = useCallback(
    async (filter = 'all', date = selectedDate, doctorId = null) => { // ✅ Added doctorId param
      if (!hospital?._id) return
      try {
        setAppointmentsLoading(true)
        const dateStr = date ? new Date(date).toISOString().split('T')[0] : ''
        
        // ✅ Build params
        const params = new URLSearchParams({ 
          role: 'hospital_admin', 
          filter, 
          date: dateStr 
        })
        
        // ✅ Add doctorId if filtering
        if (doctorId) {
          params.set('doctorId', doctorId)
        }
        
        const { res, data } = await apiFetch(`/api/appointment?${params}`)
        if (res.ok) {
          setAppointments(data?.appointments || [])
          setAppointmentsFilter(filter)
        } else {
          handleErrorToast(res, data, 'Failed to load appointments')
        }
      } catch (err) {
        toast.error('Failed to load appointments')
      } finally {
        setAppointmentsLoading(false)
      }
    },
    [apiFetch, handleErrorToast, hospital?._id, selectedDate]
  )

  // ✅ ✅ FIXED: Doctor Data Normalization
  // This flattens the nested API structure (aff.doctorId.firstName) -> (doc.firstName)
  // Ensures Sidebar shows names correctly
  const fetchDoctors = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setDoctorsLoading(true)
      const { res, data } = await apiFetch('/api/hospital/doctors')
      if (res.ok) {
        const rawDocs = data?.doctors || []
        
        const normalizedDocs = rawDocs
          .filter(aff => aff.doctorId) // Filter nulls
          .map(aff => {
             const d = aff.doctorId
             return {
                // IMPORTANT: Use the User ID as main _id to match Appointment doctorId
                _id: d._id, 
                
                // Flatten names
                firstName: d.firstName || 'Unknown',
                lastName: d.lastName || '',
                email: d.email || '',
                phone: d.phone || '',
                profileImage: d.profileImage,
                
                // Flatten Profile
                specialization: d.doctorProfile?.specialization || 'General',
                consultationFee: d.doctorProfile?.consultationFee || 0,
                qualification: d.doctorProfile?.qualification || '',
                
                // Keep Affiliation Metadata
                affiliationId: aff._id,
                status: aff.status,
                role: 'doctor'
             }
          })
          
        setDoctors(normalizedDocs)
        setPendingDoctorRequests(data?.pendingRequests || [])
      }
    } catch (err) { console.error(err) } finally { setDoctorsLoading(false) }
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
    } catch (err) { } finally { setPatientsLoading(false) }
  }, [apiFetch, hospital?._id])

  const fetchStaff = useCallback(async () => {
    if (!hospital?._id) return
    try {
      setStaffLoading(true)
      const { res, data } = await apiFetch('/api/hospital/staff')
      if (res.ok) setStaff(data?.staff || [])
    } catch (err) { } finally { setStaffLoading(false) }
  }, [apiFetch, hospital?._id])

  const fetchInventoryStats = useCallback(async () => {
    if (!hospital?._id) return
    try {
      const params = new URLSearchParams({ hospitalId: hospital._id })
      const { res, data } = await apiFetch(`/api/hospital/inventory/stats?${params}`)
      if (res.ok && data?.stats) setInventoryStats(data.stats)
    } catch (err) { }
  }, [apiFetch, hospital?._id])

  const fetchInventory = useCallback(async (filters) => {
      // (Simplified placeholder - assuming logic matches your provided code)
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
           if (filters) setInventoryFilters(filters)
           setLowStockItems((data?.items || []).filter(i => ['low-stock','out-of-stock'].includes(i.status)))
        }
      } catch (err) {} finally { setInventoryLoading(false) }
  }, [apiFetch, hospital?._id, inventoryFilters])

  const fetchNotifications = useCallback(async () => {
    if (!hospital?._id) return
    try {
      const { res, data } = await apiFetch('/api/hospital/notifications')
      if (res.ok) {
        setNotifications(data?.notifications || [])
        setUnreadCount(data?.unreadCount || 0)
      }
    } catch (err) { }
  }, [apiFetch, hospital?._id])

  // Actions
  const addInventoryItem = useCallback(async (itemData) => {
      try {
        const { res, data } = await apiFetch('/api/hospital/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...itemData, hospitalId: hospital._id }),
        })
        if (!res.ok) { handleErrorToast(res, data, 'Failed'); return { success: false, error: data?.error } }
        toast.success('Added')
        fetchInventory(inventoryFilters)
        return { success: true }
      } catch (err) { return { success: false, error: err.message } }
  }, [apiFetch, handleErrorToast, hospital?._id, fetchInventory, inventoryFilters])

  const updateAppointmentStatus = useCallback(
    async (appointmentId, status, additionalData = {}) => {
      try {
        const { res, data } = await apiFetch(`/api/appointment/${appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, ...additionalData, updatedByRole: 'hospital_admin' }),
        })
        if (!res.ok) throw new Error(data?.error)
        
        // Optimistic update
        setAppointments(prev => prev.map(apt => apt._id === appointmentId ? { ...apt, status, ...additionalData } : apt))
        return { success: true }
      } catch (err) { return { success: false, error: err.message } }
    }, [apiFetch]
  )
  
  // (Assuming other actions like markNotificationRead are here...)

  const refreshAll = useCallback(async () => {
    if (!hospital?._id) return
    await Promise.all([
      fetchStats(),
      fetchAppointments(appointmentsFilter, selectedDate),
      fetchDoctors(),
      fetchPatients(),
      fetchInventoryStats(),
      fetchNotifications(),
    ])
  }, [hospital?._id, appointmentsFilter, selectedDate, fetchStats, fetchAppointments, fetchDoctors, fetchPatients, fetchInventoryStats, fetchNotifications])

  // Effects
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (didInitRef.current) return 
    didInitRef.current = true
    fetchHospital()
  }, [isLoaded, isSignedIn, fetchHospital])

  useEffect(() => {
    if (!hospital?._id) return
    refreshAll()
  }, [hospital?._id, refreshAll])

  // ✅ REALTIME LISTENER
  useEffect(() => {
    if (!hospital?._id) return
    const queuesRef = ref(realtimeDb, `queues/${hospital._id}`)
    const unsubscribe = onValue(queuesRef, (snapshot) => {
       if (snapshot.exists()) setLiveQueueData(snapshot.val())
       else setLiveQueueData({})
    })
    return () => off(queuesRef)
  }, [hospital?._id])

  // POLLING
  useEffect(() => {
    if (!hospital?._id) return
    const interval = setInterval(() => {
        fetchAppointments(appointmentsFilter, selectedDate)
        fetchNotifications()
        fetchStats() 
    }, 30000) 
    return () => clearInterval(interval)
  }, [hospital?._id, fetchAppointments, fetchNotifications, fetchStats, appointmentsFilter, selectedDate])

  // Redirect
  useEffect(() => {
    if (!isLoaded || !isSignedIn || hospitalLoading) return
    if (pathname?.includes('/hospital-admin/setup')) return
    if (user?.role === 'hospital_admin' && !hospital && !hospitalError) {
      router.push('/hospital-admin/setup')
    }
  }, [isLoaded, isSignedIn, hospitalLoading, hospital, hospitalError, router, pathname, user?.role])

  const value = useMemo(() => ({
      user, isLoaded, isSignedIn,
      hospital, hospitalLoading, hospitalError, adminInfo, fetchHospital,
      stats, statsLoading, fetchStats,
      appointments, appointmentsLoading, appointmentsFilter, selectedDate, setSelectedDate, 
      fetchAppointments, updateAppointmentStatus,
      doctors, doctorsLoading, pendingDoctorRequests, fetchDoctors, 
      patients, patientsLoading, todayPatients, fetchPatients,
      staff, staffLoading, fetchStaff,
      inventory, inventoryLoading, inventoryStats, inventoryFilters, lowStockItems, fetchInventory, fetchInventoryStats, addInventoryItem,
      notifications, unreadCount, fetchNotifications, 
      
      // ✅ EXPOSE LIVE DATA
      liveQueueData, 

      refreshAll,
    }),
    [
      user, isLoaded, isSignedIn,
      hospital, hospitalLoading, hospitalError, adminInfo, fetchHospital,
      stats, statsLoading, fetchStats,
      appointments, appointmentsLoading, appointmentsFilter, selectedDate, 
      fetchAppointments, updateAppointmentStatus,
      doctors, doctorsLoading, pendingDoctorRequests, fetchDoctors, 
      patients, patientsLoading, todayPatients, fetchPatients,
      staff, staffLoading, fetchStaff,
      inventory, inventoryLoading, inventoryStats, inventoryFilters, lowStockItems, fetchInventory, fetchInventoryStats,
      notifications, unreadCount, fetchNotifications,
      liveQueueData, 
      refreshAll
    ]
  )

  return <HospitalAdminContext.Provider value={value}>{children}</HospitalAdminContext.Provider>
}
