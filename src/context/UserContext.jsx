'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const UserContext = createContext(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}

export const UserProvider = ({ children }) => {
  const { data: session, status } = useSession()
  
  const [user, setUser] = useState(null)
  const [medicalRecords, setMedicalRecords] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [appointments, setAppointments] = useState([])
  const [allAppointments, setAllAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAllUserData = useCallback(async () => {
    // ✅ FIX: Only fetch if authenticated
    if (status !== 'authenticated') {
      setLoading(false)
      return
    }

    // ✅ FIX: Only fetch if user role (patient/user)
    const userRole = session?.user?.role
    if (!userRole || (userRole !== 'user' && userRole !== 'patient')) {
      console.log('Skipping user data fetch - role is:', userRole)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      console.log('🔵 Fetching user data for role:', userRole)
      
      const [profileRes, recordsRes, familyRes, appointmentsRes] = await Promise.all([
        fetch('/api/patient/profile'),
        fetch('/api/patient/records'),
        fetch('/api/patient/family'),
        fetch('/api/patient/appointments')
      ])

      if (profileRes.ok) {
         const data = await profileRes.json()
         setUser(data.user)
      } else {
        console.error('Profile fetch failed:', await profileRes.text())
      }
      
      if (recordsRes.ok) {
         const data = await recordsRes.json()
         setMedicalRecords(data.records || [])
      } else {
        console.error('Records fetch failed:', await recordsRes.text())
      }
      
      if (familyRes.ok) {
         const data = await familyRes.json()
         setFamilyMembers(data.members || data.familyMembers || [])
      } else {
        console.error('Family fetch failed:', await familyRes.text())
      }
      
      if (appointmentsRes.ok) {
         const data = await appointmentsRes.json()
         const fetchedAppointments = data.appointments || []
         setAppointments(fetchedAppointments)
         setAllAppointments(fetchedAppointments)
      } else {
        console.error('Appointments fetch failed:', await appointmentsRes.text())
      }

    } catch (err) {
      console.error('Error fetching user data:', err)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [status, session]) // ✅ FIX: Add session to dependencies

  // Force refresh of all user data with user feedback
  const forceRefreshAll = useCallback(async () => {
    console.log('🔄 Forcing refresh of all user data')
    try {
      await fetchAllUserData();
      toast.success('Data refreshed successfully')
    } catch (error) {
      console.error('❌ Error during forced refresh:', error)
      toast.error('Failed to refresh data')
    }
  }, [fetchAllUserData])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllUserData()
    } else if (status === 'unauthenticated') {
      setUser(null)
      setFamilyMembers([])
      setMedicalRecords([])
      setAppointments([])
      setAllAppointments([])
      setLoading(false)
    } else if (status === 'loading') {
      setLoading(true)
    }
  }, [status, fetchAllUserData])

  // --- ACTIONS ---

  const updateProfile = async (formData) => {
    try {
      const res = await fetch('/api/patient/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Update failed')
      
      setUser(prev => ({ ...prev, ...formData }))
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (err) {
      toast.error(err.message)
      return { success: false }
    }
  }

  // --- FAMILY MEMBERS ---

  const addFamilyMember = async (memberData) => {
    try {
      const res = await fetch('/api/patient/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      })
      if (!res.ok) throw new Error('Failed to add member')
      
      const newItem = await res.json()
      const member = newItem.member || newItem.familyMember
      
      if (member) {
          setFamilyMembers(prev => [...prev, member]) 
      }
      
      toast.success('Family member added')
      return { success: true }
    } catch (err) {
      toast.error(err.message)
      return { success: false }
    }
  }

  const updateFamilyMember = async (id, memberData) => {
    try {
      const res = await fetch(`/api/patient/family/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      })
      if (!res.ok) throw new Error('Failed to update member')
      
      const updatedItem = await res.json()
      const member = updatedItem.member || updatedItem.familyMember
      
      if (member) {
          setFamilyMembers(prev => prev.map(m => m._id === id ? member : m))
      }
      
      toast.success('Member updated')
      return { success: true }
    } catch (err) {
      toast.error(err.message)
      return { success: false }
    }
  }

  const deleteFamilyMember = async (id) => {
    try {
      const res = await fetch(`/api/patient/family/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete member')
      
      setFamilyMembers(prev => prev.filter(m => m._id !== id))
      toast.success('Member removed')
      return { success: true }
    } catch (err) {
      toast.error(err.message)
      return { success: false }
    }
  }

  // --- APPOINTMENTS ---

  const fetchAppointmentsWithFilter = async (familyMemberId = null) => {
    console.log('Fetching appointments for familyMemberId:', familyMemberId)
    try {
      let url = '/api/patient/appointments'
      if (familyMemberId && familyMemberId !== 'self') {
        url += `?familyMemberId=${familyMemberId}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setAppointments(data.appointments || [])
        return { success: true, appointments: data.appointments || [] }
      } else {
        throw new Error(data.error || 'Failed to fetch appointments')
      }
    } catch (err) {
      console.error('Error fetching appointments with filter:', err)
      toast.error('Failed to load appointments')
      return { success: false, error: err.message }
    }
  }

  // --- MEDICAL RECORDS ---

  const addMedicalRecord = (newRecord) => {
    setMedicalRecords(prev => [newRecord, ...prev])
  }

  const deleteMedicalRecord = async (id) => {
    try {
      const res = await fetch(`/api/patient/records/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete record')
      
      setMedicalRecords(prev => prev.filter(r => r._id !== id))
      toast.success('Record deleted')
      return { success: true }
    } catch (err) {
      toast.error(err.message)
      return { success: false }
    }
  }

  const value = {
    user,
    medicalRecords,
    familyMembers,
    appointments,
    allAppointments,
    loading,
    isAuthenticated: status === 'authenticated',
    refreshData: fetchAllUserData,
    
    // Profile
    updateProfile,
    
    // Family
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,

    // Appointments
    fetchAppointmentsWithFilter,
    
    // Records
    addMedicalRecord, 
    deleteMedicalRecord,
    setMedicalRecords,
    
    // Additional functions
    forceRefreshAll,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
