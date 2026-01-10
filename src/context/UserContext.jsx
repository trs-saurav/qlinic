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
  const [allAppointments, setAllAppointments] = useState([]) // Store all appointments
  const [loading, setLoading] = useState(true)

  const fetchAllUserData = useCallback(async () => {
    if (status !== 'authenticated') return

    try {
      setLoading(true)
      const [profileRes, recordsRes, familyRes, appointmentsRes] = await Promise.all([
        fetch('/api/patient/profile'),
        fetch('/api/patient/records'),
        fetch('/api/patient/family'),
        fetch('/api/patient/appointments')
      ])

      if (profileRes.ok) {
         const data = await profileRes.json()
         setUser(data.user)
      }
      if (recordsRes.ok) {
         const data = await recordsRes.json()
         setMedicalRecords(data.records || [])
      }
      if (familyRes.ok) {
         const data = await familyRes.json()
         // Some APIs return { members: [] } others { familyMembers: [] } - handle both
         setFamilyMembers(data.members || data.familyMembers || [])
      }
      if (appointmentsRes.ok) {
         const data = await appointmentsRes.json()
         const fetchedAppointments = data.appointments || []
         setAppointments(fetchedAppointments)
         setAllAppointments(fetchedAppointments) // Store all appointments
      }

    } catch (err) {
      console.error('Error fetching user data:', err)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllUserData()
    } else if (status === 'unauthenticated') {
      setUser(null)
      setFamilyMembers([])
      setMedicalRecords([])
      setAppointments([])
      setLoading(false)
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
      // API usually returns { success: true, member: {...} }
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
        method: 'PATCH', // or PUT depending on your API
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
    try {
      let url = '/api/patient/appointments';
      if (familyMemberId && familyMemberId !== 'self') {
        url += `?familyMemberId=${familyMemberId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setAppointments(data.appointments || []);
        return { success: true, appointments: data.appointments || [] };
      } else {
        throw new Error(data.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments with filter:', err);
      toast.error('Failed to load appointments');
      return { success: false, error: err.message };
    }
  };

  // --- MEDICAL RECORDS ---

  // NOTE: This doesn't actually upload (since uploads use FormData),
  // but acts as a helper to update local state after successful upload elsewhere.
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
    allAppointments, // Expose all appointments
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
    
    // Records (New!)
    addMedicalRecord, 
    deleteMedicalRecord,
    setMedicalRecords // Expose setter just in case
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
