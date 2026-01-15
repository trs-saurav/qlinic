// src/app/user/appointments/page.jsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/context/UserContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Filter, Search, Calendar, RefreshCcw } from 'lucide-react'
import toast from 'react-hot-toast'

// Import Sub-components (Create these files as shown below)
import AppointmentCard from  '@/components/user/appointments/AppointmentCard'
import AppointmentDetailsModal from '@/components/user/appointments/AppointmentDetailsModal'
import RescheduleModal from '@/components/user/appointments/RescheduleModal'
import NextVisitBookingModal from '@/components/user/appointments/NextVisitBookingModal'

export default function UserAppointmentsPage() {
  const { appointments, refreshData, fetchAppointmentsWithFilter, familyMembers } = useUser()
  const [filteredAppointments, setFilteredAppointments] = useState([])
  
  // State
  const [activeTab, setActiveTab] = useState('upcoming')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [familyMemberFilter, setFamilyMemberFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Modal States
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [isNextVisitOpen, setIsNextVisitOpen] = useState(false)
  
  // Data States for Modals
  const [rescheduleData, setRescheduleData] = useState({ 
    appointmentId: null, newDate: '', newTime: '', reason: '', instructions: '' 
  })
  const [nextVisitData, setNextVisitData] = useState({ 
    parentAppointmentId: null, doctorId: null, hospitalId: null, 
    scheduledDate: '', scheduledTime: '', reason: '', instructions: '' 
  })

  // Fetch Data
  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      if (fetchAppointmentsWithFilter) {
        await fetchAppointmentsWithFilter(familyMemberFilter === 'self' ? null : familyMemberFilter);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [refreshData, familyMemberFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter Logic
  const filterAppointments = useCallback(() => {
    let filtered = [...appointments]
    const now = new Date()

    // 1. Tab Logic (Switch Case for Data Filtering)
    switch (activeTab) {
      case 'ongoing':
        filtered = filtered.filter(a => 
          ['CHECKED_IN', 'IN_CONSULTATION'].includes(a.status) ||
          (a.status === 'BOOKED' && new Date(a.scheduledTime) <= now && new Date(a.scheduledTime).toDateString() === now.toDateString())
        )
        break
      case 'upcoming':
        filtered = filtered.filter(a => 
          new Date(a.scheduledTime) > now && 
          ['BOOKED'].includes(a.status)
        )
        break
      case 'completed':
        filtered = filtered.filter(a => a.status === 'COMPLETED')
        break
      case 'past':
        filtered = filtered.filter(a => 
          ['CANCELLED', 'SKIPPED'].includes(a.status) || 
          (new Date(a.scheduledTime) < now && a.status !== 'COMPLETED' && !['CHECKED_IN', 'IN_CONSULTATION'].includes(a.status))
        )
        break
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(a => a.status === statusFilter)
    }

    // 3. Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        a.doctorId?.firstName?.toLowerCase().includes(q) ||
        a.doctorId?.lastName?.toLowerCase().includes(q) ||
        a.hospitalId?.name?.toLowerCase().includes(q)
      )
    }

    setFilteredAppointments(filtered)
  }, [statusFilter, searchQuery, appointments, activeTab])

  useEffect(() => {
    filterAppointments()
  }, [filterAppointments])


  // Actions
  const handleStatusUpdate = async (id, newStatus) => {
    const loadingToast = toast.loading('Updating status...')
    try {
      const res = await fetch(`/api/appointment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Marked as ${newStatus}`, { id: loadingToast })
        fetchAppointments()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast.error('Failed to update status', { id: loadingToast })
    }
  }

  const handleReschedule = async () => {
    const { appointmentId, newDate, newTime, reason, instructions } = rescheduleData;
    const newScheduledTime = new Date(`${newDate}T${newTime}`);

    const loadingToast = toast.loading('Rescheduling appointment...')
    try {
      const res = await fetch(`/api/appointment/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            scheduledTime: newScheduledTime.toISOString(),
            rescheduleReason: reason, 
            instructions: instructions
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Appointment rescheduled', { id: loadingToast })
        setIsRescheduleOpen(false)
        fetchAppointments()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast.error('Failed to reschedule', { id: loadingToast })
    }
  }

  const handleBookNextVisit = async () => {
    const loadingToast = toast.loading('Booking next visit...')
    try {
        const res = await fetch('/api/appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nextVisitData)
        })
        const data = await res.json()
        if (data.success) {
            toast.success('Next visit booked successfully', { id: loadingToast })
            setIsNextVisitOpen(false)
            fetchAppointments()
        } else {
            throw new Error(data.error)
        }
    } catch (error) {
        toast.error('Failed to book next visit', { id: loadingToast })
    }
  }

  // --- Render Helpers ---
  const renderContent = () => {
    if (isLoading) return <div className="p-10 text-center">Loading...</div>
    
    if (filteredAppointments.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No {activeTab} appointments found.</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {filteredAppointments.map((apt) => (
          <AppointmentCard
            key={apt._id}
            appointment={apt}
            activeTab={activeTab}
            familyMemberFilter={familyMemberFilter} // FIX: Passed prop here
            onViewDetails={() => { setSelectedAppointment(apt); setIsDetailsOpen(true) }}
            onCancel={() => handleStatusUpdate(apt._id, 'CANCELLED')}
            onComplete={() => handleStatusUpdate(apt._id, 'COMPLETED')}
            onReschedule={(apt) => {
              const d = new Date(apt.scheduledTime)
              setRescheduleData({ 
                appointmentId: apt._id, 
                newDate: d.toISOString().split('T')[0], 
                newTime: d.toTimeString().slice(0, 5),
                reason: '',
                instructions: ''
              })
              setIsRescheduleOpen(true)
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">My Appointments</h1>
        
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search doctor or hospital..." 
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={familyMemberFilter} onValueChange={setFamilyMemberFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="self">Self</SelectItem>
                {familyMembers.map(m => (
                  <SelectItem key={m._id} value={m._id}>{m.firstName} ({m.relationship})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="BOOKED">Booked</SelectItem>
                    <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                    <SelectItem value="IN_CONSULTATION">In Consultation</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="SKIPPED">Skipped</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchAppointments}>
              <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </Card>
      </div>

      {/* Tabs System */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="past">Past/Cancelled</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          {renderContent()}
        </div>
      </Tabs>

      {/* Modals */}
      {selectedAppointment && (
        <AppointmentDetailsModal 
          isOpen={isDetailsOpen} 
          onClose={() => setIsDetailsOpen(false)} 
          appointment={selectedAppointment}
          onBookNextVisit={(data) => {
             setNextVisitData(data)
             setIsNextVisitOpen(true)
          }}
        />
      )}
      
      <RescheduleModal 
        isOpen={isRescheduleOpen} 
        onClose={() => setIsRescheduleOpen(false)} 
        data={rescheduleData}
        setData={setRescheduleData}
        onConfirm={handleReschedule} 
      />

      <NextVisitBookingModal
        isOpen={isNextVisitOpen}
        onClose={() => setIsNextVisitOpen(false)}
        data={nextVisitData}
        setData={setNextVisitData}
        onSuccess={handleBookNextVisit}
      />
    </div>
  )
}
