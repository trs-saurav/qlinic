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

// Import Sub-components
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
    parentAppointmentId: null, 
    doctorId: null, 
    hospitalId: null, 
    scheduledDate: '', 
    scheduledTime: '', 
    reason: '', 
    instructions: '' 
  })

  // Fetch Data
  const fetchAppointments = async () => {
    console.log('🔄 fetchAppointments called')
    setIsLoading(true)
    try {
      if (fetchAppointmentsWithFilter) {
        console.log('🔄 Calling fetchAppointmentsWithFilter with filter:', familyMemberFilter === 'self' ? null : familyMemberFilter)
        await fetchAppointmentsWithFilter(familyMemberFilter === 'self' ? null : familyMemberFilter)
        console.log('🔄 fetchAppointmentsWithFilter completed')
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
    } finally {
      setIsLoading(false)
      console.log('🔄 fetchAppointments completed')
    }
    
    console.log('📋 Appointments after fetch:', appointments.length)
  }

  useEffect(() => {
    fetchAppointments()
  }, [refreshData, familyMemberFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter Logic
  const filterAppointments = useCallback(() => {
    let filtered = [...appointments]
    const now = new Date()

    // 1. Tab Logic
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

  const handleReschedule = async (updatedData) => {  // ✅ Accept data parameter
    console.log('🔍 HANDLE RESCHEDULE CALLED')
    console.log('📋 Reschedule Data:', updatedData)

    const loadingToast = toast.loading('Rescheduling appointment...')
    try {
      console.log('📤 Sending PATCH request')
      
      const res = await fetch(`/api/appointment/${updatedData.appointmentId || rescheduleData.appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduledTime: updatedData.scheduledTime,
          reason: updatedData.reason, 
          instructions: updatedData.instructions
        })
      })
      
      console.log('📨 Response status:', res.status)
      const data = await res.json()
      console.log('📥 Response data:', data)
      
      if (data.success) {
        console.log('✅ Reschedule successful!')
        toast.success('Appointment rescheduled successfully!', { id: loadingToast })
        setIsRescheduleOpen(false)
        
        // Reset reschedule data
        setRescheduleData({ 
          appointmentId: null, 
          newDate: '', 
          newTime: '', 
          reason: '', 
          instructions: '' 
        })
        
        // Refresh appointments
        await fetchAppointments()
        console.log('🔄 Appointments refreshed after reschedule')
      } else {
        console.error('❌ Reschedule failed:', data.error)
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('💥 Reschedule error:', error)
      toast.error(error.message || 'Failed to reschedule', { id: loadingToast })
    }
  }

  const handleBookNextVisit = async (appointmentData) => {  // ✅ Accept data parameter
    console.log('📋 Booking next visit with data:', appointmentData)
    
    const loadingToast = toast.loading('Booking next visit...')
    try {
      // Prepare the request body
      const requestBody = {
        patientId: selectedAppointment?.patientId?._id || selectedAppointment?.patientId,
        patientModel: selectedAppointment?.patientModel || 'User',
        doctorId: selectedAppointment?.doctorId?._id || selectedAppointment?.doctorId,
        hospitalId: selectedAppointment?.hospitalId?._id || selectedAppointment?.hospitalId,
        scheduledTime: appointmentData.dateTime,
        reason: appointmentData.reason || 'Follow-up appointment',
        instructions: appointmentData.instructions || '',
        type: 'FOLLOW_UP',
        status: 'BOOKED'
      }
      
      console.log('📤 Sending POST request:', requestBody)
      
      const res = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      const data = await res.json()
      console.log('📥 Response:', data)
      
      if (data.success) {
        toast.success('Follow-up appointment booked successfully!', { id: loadingToast })
        setIsNextVisitOpen(false)
        
        // Reset next visit data
        setNextVisitData({ 
          parentAppointmentId: null, 
          doctorId: null, 
          hospitalId: null, 
          scheduledDate: '', 
          scheduledTime: '', 
          reason: '', 
          instructions: '' 
        })
        
        // Refresh appointments
        await fetchAppointments()
      } else {
        throw new Error(data.error || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('💥 Error booking next visit:', error)
      toast.error(error.message || 'Failed to book next visit', { id: loadingToast })
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
            familyMemberFilter={familyMemberFilter}
            onViewDetails={() => { 
              setSelectedAppointment(apt)
              setIsDetailsOpen(true) 
            }}
            onCancel={() => handleStatusUpdate(apt._id, 'CANCELLED')}
            onComplete={() => handleStatusUpdate(apt._id, 'COMPLETED')}
            onReschedule={(apt) => {
              setSelectedAppointment(apt)
              const d = new Date(apt.scheduledTime)
              setRescheduleData({ 
                appointmentId: apt._id, 
                newDate: d.toISOString().split('T')[0], 
                newTime: d.toTimeString().slice(0, 5),
                reason: '',
                instructions: ''
              })
              setTimeout(() => {
                setIsRescheduleOpen(true)
              }, 10)
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
        <>
          <AppointmentDetailsModal 
            isOpen={isDetailsOpen} 
            onClose={() => {
              setIsDetailsOpen(false)
              setSelectedAppointment(null)
            }}
            appointment={selectedAppointment}
            onBookNextVisit={(data) => {
              console.log('📋 Book next visit triggered with data:', data)
              setNextVisitData(data)
              setIsDetailsOpen(false)
              // Small delay to ensure details modal is closed
              setTimeout(() => {
                setIsNextVisitOpen(true)
              }, 100)
            }}
          />
          
          <RescheduleModal 
            key={`reschedule-${selectedAppointment._id}`}
            isOpen={isRescheduleOpen} 
            onClose={() => {
              setIsRescheduleOpen(false)
              setSelectedAppointment(null)
            }}
            data={rescheduleData}
            setData={setRescheduleData}
            onConfirm={handleReschedule}  // ✅ Pass data to handler
            doctor={selectedAppointment.doctorId}
            hospital={selectedAppointment.hospitalId}
          />

          <NextVisitBookingModal
            key={`next-visit-${selectedAppointment._id}`}
            isOpen={isNextVisitOpen}
            onClose={() => {
              setIsNextVisitOpen(false)
              setSelectedAppointment(null)
            }}
            data={nextVisitData}
            setData={setNextVisitData}
            onSuccess={handleBookNextVisit}  // ✅ Pass data to handler
            doctor={selectedAppointment.doctorId}  // ✅ Pass doctor
            hospital={selectedAppointment.hospitalId}  // ✅ Pass hospital
            recommendedDate={selectedAppointment.nextVisit?.date}  // ✅ Pass recommended date
          />
        </>
      )}
    </div>
  )
}
