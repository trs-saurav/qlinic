// src/components/patient/PatientDashboard.jsx
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardOverview from './DashboardOverview'
import HospitalSearch from './HospitalSearch'
import AppointmentsList from './AppointmentsList'
import FamilyMembers from './FamilyMembers'
import MedicalRecords from './MedicalRecords'

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isSyncing, setIsSyncing] = useState(false)

  // 🔧 ADD THIS SYNC FUNCTION
  const handleSyncUser = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/user/sync', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('✅ User synced to database! All features now working 🚀')
        // Refresh all data
        window.location.reload()
      } else {
        toast.error(data.error || 'Sync failed')
      }
    } catch (error) {
      toast.error('Failed to sync user')
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    const handleTabChange = (event) => {
      setActiveTab(event.detail)
    }

    window.addEventListener('patientTabChange', handleTabChange)
    return () => window.removeEventListener('patientTabChange', handleTabChange)
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />
      case 'hospitals':
        return <HospitalSearch />
      case 'appointments':
        return <AppointmentsList />
      case 'family':
        return <FamilyMembers />
      case 'records':
        return <MedicalRecords />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 🔧 SYNC BUTTON - Only show if needed */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-slate-700">Patient Portal Active</span>
        </div>
        <Button 
          onClick={handleSyncUser} 
          disabled={isSyncing}
          variant="outline"
          size="sm"
          className="gap-2 border-blue-200 hover:border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : '🔄 Sync Database'}
        </Button>
      </div>

      {renderContent()}
    </div>
  )
}
