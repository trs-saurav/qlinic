'use client'
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  RefreshCw, 
  Clock, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  Thermometer, 
  Weight, 
  Wind, 
  Heart,
  Filter,
  ListOrdered,
  CalendarDays
} from 'lucide-react'
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
  const [sortBy, setSortBy] = useState('time') // time, token, name
  const [filterBy, setFilterBy] = useState('all') // all, checked_in, in_consultation, completed, booked
  
  // Enhanced filtering - show more records with better options
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments]
    
    // Apply status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(apt => apt.status.toLowerCase() === filterBy)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(apt => 
        apt.patientId?.firstName?.toLowerCase().includes(query) ||
        apt.patientId?.lastName?.toLowerCase().includes(query) ||
        apt.doctorId?.firstName?.toLowerCase().includes(query) ||
        apt.doctorId?.lastName?.toLowerCase().includes(query) ||
        apt.tokenNumber?.toString().includes(query) ||
        apt.status?.toLowerCase().includes(query)
      )
    }
    
    // Apply date filter
    if (selectedDate) {
      // If a specific date is selected, show only appointments for that date
      const dateStart = startOfDay(selectedDate)
      const dateEnd = endOfDay(selectedDate)
      
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.scheduledTime)
        return aptDate >= dateStart && aptDate <= dateEnd
      })
    } else {
      // Show today + upcoming + recent past (last 7 days instead of 3)
      const now = new Date()
      const todayStart = startOfDay(now)
      const sevenDaysAgo = startOfDay(subDays(now, 7))
      
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.scheduledTime)
        return aptDate >= sevenDaysAgo // Show last 7 days and all future appointments
      })
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'token') {
        return (a.tokenNumber || 0) - (b.tokenNumber || 0)
      } else if (sortBy === 'name') {
        const nameA = `${a.patientId?.firstName || ''} ${a.patientId?.lastName || ''}`.toLowerCase()
        const nameB = `${b.patientId?.firstName || ''} ${b.patientId?.lastName || ''}`.toLowerCase()
        return nameA.localeCompare(nameB)
      } else {
        // Default: sort by time
        return new Date(a.scheduledTime) - new Date(b.scheduledTime)
      }
    })
    
    return filtered
  }, [appointments, selectedDate, searchQuery, sortBy, filterBy])

  // Group appointments by date category with enhanced logic
  const groupedAppointments = useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    const groups = {
      today: [],
      upcoming: [],
      recent: []
    }

    filteredAppointments.forEach(apt => {
      const aptDate = new Date(apt.scheduledTime)
      
      if (isToday(aptDate)) {
        groups.today.push(apt)
      } else if (aptDate > todayEnd) {
        groups.upcoming.push(apt)
      } else {
        // Past appointments (within our 7-day window)
        groups.recent.push(apt)
      }
    })

    return groups
  }, [filteredAppointments])

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CHECKED_IN': return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700'
      case 'IN_CONSULTATION': return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700'
      case 'COMPLETED': return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
      case 'SKIPPED': return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700'
      case 'BOOKED': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
      case 'CANCELLED': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
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
        className={`p-4 cursor-pointer transition-all hover:bg-accent border-b border-border last:border-b-0 ${
          selectedId === apt._id 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600' 
            : 'border-l-4 border-l-transparent'
        } ${isPastDate || isCompleted ? 'opacity-70' : ''}`}
      >
        <div className="flex justify-between items-start gap-3">
          {/* Left: Token & Patient Info */}
          <div className="flex gap-3 flex-1 min-w-0">
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 ${
              apt.status === 'CHECKED_IN' 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-2 border-green-200 dark:border-green-700' 
                : apt.status === 'IN_CONSULTATION'
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-2 border-purple-200 dark:border-purple-700 animate-pulse'
                : apt.status === 'COMPLETED'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-700'
                : 'bg-white dark:bg-background text-slate-700 dark:text-foreground border-2 border-slate-200 dark:border-border'
            }`}>
              {apt.tokenNumber ? `#${apt.tokenNumber}` : '—'}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold text-sm truncate ${
                selectedId === apt._id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-foreground'
              }`}>
                {apt.patientId?.firstName} {apt.patientId?.lastName}
              </h4>
              
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1 truncate">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate text-foreground/70">Dr. {apt.doctorId?.firstName || apt.doctorId?.lastName}</span>
                </span>
                <span className="text-foreground/50">•</span>
                <span className="flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span className="text-foreground/70">{format(aptDate, 'hh:mm a')}</span>
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
                    <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                      <Weight className="w-2.5 h-2.5" />
                      {apt.vitals.weight}kg
                    </div>
                  )}
                  {apt.vitals.bpSystolic && apt.vitals.bpDiastolic && (
                    <div className="flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">
                      <Heart className="w-2.5 h-2.5" />
                      {apt.vitals.bpSystolic}/{apt.vitals.bpDiastolic}
                    </div>
                  )}
                  {apt.vitals.spo2 && (
                    <div className="flex items-center gap-1 text-xs bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 px-1.5 py-0.5 rounded">
                      <Wind className="w-2.5 h-2.5" />
                      {apt.vitals.spo2}%
                    </div>
                  )}
                  {apt.vitals.heartRate && (
                    <div className="flex items-center gap-1 text-xs bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 px-1.5 py-0.5 rounded">
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
              className={`text-[10px] font-semibold ${getStatusStyle(apt.status)} dark:bg-opacity-20`}
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
    <Card className="h-full border-border shadow-sm flex flex-col">
      <CardHeader className="border-b pb-4 flex-shrink-0">
        {/* Header Row - Title and Count */}
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary" />
            Queue Management
          </CardTitle>
          <div className="flex items-center gap-2">
            {isLoading && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
              {totalCount}
            </Badge>
          </div>
        </div>
        
        {/* Search and Filter Controls - Compact single line */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Search Bar - Flexible width */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search patients, doctors, tokens..." 
              className="pl-9 bg-background border-border focus:ring-2 focus:ring-primary/20 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="w-32">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="h-9 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="in_consultation">In Consultation</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Sort Control */}
          <div className="w-32">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 text-xs">
                <ListOrdered className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="token">Token</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Summary */}
        {totalCount > 0 && (
          <div className="flex gap-2 flex-wrap">
            {groupedAppointments.today.length > 0 && (
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0 text-xs">
                Today: {groupedAppointments.today.length}
              </Badge>
            )}
            {groupedAppointments.upcoming.length > 0 && (
              <Badge variant="outline" className="border-border text-foreground/70 text-xs">
                Upcoming: {groupedAppointments.upcoming.length}
              </Badge>
            )}
            {groupedAppointments.recent.length > 0 && (
              <Badge variant="outline" className="border-border text-foreground/50 text-xs">
                Recent: {groupedAppointments.recent.length}
              </Badge>
            )}
          </div>
        )}

        {/* Info: Showing filtered data */}
        {excludedCount > 0 && (
          <div className="mt-1 text-xs text-foreground/50 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Showing last 7 days + upcoming ({excludedCount} older hidden)
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-y-auto">
        {totalCount === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
            <p className="text-foreground/50 font-medium">No appointments found</p>
            <p className="text-foreground/40 text-xs mt-1">
              {selectedDate 
                ? `No appointments for ${format(selectedDate, 'MMM dd, yyyy')}` 
                : 'No appointments in the last 7 days or upcoming'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* TODAY'S APPOINTMENTS - Prominent display */}
            {groupedAppointments.today.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50/50 dark:from-blue-900/10 to-blue-100/50 dark:to-blue-900/5 border-b-2 border-blue-200 dark:border-blue-700">
                <div className="sticky top-0 bg-gradient-to-r from-blue-100 dark:from-blue-900/30 to-blue-200 dark:to-blue-900/20 px-4 py-3 border-b border-blue-200 dark:border-blue-700 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                      Today's Appointments
                    </h3>
                    <Badge className="bg-blue-600 text-white text-xs h-6 px-2">
                      {groupedAppointments.today.length} patients
                    </Badge>
                  </div>
                </div>
                <div>
                  {groupedAppointments.today.map(apt => renderAppointmentCard(apt, false))}
                </div>
              </div>
            )}

            {/* UPCOMING APPOINTMENTS */}
            {groupedAppointments.upcoming.length > 0 && (
              <div className="bg-gradient-to-r from-slate-50/50 dark:from-slate-800/20 to-slate-100/50 dark:to-slate-800/10">
                <div className="sticky top-0 bg-gradient-to-r from-slate-100 dark:from-slate-800 to-slate-200 dark:to-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Upcoming Appointments
                    </h3>
                    <Badge variant="outline" className="border-border text-foreground/70 text-xs h-6 px-2">
                      {groupedAppointments.upcoming.length} patients
                    </Badge>
                  </div>
                </div>
                <div>
                  {groupedAppointments.upcoming.map(apt => renderAppointmentCard(apt, true))}
                </div>
              </div>
            )}

            {/* RECENT APPOINTMENTS (Last 7 days) */}
            {groupedAppointments.recent.length > 0 && (
              <div className="bg-gradient-to-r from-slate-50/30 dark:from-slate-800/10 to-slate-100/30 dark:to-slate-800/5">
                <div className="sticky top-0 bg-gradient-to-r from-slate-100/80 dark:from-slate-800/50 to-slate-200/80 dark:to-slate-800/30 px-4 py-3 border-b border-slate-200 dark:border-slate-700 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground/60 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Recent Appointments
                    </h3>
                    <Badge variant="outline" className="border-border text-foreground/60 text-xs h-6 px-2">
                      {groupedAppointments.recent.length} patients
                    </Badge>
                  </div>
                </div>
                <div>
                  {groupedAppointments.recent.map(apt => renderAppointmentCard(apt, true))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}