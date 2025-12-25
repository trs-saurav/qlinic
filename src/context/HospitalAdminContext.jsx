'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import toast from 'react-hot-toast'

// Create Context
const HospitalAdminContext = createContext(undefined)

// Custom hook to use the context
export const useHospitalAdmin = () => {
  const context = useContext(HospitalAdminContext)
  if (!context) {
    throw new Error('useHospitalAdmin must be used within HospitalAdminProvider')
  }
  return context
}

// Provider Component
export const HospitalAdminProvider = ({ children }) => {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  // ============ STATE MANAGEMENT ============
  
  // Hospital Core Data
  const [hospital, setHospital] = useState(null)
  const [hospitalLoading, setHospitalLoading] = useState(true)
  const [hospitalError, setHospitalError] = useState(null)

  // Dashboard Stats
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
    revenue: {
      today: 0,
      month: 0,
      year: 0,
    },
  })
  const [statsLoading, setStatsLoading] = useState(false)

  // Appointments
  const [appointments, setAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [appointmentsFilter, setAppointmentsFilter] = useState('all') // all, today, upcoming, past

  // Doctors
  const [doctors, setDoctors] = useState([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [pendingDoctorRequests, setPendingDoctorRequests] = useState([])

  // Patients
  const [patients, setPatients] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [todayPatients, setTodayPatients] = useState([])

  // Staff
  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)

  // Inventory
  const [inventory, setInventory] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [lowStockItems, setLowStockItems] = useState([])

  // Notifications
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Settings
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    privacy: {
      showProfile: true,
      allowMessages: true,
    },
    theme: 'light',
  })

  // ============ FETCH FUNCTIONS ============

  // Fetch Hospital Profile
  const fetchHospital = useCallback(async () => {
    if (!user) return

    try {
      setHospitalLoading(true)
      setHospitalError(null)

      console.log('🏥 Fetching hospital profile...')
      const res = await fetch('/api/hospital/profile')
      const data = await res.json()

      if (res.ok) {
        if (data.hospital) {
          setHospital(data.hospital)
          console.log('✅ Hospital loaded:', data.hospital.name)
        } else {
          // No hospital found, redirect to setup
          console.log('⚠️ No hospital found, redirecting to setup')
          if (pathname !== '/hospital-admin/setup') {
            router.push('/hospital-admin/setup')
          }
        }
      } else {
        setHospitalError(data.error || 'Failed to load hospital')
        if (res.status === 404 && pathname !== '/hospital-admin/setup') {
          router.push('/hospital-admin/setup')
        }
      }
    } catch (err) {
      console.error('❌ Error fetching hospital:', err)
      setHospitalError('Failed to load hospital data')
      toast.error('Failed to load hospital data')
    } finally {
      setHospitalLoading(false)
    }
  }, [user, router, pathname])

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    if (!hospital?._id) return

    try {
      setStatsLoading(true)
      const res = await fetch(`/api/hospital/dashboard/stats?hospitalId=${hospital._id}`)
      const data = await res.json()

      if (res.ok) {
        setStats(data.stats)
        console.log('📊 Stats loaded')
      }
    } catch (err) {
      console.error('❌ Error fetching stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [hospital?._id])

  // Fetch Appointments
  const fetchAppointments = useCallback(async (filter = 'all') => {
    if (!hospital?._id) return

    try {
      setAppointmentsLoading(true)
      const params = new URLSearchParams({
        hospitalId: hospital._id,
        filter,
      })

      const res = await fetch(`/api/hospital/appointments?${params}`)
      const data = await res.json()

      if (res.ok) {
        setAppointments(data.appointments || [])
        setAppointmentsFilter(filter)
        console.log(`📅 Appointments loaded (${filter}):`, data.appointments?.length)
      } else {
        toast.error('Failed to load appointments')
      }
    } catch (err) {
      console.error('❌ Error fetching appointments:', err)
      toast.error('Failed to load appointments')
    } finally {
      setAppointmentsLoading(false)
    }
  }, [hospital?._id])

  // Fetch Doctors
  const fetchDoctors = useCallback(async () => {
    if (!hospital?._id) return

    try {
      setDoctorsLoading(true)
      const res = await fetch(`/api/hospital/doctors?hospitalId=${hospital._id}`)
      const data = await res.json()

      if (res.ok) {
        setDoctors(data.doctors || [])
        setPendingDoctorRequests(data.pendingRequests || [])
        console.log('👨‍⚕️ Doctors loaded:', data.doctors?.length)
      } else {
        toast.error('Failed to load doctors')
      }
    } catch (err) {
      console.error('❌ Error fetching doctors:', err)
      toast.error('Failed to load doctors')
    } finally {
      setDoctorsLoading(false)
    }
  }, [hospital?._id])

  // Fetch Patients
  const fetchPatients = useCallback(async () => {
    if (!hospital?._id) return

    try {
      setPatientsLoading(true)
      const res = await fetch(`/api/hospital/patients?hospitalId=${hospital._id}`)
      const data = await res.json()

      if (res.ok) {
        setPatients(data.patients || [])
        setTodayPatients(data.todayPatients || [])
        console.log('👥 Patients loaded:', data.patients?.length)
      } else {
        toast.error('Failed to load patients')
      }
    } catch (err) {
      console.error('❌ Error fetching patients:', err)
      toast.error('Failed to load patients')
    } finally {
      setPatientsLoading(false)
    }
  }, [hospital?._id])

  // Fetch Staff
  const fetchStaff = useCallback(async () => {
    if (!hospital?._id) return

    try {
      setStaffLoading(true)
      const res = await fetch(`/api/hospital/staff?hospitalId=${hospital._id}`)
      const data = await res.json()

      if (res.ok) {
        setStaff(data.staff || [])
        console.log('👨‍💼 Staff loaded:', data.staff?.length)
      } else {
        toast.error('Failed to load staff')
      }
    } catch (err) {
      console.error('❌ Error fetching staff:', err)
      toast.error('Failed to load staff')
    } finally {
      setStaffLoading(false)
    }
  }, [hospital?._id])

  // Fetch Inventory
  const fetchInventory = useCallback(async () => {
    if (!hospital?._id) return

    try {
      setInventoryLoading(true)
      const res = await fetch(`/api/hospital/inventory?hospitalId=${hospital._id}`)
      const data = await res.json()

      if (res.ok) {
        setInventory(data.inventory || [])
        setLowStockItems(data.lowStock || [])
        console.log('📦 Inventory loaded:', data.inventory?.length)
      } else {
        toast.error('Failed to load inventory')
      }
    } catch (err) {
      console.error('❌ Error fetching inventory:', err)
      toast.error('Failed to load inventory')
    } finally {
      setInventoryLoading(false)
    }
  }, [hospital?._id])

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    if (!hospital?._id) return

    try {
      const res = await fetch(`/api/hospital/notifications?hospitalId=${hospital._id}`)
      const data = await res.json()

      if (res.ok) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('❌ Error fetching notifications:', err)
    }
  }, [hospital?._id])

  // ============ ACTION FUNCTIONS ============

  // Update Hospital Profile
  const updateHospital = async (updates) => {
    if (!hospital?._id) return { success: false, error: 'No hospital found' }

    try {
      const res = await fetch('/api/hospital/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId: hospital._id, ...updates }),
      })

      const data = await res.json()

      if (res.ok) {
        setHospital(data.hospital)
        toast.success('Hospital updated successfully')
        return { success: true, hospital: data.hospital }
      } else {
        toast.error(data.error || 'Failed to update hospital')
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('❌ Error updating hospital:', err)
      toast.error('Failed to update hospital')
      return { success: false, error: err.message }
    }
  }

  // Create Appointment
  const createAppointment = async (appointmentData) => {
    try {
      const res = await fetch('/api/hospital/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...appointmentData, hospitalId: hospital._id }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Appointment created successfully')
        await fetchAppointments(appointmentsFilter)
        await fetchStats()
        return { success: true, appointment: data.appointment }
      } else {
        toast.error(data.error || 'Failed to create appointment')
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('❌ Error creating appointment:', err)
      toast.error('Failed to create appointment')
      return { success: false, error: err.message }
    }
  }

  // Update Appointment Status
  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const res = await fetch(`/api/hospital/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Appointment ${status}`)
        await fetchAppointments(appointmentsFilter)
        await fetchStats()
        return { success: true }
      } else {
        toast.error(data.error || 'Failed to update appointment')
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('❌ Error updating appointment:', err)
      toast.error('Failed to update appointment')
      return { success: false, error: err.message }
    }
  }

  // Approve Doctor Request
  const approveDoctorRequest = async (affiliationId) => {
    try {
      const res = await fetch(`/api/hospital/doctors/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliationId, hospitalId: hospital._id }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Doctor approved successfully')
        await fetchDoctors()
        await fetchStats()
        return { success: true }
      } else {
        toast.error(data.error || 'Failed to approve doctor')
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('❌ Error approving doctor:', err)
      toast.error('Failed to approve doctor')
      return { success: false, error: err.message }
    }
  }

  // Mark Notification as Read
  const markNotificationRead = async (notificationId) => {
    try {
      const res = await fetch(`/api/hospital/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('❌ Error marking notification read:', err)
    }
  }

  // Refresh All Data
  const refreshAll = useCallback(async () => {
    if (!hospital?._id) return
    
    console.log('🔄 Refreshing all hospital data...')
    await Promise.all([
      fetchStats(),
      fetchAppointments(appointmentsFilter),
      fetchDoctors(),
      fetchPatients(),
      fetchNotifications(),
    ])
    console.log('✅ All data refreshed')
  }, [hospital?._id, appointmentsFilter, fetchStats, fetchAppointments, fetchDoctors, fetchPatients, fetchNotifications])

  // ============ EFFECTS ============

  // Initial load - Fetch hospital profile
  useEffect(() => {
    if (isLoaded && user) {
      fetchHospital()
    }
  }, [isLoaded, user, fetchHospital])

  // Load dashboard stats when hospital is ready
  useEffect(() => {
    if (hospital?._id) {
      fetchStats()
      fetchNotifications()
    }
  }, [hospital?._id, fetchStats, fetchNotifications])

  // ============ CONTEXT VALUE ============
  const value = {
    // Hospital Core
    hospital,
    hospitalLoading,
    hospitalError,
    fetchHospital,
    updateHospital,

    // Dashboard Stats
    stats,
    statsLoading,
    fetchStats,

    // Appointments
    appointments,
    appointmentsLoading,
    appointmentsFilter,
    fetchAppointments,
    createAppointment,
    updateAppointmentStatus,

    // Doctors
    doctors,
    doctorsLoading,
    pendingDoctorRequests,
    fetchDoctors,
    approveDoctorRequest,

    // Patients
    patients,
    patientsLoading,
    todayPatients,
    fetchPatients,

    // Staff
    staff,
    staffLoading,
    fetchStaff,

    // Inventory
    inventory,
    inventoryLoading,
    lowStockItems,
    fetchInventory,

    // Notifications
    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationRead,

    // Settings
    settings,
    setSettings,

    // Utilities
    refreshAll,
  }

  return (
    <HospitalAdminContext.Provider value={value}>
      {children}
    </HospitalAdminContext.Provider>
  )
}
