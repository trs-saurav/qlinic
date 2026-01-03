'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

// Create Context
const UserContext = createContext(undefined)

// Custom Hook
export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Provider Component
export const UserProvider = ({ children }) => {
  const { data: session, status } = useSession()
  
  // State for all data
  const [user, setUser] = useState(null)
  const [medicalRecords, setMedicalRecords] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [appointments, setAppointments] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 1. Centralized Fetcher
  const fetchAllUserData = useCallback(async () => {
    if (status !== 'authenticated') return

    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [profileRes, recordsRes, familyRes, appointmentsRes] = await Promise.all([
        fetch('/api/patient/profile'),
        fetch('/api/patient/medical-records'),
        fetch('/api/patient/family-members'),
        fetch('/api/patient/appointments')
      ])

      // Handle Profile (Critical)
      if (!profileRes.ok) throw new Error('Failed to load profile')
      const profileData = await profileRes.json()
      setUser(profileData.user)

      // Handle Medical Records (Non-critical)
      if (recordsRes.ok) {
        const recordsData = await recordsRes.json()
        setMedicalRecords(recordsData.records || [])
      }

      // Handle Family Members (Non-critical)
      if (familyRes.ok) {
        const familyData = await familyRes.json()
        setFamilyMembers(familyData.members || [])
      }
      
      // Handle Appointments (Non-critical)
      if (appointmentsRes.ok) {
        const apptData = await appointmentsRes.json()
        setAppointments(apptData.appointments || [])
      }

      setError(null)
    } catch (err) {
      console.error('Error fetching user data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [status])

  // 2. Initial Fetch
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllUserData()
    } else if (status === 'unauthenticated') {
      setUser(null)
      setMedicalRecords([])
      setFamilyMembers([])
      setAppointments([])
      setLoading(false)
    }
  }, [status, fetchAllUserData])

  // 3. Helper Actions (CRUD)

  // Update Profile
  const updateProfile = async (formData) => {
    try {
      const res = await fetch('/api/patient/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Update failed')
      
      // Optimistic Update
      setUser(prev => ({ ...prev, ...formData }))
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (err) {
      toast.error(err.message)
      return { success: false, error: err.message }
    }
  }

  // Add Family Member
  const addFamilyMember = async (memberData) => {
    try {
      const res = await fetch('/api/patient/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      })
      if (!res.ok) throw new Error('Failed to add member')
      
      const newItem = await res.json()
      setFamilyMembers(prev => [...prev, newItem.member])
      toast.success('Family member added')
      return { success: true }
    } catch (err) {
      toast.error(err.message)
      return { success: false }
    }
  }

  // Upload Medical Record
  const uploadMedicalRecord = async (formData) => {
      // Logic for uploading record...
      // After success:
      // setMedicalRecords(prev => [newRecord, ...prev])
  }

  // Value object
  const value = {
    user,
    medicalRecords,
    familyMembers,
    appointments,
    loading,
    error,
    isAuthenticated: status === 'authenticated',
    
    // Actions
    refreshData: fetchAllUserData,
    updateProfile,
    addFamilyMember,
    uploadMedicalRecord
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
