'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/context/UserContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Filter, Search, Calendar, RefreshCw, 
  Clock, CheckCircle, XCircle, History,
  User, Users, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

// Import Sub-components
import AppointmentCard from  '@/components/user/appointments/AppointmentCard'
import AppointmentDetailsModal from '@/components/user/appointments/AppointmentDetailsModal'
import RescheduleModal from '@/components/user/appointments/RescheduleModal'
import NextVisitBookingModal from '@/components/user/appointments/NextVisitBookingModal'

export default function UserAppointmentsPage() {
  const { appointments, refreshData, fetchAppointmentsWithFilter, familyMembers, forceRefreshAll } = useUser()
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
        filtered = filtered.filter(a => {
          // Include appointments that are:
          // 1. Currently checked in or in consultation
          // 2. Booked appointments that are happening today but not yet completed
          // 3. Appointments with next visit advice that haven't been acted upon (regardless of completion status)
          const isCurrentlyActive = ['CHECKED_IN', 'IN_CONSULTATION'].includes(a.status)
          const isTodaysBooked = a.status === 'BOOKED' && 
            new Date(a.scheduledTime) <= now && 
            new Date(a.scheduledTime).toDateString() === now.toDateString()
          const hasNextVisitAdvice = a.nextVisit && a.nextVisit.date
          // Check if the next visit hasn't been converted to a real appointment yet
          const nextVisitNotBooked = hasNextVisitAdvice && 
            (!a.nextVisit.appointmentId || a.nextVisit.status !== 'BOOKED')
          
          return isCurrentlyActive || isTodaysBooked || (hasNextVisitAdvice && nextVisitNotBooked)
        })
        break
      case 'upcoming':
        filtered = filtered.filter(a => {
          // Include all future appointments with BOOKED status
          // This should ONLY show actual booked appointments, not next visit suggestions
          const isFutureBookedAppointment = new Date(a.scheduledTime) > now && a.status === 'BOOKED'
          
          return isFutureBookedAppointment
        })
        break
      case 'completed':
        filtered = filtered.filter(a => a.status === 'COMPLETED')
        break
      case 'past':
        filtered = filtered.filter(a => {
          // Include appointments that were booked but not visited, or cancelled
          const isCancelled = a.status === 'CANCELLED'
          const isBookedButNotVisited = a.status === 'BOOKED' && new Date(a.scheduledTime) < now
          const isSkipped = a.status === 'SKIPPED'
          // Include completed appointments with next visit that are in the past
          const isCompletedWithPastNextVisit = a.status === 'COMPLETED' && 
            a.nextVisit && a.nextVisit.date && new Date(a.nextVisit.date) < now
          
          return isCancelled || isBookedButNotVisited || isSkipped || isCompletedWithPastNextVisit
        })
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
      
      const res = await fetch(`/api/appointment/${updatedData.appointmentId}`, {
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
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-slate-500">Loading appointments...</p>
      </div>
    )
    
    if (filteredAppointments.length === 0) {
      return (
        <Card className="bg-slate-50 dark:bg-slate-900/50 border-dashed border-slate-200 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              No {activeTab} appointments
            </h3>
            <p className="text-slate-500 text-sm">
              {activeTab === 'upcoming' && 'You have no upcoming appointments scheduled.'}
              {activeTab === 'ongoing' && 'You have no ongoing appointments right now.'}
              {activeTab === 'completed' && 'You have no completed appointments yet.'}
              {activeTab === 'past' && 'You have no past or cancelled appointments.'}
            </p>
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
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                My Appointments
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage your healthcare appointments
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={forceRefreshAll}
              className="flex items-center gap-2 border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 h-8 px-3 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> 
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Upcoming', count: appointments.filter(a => new Date(a.scheduledTime) > new Date() && a.status === 'BOOKED').length, icon: Clock, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
            { label: 'Ongoing', count: appointments.filter(a => ['CHECKED_IN', 'IN_CONSULTATION'].includes(a.status)).length, icon: User, color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
            { label: 'Completed', count: appointments.filter(a => a.status === 'COMPLETED').length, icon: CheckCircle, color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400' },
            { label: 'Total', count: appointments.length, icon: FileText, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg ${stat.color} flex items-center justify-center mb-2 sm:mb-3`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{stat.count}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search by doctor or hospital..." 
                  className="pl-9 h-9 sm:h-10 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Family Member Filter */}
              <Select value={familyMemberFilter} onValueChange={setFamilyMemberFilter}>
                <SelectTrigger className="h-9 sm:h-10 w-full sm:w-32 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <Users className="w-4 h-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="self">Self</SelectItem>
                  {familyMembers.map(m => (
                    <SelectItem key={m._id} value={m._id}>{m.firstName} ({m.relationship})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 sm:h-10 w-full sm:w-32 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <Filter className="w-4 h-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Status" />
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
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 h-12">
            <TabsTrigger 
              value="upcoming" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white h-10 text-xs sm:text-sm"
            >
              <Clock className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Upcoming</span>
              <span className="xs:hidden">Soon</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ongoing" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white h-10 text-xs sm:text-sm"
            >
              <User className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Ongoing</span>
              <span className="xs:hidden">Now</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white h-10 text-xs sm:text-sm"
            >
              <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Completed</span>
              <span className="xs:hidden">Done</span>
            </TabsTrigger>
            <TabsTrigger 
              value="past" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white h-10 text-xs sm:text-sm"
            >
              <History className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Past</span>
              <span className="xs:hidden">Old</span>
            </TabsTrigger>
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
    </div>
  )
}