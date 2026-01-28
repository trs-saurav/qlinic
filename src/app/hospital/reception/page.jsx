'use client'

import { useState, useMemo, useEffect } from 'react'
import { useHospitalAdmin } from '@/context/HospitalAdminContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Plus, Calendar, RefreshCw, Activity, 
  Search, ChevronRight, Stethoscope, 
  Play, Pause, Coffee, AlertCircle, Loader2, User,
  TrendingUp, Clock
} from 'lucide-react'
import { format, subDays, startOfDay, isToday } from 'date-fns'
import toast from 'react-hot-toast'

import WalkInModal from '@/components/hospital/reception/WalkInModal'
import QueueList from '@/components/hospital/reception/QueueList'
import PatientCheckIn from '@/components/hospital/reception/PatientCheckIn'

export default function ReceptionPage() {
  const { 
    hospital,
    hospitalLoading,
    appointments,           
    appointmentsFilter,
    doctors,                
    liveQueueData,          
    selectedDate, 
    setSelectedDate,
    refreshAll,
    fetchAppointments,
    updateAppointmentStatus,
    appointmentsLoading 
  } = useHospitalAdmin()

  // STATE
  const [selectedDoctorId, setSelectedDoctorId] = useState(null)
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 1. Refresh on Mount
  useEffect(() => {
    if (hospital?._id) refreshAll()
  }, [hospital?._id, refreshAll]) 

  // 2. Refetch when doctor selection OR date changes
  useEffect(() => {
    if (hospital?._id) {
      fetchAppointments(appointmentsFilter, selectedDate, selectedDoctorId)
    }
  }, [selectedDoctorId, selectedDate, hospital?._id, fetchAppointments, appointmentsFilter])

  // 3. Helper: Status Colors
  const getStatusMeta = (status) => {
    switch(status) {
      case 'OPD': return { color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', label: 'Live OPD' }
      case 'REST': return { color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', label: 'On Break' }
      case 'MEETING': return { color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Meeting' }
      case 'EMERGENCY': return { color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Emergency' }
      default: return { color: 'bg-slate-300', text: 'text-slate-500', bg: 'bg-slate-100', label: 'Offline' }
    }
  }

  // 4. Filter appointments: Past 3 days onwards (for stats)
  const recentAppointments = useMemo(() => {
    const threeDaysAgo = startOfDay(subDays(new Date(), 3))
    return appointments.filter(apt => new Date(apt.scheduledTime) >= threeDaysAgo)
  }, [appointments])

  // 5. LOGIC: Sort Doctors (Active/Working First)
  const sortedDoctors = useMemo(() => {
    return [...doctors].sort((a, b) => {
      const statusA = liveQueueData?.[a._id]?.status || 'OFFLINE'
      const statusB = liveQueueData?.[b._id]?.status || 'OFFLINE'
      
      // Count recent appointments for this doctor
      const countA = recentAppointments.filter(apt => (apt.doctorId?._id || apt.doctorId) === a._id).length
      const countB = recentAppointments.filter(apt => (apt.doctorId?._id || apt.doctorId) === b._id).length

      const isOnlineA = ['OPD', 'EMERGENCY'].includes(statusA)
      const isOnlineB = ['OPD', 'EMERGENCY'].includes(statusB)
      
      if (isOnlineA && !isOnlineB) return -1
      if (!isOnlineA && isOnlineB) return 1
      if (countA > countB) return -1
      if (countA < countB) return 1
      return 0
    })
  }, [doctors, liveQueueData, recentAppointments])

  // 6. FILTER LOGIC: Search only
  const filteredQueue = useMemo(() => {
    if (!recentAppointments) return []
    
    // Filter by selected doctor if any
    let filtered = recentAppointments
    if (selectedDoctorId) {
      filtered = filtered.filter(apt => (apt.doctorId?._id || apt.doctorId) === selectedDoctorId)
    }

    // Apply search filtering
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(apt => {
        const p = apt.patientId || {}
        return (
          p.firstName?.toLowerCase().includes(q) ||
          p.lastName?.toLowerCase().includes(q) ||
          p.phoneNumber?.includes(q) ||
          apt.tokenNumber?.toString().includes(q)
        )
      })
    }

    return filtered
  }, [recentAppointments, searchQuery, selectedDoctorId])

  // 7. STATS: Calculated based on filtered appointments
  const viewStats = useMemo(() => {
    // Only count today's appointments for live stats
    const todayAppointments = filteredQueue.filter(apt => isToday(new Date(apt.scheduledTime)))
    
    return {
      waiting: todayAppointments.filter(a => a.status === 'CHECKED_IN').length,
      consulting: todayAppointments.filter(a => a.status === 'IN_CONSULTATION').length,
      completed: todayAppointments.filter(a => a.status === 'COMPLETED').length,
      total: filteredQueue.length
    }
  }, [filteredQueue])

  // 8. Handle Date Change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value)
    setSelectedDate(newDate)
    setSelectedAppt(null)
  }

  // 9. Quick Date Filters
  const setQuickDate = (daysOffset) => {
    const newDate = daysOffset === 0 ? new Date() : subDays(new Date(), Math.abs(daysOffset))
    setSelectedDate(startOfDay(newDate))
    setSelectedAppt(null)
  }

  if (hospitalLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-500 text-sm">Loading reception...</p>
        </div>
      </div>
    )
  }
  
  if (!hospital) {
    return (
      <div className="p-10 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Hospital Profile Not Found</p>
      </div>
    )
  }

  const todayDate = new Date()
  const isViewingToday = isToday(selectedDate)

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      
      {/* HEADER */}
      <header className="h-16 px-6 bg-background border-b border-border flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" /> Reception Desk
          </h1>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-foreground/50" />
            <p className="text-foreground/70 text-sm font-semibold hidden md:block">
              {format(todayDate, 'MMMM do, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Date Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant={isViewingToday ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickDate(0)}
              className={isViewingToday ? 'bg-blue-600 hover:bg-blue-700' : 'border-border'}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDate(-1)}
              className="border-border"
            >
              Yesterday
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDate(-3)}
              className="border-border"
            >
              3 Days Ago
            </Button>
          </div>

          <div className="h-6 w-px bg-border hidden lg:block" />
          
          {/* Date Picker */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input 
              type="date" 
              className="pl-9 pr-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-foreground cursor-pointer w-40 md:w-auto"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
            />
          </div>
          
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refreshAll()} 
            disabled={appointmentsLoading}
            className="border-border"
          >
            <RefreshCw className={`w-4 h-4 ${appointmentsLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          {/* New Walk-In Button */}
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md shadow-blue-200"
          >
            <Plus className="w-4 h-4" /> 
            <span className="hidden md:inline">New Walk-In</span>
            <span className="md:hidden">Walk-In</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* --- LEFT SIDEBAR: WORKING DOCTORS --- */}
        <aside className="w-80 bg-background border-r border-border flex flex-col flex-shrink-0 z-10 hidden md:flex">
          <div className="p-4 border-b border-border bg-gradient-to-r from-secondary to-blue-50 dark:from-secondary dark:to-secondary">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                Doctors on Duty
              </h2>
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0 text-xs">
                {doctors.length}
              </Badge>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-foreground/50 absolute left-3 top-2.5" />
              <Input placeholder="Find doctor..." className="pl-9 bg-background border-border" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* "All Queues" Button */}
            <button
              onClick={() => setSelectedDoctorId(null)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedDoctorId === null 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                  : 'bg-background border-border text-foreground/70 hover:bg-accent hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-bold">All Queues</span>
                </div>
                <Badge variant="secondary" className={`${selectedDoctorId === null ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'} border-0 dark:bg-white/20 dark:text-white`}>
                  {recentAppointments.length}
                </Badge>
              </div>
            </button>

            {/* Sorted Doctor List */}
            {sortedDoctors.map(doc => {
              const live = liveQueueData?.[doc._id] || { status: 'OFFLINE', currentToken: 0 }
              const meta = getStatusMeta(live.status)
              const isActive = selectedDoctorId === doc._id
              
              // Count recent appointments for this doctor
              const docPatientCount = recentAppointments.filter(a => 
                (a.doctorId?._id || a.doctorId) === doc._id
              ).length

              const firstName = doc.firstName || 'Unknown'
              const lastName = doc.lastName || ''
              const initial = firstName[0] || 'D'

              return (
                <button
                  key={doc._id}
                  onClick={() => setSelectedDoctorId(doc._id)}
                  className={`w-full p-3 rounded-xl border transition-all text-left group ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-700 shadow-sm' 
                      : 'bg-background border-border hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${meta.color} shadow-sm`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className={`font-bold text-sm truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-foreground'}`}>
                          Dr. {firstName} {lastName}
                        </h3>
                        {docPatientCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-700 border-0 h-5 px-1.5">
                            {docPatientCount}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className={`h-5 text-[10px] px-1.5 border-0 ${meta.bg} ${meta.text} font-medium dark:bg-opacity-20`}>
                          {meta.label}
                        </Badge>
                        {live.currentToken > 0 && (
                          <span className="text-xs text-slate-400">
                            Token: <span className="text-slate-700 font-bold">#{live.currentToken}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-blue-500 self-center" />}
                  </div>
                </button>
              )
            })}

            {sortedDoctors.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No doctors available</p>
              </div>
            )}
          </div>
        </aside>

        {/* --- CENTER: PATIENT LIST --- */}
        <main className="flex-1 flex flex-col min-w-0 bg-background">
          
          {/* Stats Header */}
          <div className="h-16 px-6 border-b border-border bg-background flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              {selectedDoctorId ? (
                <>
                  <h2 className="text-lg font-bold text-foreground truncate">
                    Dr. {doctors.find(d => d._id === selectedDoctorId)?.firstName}&apos;s Queue
                  </h2>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-100 hidden sm:inline-flex text-xs">
                    Filtered
                  </Badge>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-foreground truncate">All Patients</h2>
                  <Badge variant="outline" className="border-border text-foreground/50 hidden sm:inline-flex text-xs">
                    Last 3 Days + Upcoming
                  </Badge>
                </>
              )}
            </div>

            {/* Today's Live Stats */}
            <div className="flex gap-4 text-sm shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-foreground/50 hidden sm:inline">Waiting:</span> 
                <span className="font-bold text-foreground">{viewStats.waiting}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-foreground/50 hidden sm:inline">Consulting:</span> 
                <span className="font-bold text-foreground">{viewStats.consulting}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-foreground/50 hidden sm:inline">Done:</span> 
                <span className="font-bold text-foreground">{viewStats.completed}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex min-h-0">
            {/* Queue List */}
            <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
              <QueueList 
                appointments={filteredQueue} 
                selectedDate={selectedDate}
                selectedId={selectedAppt?._id}
                onSelect={setSelectedAppt}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onReCheckIn={async (id) => {
                  await updateAppointmentStatus(id, 'CHECKED_IN')
                  toast.success('Patient re-queued')
                  refreshAll()
                }}
                isLoading={appointmentsLoading}
              />
            </div>

            {/* Check-In Panel */}
            <div className="hidden lg:flex w-[400px] border-l border-border bg-background flex-col">
              <PatientCheckIn 
                appointment={selectedAppt} 
                onCheckInSuccess={() => { 
                  refreshAll()
                  setSelectedAppt(null)
                  toast.success('Patient checked in successfully')
                }}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Walk-In Modal */}
           {/* Walk-In Modal */}
      <WalkInModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        doctors={doctors}
        defaultDoctorId={selectedDoctorId} 
        hospitalId={hospital?._id} // ✅ PASS HOSPITAL ID HERE
        onSuccess={() => { 
          refreshAll()
          toast.success('Walk-in appointment created')
          setIsModalOpen(false)
        }}
      />

    </div>
  )
}
