'use client'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, RefreshCw, Clock, User, Calendar, CheckCircle, AlertCircle, ChevronRight, Thermometer, Weight, Wind, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, isToday, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns'

export default function QueueList({ 
  appointments, 
  selectedDate,
  selectedId, 
  onSelect, 
  searchQuery, 
  onSearchChange, 
  onReCheckIn,
  isLoading 
}) {
  
  // Filter appointments: Based on selected date or past 3 days + Today + Upcoming
  const filteredAppointments = useMemo(() => {
    if (selectedDate) {
      // If a specific date is selected, show only appointments for that date
      const dateStart = startOfDay(selectedDate)
      const dateEnd = endOfDay(selectedDate)
      
      return appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledTime)
        return aptDate >= dateStart && aptDate <= dateEnd
      })
    } else {
      // Otherwise, show appointments from past 3 days onwards
      const now = new Date()
      const todayStart = startOfDay(now)
      const threeDaysAgo = startOfDay(subDays(now, 3))
      
      return appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledTime)
        
        // Include if: date is >= 3 days ago OR date is in future
        return aptDate >= threeDaysAgo
      })
    }
  }, [appointments, selectedDate])

  // Group appointments by date category
  const groupedAppointments = useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    const sorted = [...filteredAppointments].sort((a, b) => {
      const dateCompare = new Date(a.scheduledTime) - new Date(b.scheduledTime)
      if (dateCompare !== 0) return dateCompare
      return (a.tokenNumber || 0) - (b.tokenNumber || 0)
    })

    const groups = {
      past: [],
      today: [],
      upcoming: []
    }

    sorted.forEach(apt => {
      const aptDate = new Date(apt.scheduledTime)
      
      // Determine grouping based on the appointment date, not the selected date
      if (isToday(aptDate)) {
        groups.today.push(apt)
      } else if (aptDate < todayStart) {
        groups.past.push(apt)
      } else {
        groups.upcoming.push(apt)
      }
    })

    return groups
  }, [filteredAppointments, selectedDate])

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CHECKED_IN': return 'bg-green-50 text-green-700 border-green-200'
      case 'IN_CONSULTATION': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'COMPLETED': return 'bg-slate-50 text-slate-600 border-slate-200'
      case 'SKIPPED': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'BOOKED': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const renderAppointmentCard = (apt, showFullDate = false) => {
    const aptDate = new Date(apt.scheduledTime)
    const isCompleted = ['COMPLETED', 'CANCELLED'].includes(apt.status)
    const isSkipped = apt.status === 'SKIPPED'
    const isPastDate = aptDate < startOfDay(new Date()) && !isToday(aptDate)
    
    return (
      <div
        key={apt._id}
        onClick={() => onSelect(apt)}
        className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${
          selectedId === apt._id 
            ? 'bg-blue-50 border-l-4 border-l-blue-600' 
            : 'border-l-4 border-l-transparent'
        } ${isPastDate || isCompleted ? 'opacity-60' : ''}`}
      >
        <div className="flex justify-between items-start gap-3">
          {/* Left: Token & Patient Info */}
          <div className="flex gap-3 flex-1 min-w-0">
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 ${
              apt.status === 'CHECKED_IN' 
                ? 'bg-green-100 text-green-700 border-2 border-green-200' 
                : apt.status === 'IN_CONSULTATION'
                ? 'bg-purple-100 text-purple-700 border-2 border-purple-200 animate-pulse'
                : apt.status === 'COMPLETED'
                ? 'bg-slate-100 text-slate-500 border-2 border-slate-200'
                : 'bg-white text-slate-700 border-2 border-slate-200'
            }`}>
              {apt.tokenNumber ? `#${apt.tokenNumber}` : '—'}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold text-sm truncate ${
                selectedId === apt._id ? 'text-blue-700' : 'text-slate-900'
              }`}>
                {apt.patientId?.firstName} {apt.patientId?.lastName}
              </h4>
              
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1 truncate">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Dr. {apt.doctorId?.firstName || apt.doctorId?.lastName}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {format(aptDate, 'hh:mm a')}
                </span>
              </div>

              {/* Show vitals info if available */}
              {apt.vitals && Object.keys(apt.vitals).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {apt.vitals.temperature && (
                    <div className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">
                      <Thermometer className="w-2.5 h-2.5" />
                      {apt.vitals.temperature}°F
                    </div>
                  )}
                  {apt.vitals.weight && (
                    <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                      <Weight className="w-2.5 h-2.5" />
                      {apt.vitals.weight}kg
                    </div>
                  )}
                  {apt.vitals.bpSystolic && apt.vitals.bpDiastolic && (
                    <div className="flex items-center gap-1 text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                      <Heart className="w-2.5 h-2.5" />
                      {apt.vitals.bpSystolic}/{apt.vitals.bpDiastolic}
                    </div>
                  )}
                  {apt.vitals.spo2 && (
                    <div className="flex items-center gap-1 text-xs bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded">
                      <Wind className="w-2.5 h-2.5" />
                      {apt.vitals.spo2}%
                    </div>
                  )}
                  {apt.vitals.heartRate && (
                    <div className="flex items-center gap-1 text-xs bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded">
                      <Heart className="w-2.5 h-2.5" />
                      {apt.vitals.heartRate}bpm
                    </div>
                  )}
                </div>
              )}

              {/* Show full date for non-today appointments */}
              {showFullDate && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{format(aptDate, 'MMM dd, yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Status & Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge 
              variant="outline" 
              className={`text-[10px] font-semibold ${getStatusStyle(apt.status)}`}
            >
              {apt.status.replace('_', ' ')}
            </Badge>

            {isSkipped && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 text-xs"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onReCheckIn(apt._id); 
                }}
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Re-Queue
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const totalCount = filteredAppointments.length
  const excludedCount = appointments.length - filteredAppointments.length

  return (
    <Card className="h-full border-slate-200 shadow-sm flex flex-col">
      <CardHeader className="border-b pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg">Queue Management</CardTitle>
          <div className="flex items-center gap-2">
            {isLoading && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-semibold">
              {totalCount}
            </Badge>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search patient, doctor, or token..." 
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Stats Summary */}
        {totalCount > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {groupedAppointments.today.length > 0 && (
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                Today: {groupedAppointments.today.length}
              </Badge>
            )}
            {groupedAppointments.upcoming.length > 0 && (
              <Badge variant="outline" className="border-slate-300 text-slate-600 text-xs">
                Upcoming: {groupedAppointments.upcoming.length}
              </Badge>
            )}
            {groupedAppointments.past.length > 0 && (
              <Badge variant="outline" className="border-slate-200 text-slate-400 text-xs">
                Past 3 Days: {groupedAppointments.past.length}
              </Badge>
            )}
          </div>
        )}

        {/* Info: Showing filtered data */}
        {excludedCount > 0 && (
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Showing last 3 days onwards ({excludedCount} older hidden)
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-y-auto">
        {totalCount === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No appointments found</p>
            <p className="text-slate-300 text-xs mt-1">No appointments in the last 3 days or upcoming</p>
          </div>
        ) : (
          <div>
            {/* TODAY'S APPOINTMENTS */}
            {groupedAppointments.today.length > 0 && (
              <div>
                <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2.5 border-b border-blue-200 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      Today
                    </h3>
                    <Badge className="bg-blue-600 text-white text-[10px] h-5">
                      {groupedAppointments.today.length}
                    </Badge>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {groupedAppointments.today.map(apt => renderAppointmentCard(apt, false))}
                </div>
              </div>
            )}

            {/* UPCOMING APPOINTMENTS */}
            {groupedAppointments.upcoming.length > 0 && (
              <div>
                <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-2.5 border-y border-slate-200 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
                      Upcoming
                    </h3>
                    <Badge variant="outline" className="border-slate-300 text-slate-600 text-[10px] h-5">
                      {groupedAppointments.upcoming.length}
                    </Badge>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {groupedAppointments.upcoming.map(apt => renderAppointmentCard(apt, true))}
                </div>
              </div>
            )}

            {/* PAST 3 DAYS APPOINTMENTS */}
            {groupedAppointments.past.length > 0 && (
              <div>
                <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-2.5 border-y border-slate-200 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Past 3 Days
                    </h3>
                    <Badge variant="outline" className="border-slate-200 text-slate-400 text-[10px] h-5">
                      {groupedAppointments.past.length}
                    </Badge>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {groupedAppointments.past.map(apt => renderAppointmentCard(apt, true))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
