'use client'

import { useState, useEffect, useMemo } from 'react'
import { useHospitalAdmin } from '@/context/HospitalAdminContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, Calendar, Clock, Activity, 
  CheckCircle2, XCircle, UserCheck, 
  Filter, Download, RefreshCw, MoreVertical, 
  Stethoscope, ClipboardList
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

export default function HospitalAppointmentsPage() {
  const { 
    appointments, 
    fetchAppointments, 
    fetchDoctors, 
    doctors, 
    updateAppointmentStatus 
  } = useHospitalAdmin()
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [doctorFilter, setDoctorFilter] = useState('ALL')
  const [dateRange, setDateRange] = useState('ALL')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchAppointments(), fetchDoctors()])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleStatusChange = async (appointmentId, newStatus) => {
    const loadingToast = toast.loading('Processing...')

    try {
      if (newStatus === 'CHECKED_IN') {
        const response = await fetch('/api/appointment/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointmentId })
        })
        const data = await response.json()
        
        if (data.success || response.ok) {
          toast.success(`Checked In! Token #${data.tokenNumber}`, { id: loadingToast })
          fetchAppointments()
        } else {
          toast.error(data.error || 'Check-in failed', { id: loadingToast })
        }
      } else {
        const result = await updateAppointmentStatus(appointmentId, newStatus)
        if (result.success) {
          toast.success('Status updated', { id: loadingToast })
          fetchAppointments()
        } else {
          toast.error(result.error || 'Update failed', { id: loadingToast })
        }
      }
    } catch (error) {
      toast.error('Network error', { id: loadingToast })
    }
  }

  // Filtering Logic
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Status Filter (from tabs)
      let matchesStatus = true
      if (activeTab === 'booked') matchesStatus = apt.status === 'BOOKED'
      else if (activeTab === 'checked_in') matchesStatus = apt.status === 'CHECKED_IN'
      else if (activeTab === 'consulting') matchesStatus = apt.status === 'IN_CONSULTATION'
      else if (activeTab === 'completed') matchesStatus = apt.status === 'COMPLETED'
      else if (activeTab === 'cancelled') matchesStatus = apt.status === 'CANCELLED'
      
      // Override with manual filter if set
      if (statusFilter !== 'ALL') {
        matchesStatus = apt.status === statusFilter
      }
      
      // Doctor Filter
      const matchesDoctor = doctorFilter === 'ALL' || apt.doctorId?._id === doctorFilter
      
      // Date Range Filter
      let matchesDate = true
      
      if (dateRange !== 'ALL') {
        const aptDate = new Date(apt.scheduledTime)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (dateRange === 'TODAY') {
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          matchesDate = aptDate >= today && aptDate < tomorrow
        } else if (dateRange === 'WEEK') {
          matchesDate = isWithinInterval(aptDate, { 
            start: startOfWeek(today, { weekStartsOn: 1 }), 
            end: endOfWeek(today, { weekStartsOn: 1 }) 
          })
        } else if (dateRange === 'PAST') {
          matchesDate = aptDate < today
        } else if (dateRange === 'UPCOMING') {
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          matchesDate = aptDate >= tomorrow
        }
      }

      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const name = `${apt.patientId?.firstName} ${apt.patientId?.lastName}`.toLowerCase()
        const phone = apt.patientId?.phoneNumber || ''
        const token = apt.tokenNumber?.toString() || ''
        
        const matchesSearch = name.includes(query) || phone.includes(query) || token.includes(query)
        return matchesStatus && matchesDoctor && matchesDate && matchesSearch
      }

      return matchesStatus && matchesDoctor && matchesDate
    })
  }, [appointments, statusFilter, doctorFilter, dateRange, searchQuery, activeTab])

  // Stats Calculation
  const stats = useMemo(() => ({
    total: appointments.length,
    checkedIn: appointments.filter(a => a.status === 'CHECKED_IN').length,
    inConsult: appointments.filter(a => a.status === 'IN_CONSULTATION').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
    booked: appointments.filter(a => a.status === 'BOOKED').length
  }), [appointments])

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const variants = {
      BOOKED: { class: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Booked' },
      CHECKED_IN: { class: 'bg-green-50 text-green-700 border-green-200', label: 'In Queue' },
      IN_CONSULTATION: { class: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Consulting' },
      COMPLETED: { class: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Done' },
      CANCELLED: { class: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelled' },
      SKIPPED: { class: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Skipped' }
    }
    const v = variants[status] || variants.BOOKED
    return <Badge variant="outline" className={`${v.class} border`}>{v.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-blue-600" />
            Appointments
          </h1>
          <p className="text-muted-foreground mt-1">Manage patient flow and consultations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchAppointments()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Link href="/hospital-admin/reception">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              + New Walk-In
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs for Status Filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto">
          <TabsTrigger value="all" className="gap-2">
            All <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="booked" className="gap-2">
            Booked <Badge variant="secondary" className="ml-1">{stats.booked}</Badge>
          </TabsTrigger>
          <TabsTrigger value="checked_in" className="gap-2">
            Queue <Badge variant="secondary" className="ml-1">{stats.checkedIn}</Badge>
          </TabsTrigger>
          <TabsTrigger value="consulting" className="gap-2">
            Active <Badge variant="secondary" className="ml-1">{stats.inConsult}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            Done <Badge variant="secondary" className="ml-1">{stats.completed}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            Cancelled <Badge variant="secondary" className="ml-1">{stats.cancelled}</Badge>
          </TabsTrigger>
          <TabsTrigger value="filters">
            <Filter className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        {/* Filters Tab Content */}
        <TabsContent value="filters" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              <CardDescription>Narrow down appointments by multiple criteria</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, phone, token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Date Range Selector */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Time</SelectItem>
                  <SelectItem value="TODAY">Today</SelectItem>
                  <SelectItem value="WEEK">This Week</SelectItem>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="PAST">Past</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Selector */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Activity className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="BOOKED">Booked</SelectItem>
                  <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                  <SelectItem value="IN_CONSULTATION">In Consultation</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Doctor Selector */}
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger>
                  <Stethoscope className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Doctors</SelectItem>
                  {doctors.map(doc => (
                    <SelectItem key={doc._id} value={doc._id}>
                      Dr. {doc.firstName} {doc.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
            
            {/* Active Filters Display */}
            {(searchQuery || dateRange !== 'ALL' || statusFilter !== 'ALL' || doctorFilter !== 'ALL') && (
              <CardContent className="pt-0 border-t">
                <div className="flex items-center gap-2 flex-wrap pt-4">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchQuery && <Badge variant="secondary">Search: {searchQuery}</Badge>}
                  {dateRange !== 'ALL' && <Badge variant="secondary">Date: {dateRange}</Badge>}
                  {statusFilter !== 'ALL' && <Badge variant="secondary">Status: {statusFilter}</Badge>}
                  {doctorFilter !== 'ALL' && (
                    <Badge variant="secondary">
                      Dr. {doctors.find(d => d._id === doctorFilter)?.firstName}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setDateRange('ALL')
                      setStatusFilter('ALL')
                      setDoctorFilter('ALL')
                    }}
                    className="ml-auto"
                  >
                    Clear All
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Appointments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Token</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map(apt => (
                  <TableRow key={apt._id} className="hover:bg-muted/50">
                    
                    {/* Token */}
                    <TableCell className="font-mono font-bold text-lg">
                      {apt.tokenNumber ? `#${apt.tokenNumber}` : '—'}
                    </TableCell>

                    {/* Patient */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                            {apt.patientId?.firstName?.[0]}{apt.patientId?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">
                            {apt.patientId?.firstName} {apt.patientId?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {apt.patientId?.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Doctor */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {apt.doctorId?.doctorProfile?.specialization || 'General'}
                        </p>
                      </div>
                    </TableCell>

                    {/* Time */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(apt.scheduledTime), 'hh:mm a')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(apt.scheduledTime), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {getStatusBadge(apt.status)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {apt.status === 'BOOKED' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusChange(apt._id, 'CHECKED_IN')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Check In
                          </Button>
                        )}
                        
                        {apt.status === 'CHECKED_IN' && (
                          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Waiting in Queue
                          </Badge>
                        )}

                        {/* More Actions Dropdown */}
                        <Select 
                          value={apt.status} 
                          onValueChange={(val) => handleStatusChange(apt._id, val)}
                        >
                          <SelectTrigger className="w-9 h-8 p-0 border-slate-200">
                            <MoreVertical className="w-4 h-4" />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="CHECKED_IN">✅ Check In</SelectItem>
                            <SelectItem value="COMPLETED">✔️ Mark Complete</SelectItem>
                            <SelectItem value="CANCELLED">❌ Cancel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <XCircle className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">No appointments found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Results Footer */}
      {filteredAppointments.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing <span className="font-bold text-foreground">{filteredAppointments.length}</span> of <span className="font-bold text-foreground">{appointments.length}</span> appointments
          </p>
          <div className="text-xs">
            Last updated: {format(new Date(), 'hh:mm a')}
          </div>
        </div>
      )}
    </div>
  )
}
