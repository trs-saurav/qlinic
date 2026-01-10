// src/app/user/appointments/page.jsx
'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useUser } from '@/context/UserContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'
import { 
  Calendar, 
  Clock, 
  MapPin,
  Stethoscope,
  User,
  Phone,
  FileText,
  X,
  Filter,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pill,
  Activity,
  CalendarPlus,
  ExternalLink,
  Edit
} from 'lucide-react'

export default function UserAppointmentsPage() {
  const { appointments, loading: userLoading, refreshData, fetchAppointmentsWithFilter } = useUser()
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [familyMemberFilter, setFamilyMemberFilter] = useState('self') // 'self' means current user
  const { familyMembers } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [isNextVisitModalOpen, setIsNextVisitModalOpen] = useState(false)
  const [rescheduleData, setRescheduleData] = useState({
    appointmentId: null,
    newDate: '',
    newTime: ''
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
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    fetchAppointments()
  }, [refreshData, familyMemberFilter, fetchAppointmentsWithFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const filterAppointments = useCallback(() => {
    let filtered = [...appointments]

    // Filter by tab
    const now = new Date()
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(a => 
        new Date(a.scheduledTime) > now && 
        !['COMPLETED', 'CANCELLED', 'SKIPPED'].includes(a.status)
      )
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(a => a.status === 'COMPLETED')
    } else if (activeTab === 'past') {
      filtered = filtered.filter(a => 
        new Date(a.scheduledTime) <= now || 
        ['CANCELLED', 'SKIPPED'].includes(a.status)
      )
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(a => a.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.doctorId?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.doctorId?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.hospitalId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredAppointments(filtered)
  }, [statusFilter, searchQuery, appointments, activeTab])

  useEffect(() => {
    filterAppointments()
  }, [filterAppointments])

  const fetchAppointments = async () => {
    try {
      // Fetch appointments with family member filter
      if (fetchAppointmentsWithFilter) {
        await fetchAppointmentsWithFilter(familyMemberFilter !== 'self' ? familyMemberFilter : null);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  }



  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    const loadingToast = toast.loading('Cancelling appointment...')

    try {
      const response = await fetch(`/api/appointment/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Appointment cancelled successfully', { id: loadingToast })
        fetchAppointments()
      } else {
        toast.error(data.error || 'Failed to cancel appointment', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error('Something went wrong', { id: loadingToast })
    }
  }

  const handleRescheduleAppointment = async () => {
    if (!rescheduleData.newDate || !rescheduleData.newTime) {
      toast.error('Please select both date and time')
      return
    }

    const loadingToast = toast.loading('Rescheduling appointment...')

    try {
      const newScheduledTime = new Date(`${rescheduleData.newDate}T${rescheduleData.newTime}`)
      
      const response = await fetch(`/api/appointment/${rescheduleData.appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduledTime: newScheduledTime.toISOString()
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Appointment rescheduled successfully', { id: loadingToast })
        setIsRescheduleModalOpen(false)
        setRescheduleData({ appointmentId: null, newDate: '', newTime: '' })
        fetchAppointments()
      } else {
        toast.error(data.error || 'Failed to reschedule appointment', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      toast.error('Something went wrong', { id: loadingToast })
    }
  }

  const handleBookNextVisit = async () => {
    if (!nextVisitData.scheduledDate || !nextVisitData.scheduledTime) {
      toast.error('Please select both date and time')
      return
    }

    const loadingToast = toast.loading('Booking follow-up appointment...')

    try {
      const scheduledTime = new Date(`${nextVisitData.scheduledDate}T${nextVisitData.scheduledTime}`)
      
      const response = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: nextVisitData.doctorId,
          hospitalId: nextVisitData.hospitalId,
          scheduledTime: scheduledTime.toISOString(),
          type: 'FOLLOW_UP',
          reason: nextVisitData.reason || 'Follow-up visit',
          notes: nextVisitData.instructions || ''
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Follow-up appointment booked successfully!', { id: loadingToast })
        setIsNextVisitModalOpen(false)
        setNextVisitData({
          parentAppointmentId: null,
          doctorId: null,
          hospitalId: null,
          scheduledDate: '',
          scheduledTime: '',
          reason: '',
          instructions: ''
        })
        fetchAppointments()
      } else {
        toast.error(data.error || 'Failed to book appointment', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      toast.error('Something went wrong', { id: loadingToast })
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      'BOOKED': { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        icon: Clock,
        label: 'Booked' 
      },
      'CHECKED_IN': { 
        bg: 'bg-green-100', 
        text: 'text-green-700', 
        icon: CheckCircle,
        label: 'Checked In' 
      },
      'IN_CONSULTATION': { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700', 
        icon: Stethoscope,
        label: 'In Consultation' 
      },
      'COMPLETED': { 
        bg: 'bg-emerald-100', 
        text: 'text-emerald-700', 
        icon: CheckCircle,
        label: 'Completed' 
      },
      'CANCELLED': { 
        bg: 'bg-red-100', 
        text: 'text-red-700', 
        icon: XCircle,
        label: 'Cancelled' 
      },
      'SKIPPED': { 
        bg: 'bg-orange-100', 
        text: 'text-orange-700', 
        icon: AlertCircle,
        label: 'Skipped' 
      }
    }
    return configs[status] || configs['BOOKED']
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    })
  }

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date()
  }

  const stats = {
    upcoming: appointments.filter(a => isUpcoming(a.scheduledTime) && !['CANCELLED', 'COMPLETED', 'SKIPPED'].includes(a.status)).length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Appointments</h1>
        <p className="text-slate-500 mt-1">View and manage your healthcare appointments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Upcoming</p>
                <p className="text-3xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-emerald-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Cancelled</p>
                <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by doctor or hospital name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue />
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
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={familyMemberFilter} onValueChange={setFamilyMemberFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select family member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self</SelectItem>
                  {familyMembers.map((member) => (
                    <SelectItem key={member._id} value={member._id}>
                      {member.firstName} {member.lastName} ({member.relationship})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={fetchAppointments}>
                <Filter className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming ({stats.upcoming})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => {
              const statusConfig = getStatusConfig(appointment.status)
              const StatusIcon = statusConfig.icon
              const upcoming = isUpcoming(appointment.scheduledTime)

              return (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  statusConfig={statusConfig}
                  StatusIcon={StatusIcon}
                  upcoming={upcoming}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  onViewDetails={() => {
                    setSelectedAppointment(appointment)
                    setIsDetailsModalOpen(true)
                  }}
                  onCancel={handleCancelAppointment}
                  onReschedule={(apt) => {
                    const date = new Date(apt.scheduledTime)
                    setRescheduleData({
                      appointmentId: apt._id,
                      newDate: date.toISOString().split('T')[0],
                      newTime: date.toTimeString().slice(0, 5)
                    })
                    setIsRescheduleModalOpen(true)
                  }}
                />
              )
            })
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-slate-400">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No appointments found</p>
                  <p className="text-sm mt-2">
                    {searchQuery || statusFilter !== 'ALL' 
                      ? 'Try adjusting your filters' 
                      : 'Book your first appointment to get started'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          getStatusConfig={getStatusConfig}
          formatDate={formatDate}
          formatTime={formatTime}
          setNextVisitData={setNextVisitData}
          setIsNextVisitModalOpen={setIsNextVisitModalOpen}
        />
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        rescheduleData={rescheduleData}
        setRescheduleData={setRescheduleData}
        onReschedule={handleRescheduleAppointment}
      />

      {/* Next Visit Booking Modal */}
      <NextVisitBookingModal
        isOpen={isNextVisitModalOpen}
        onClose={() => setIsNextVisitModalOpen(false)}
        nextVisitData={nextVisitData}
        setNextVisitData={setNextVisitData}
        onBook={handleBookNextVisit}
      />
    </div>
  )
}

// Appointment Card Component
function AppointmentCard({ appointment, statusConfig, StatusIcon, upcoming, formatDate, formatTime, onViewDetails, onCancel, onReschedule }) {
  return (
    <Card 
      className={`hover:shadow-lg transition-all ${
        upcoming && appointment.status === 'BOOKED' ? 'border-l-4 border-l-blue-500' : ''
      }`}
    >
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Left Section */}
          <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
            {/* Token Number */}
            {appointment.tokenNumber && (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Token</p>
                  <p className="text-sm sm:text-xl font-bold text-primary">#{appointment.tokenNumber}</p>
                </div>
              </div>
            )}

            {/* Appointment Details */}
            <div className="flex-1 space-y-3">
              {/* Patient info for family members */}
              {appointment.patientId && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-900">
                    {appointment.patientId.firstName} {appointment.patientId.lastName}
                  </span>
                  {familyMemberFilter !== 'self' && (
                    <Badge variant="secondary" className="text-xs">
                      Family
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Doctor & Specialization */}
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}
                </h3>
                <p className="text-sm text-primary font-medium">
                  {appointment.doctorId?.doctorProfile?.specialization}
                </p>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {appointment.hospitalId?.name}
                </p>
              </div>

              {/* Date & Time */}
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-2 text-slate-600 bg-slate-50 px-2 sm:px-3 py-1 rounded-lg">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium">{formatDate(appointment.scheduledTime)}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-slate-600 bg-slate-50 px-2 sm:px-3 py-1 rounded-lg">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium">{formatTime(appointment.scheduledTime)}</span>
                </div>
              </div>

              {/* Next Visit Badge (if exists) */}
              {appointment.nextVisit?.date && (
                <Badge className="bg-purple-100 text-purple-700 flex items-center gap-1 w-fit">
                  <CalendarPlus className="w-3 h-3" />
                  Next Visit: {formatDate(appointment.nextVisit.date)}
                </Badge>
              )}

              {/* Type Badge */}
              {appointment.type === 'EMERGENCY' && (
                <Badge variant="destructive" className="animate-pulse">
                  ⚡ Emergency
                </Badge>
              )}
            </div>
          </div>

          {/* Right Section - Status & Actions */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-3 sm:mt-0">
            {/* Status Badge */}
            <Badge className={`${statusConfig.bg} ${statusConfig.text} flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm`}>
              <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{statusConfig.label}</span>
              <span className="sm:hidden">{statusConfig.label.substring(0, 3)}</span>
            </Badge>

            {/* Actions */}
            <div className="flex gap-1 sm:gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onViewDetails}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Details</span>
                <span className="sm:hidden">D</span>
              </Button>

              {upcoming && appointment.status === 'BOOKED' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                  onClick={() => onReschedule(appointment)}
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Reschedule</span>
                  <span className="sm:hidden">R</span>
                </Button>
              )}

              {upcoming && (appointment.status === 'BOOKED' || appointment.status === 'CHECKED_IN') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                  onClick={() => onCancel(appointment._id)}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Cancel</span>
                  <span className="sm:hidden">C</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Prescription/Diagnosis Preview (if completed) */}
        {appointment.status === 'COMPLETED' && (appointment.diagnosis || appointment.prescription || appointment.prescriptionFileUrl) && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
            <div className="flex items-start gap-2">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-900">Medical Records Available</p>
                <p className="text-xs text-slate-500">{'Click "Details" to view prescription and diagnosis'}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Appointment Details Modal Component
function AppointmentDetailsModal({ appointment, isOpen, onClose, getStatusConfig, formatDate, formatTime, setNextVisitData, setIsNextVisitModalOpen }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Appointment Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <Badge className={`${getStatusConfig(appointment.status).bg} ${getStatusConfig(appointment.status).text}`}>
              {getStatusConfig(appointment.status).label}
            </Badge>
          </div>

          {/* Doctor Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Doctor Information
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Name:</span> <span className="font-medium">Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}</span></p>
              <p><span className="text-slate-500">Specialization:</span> <span className="font-medium">{appointment.doctorId?.doctorProfile?.specialization}</span></p>
              {appointment.doctorId?.doctorProfile?.consultationFee && (
                <p><span className="text-slate-500">Consultation Fee:</span> <span className="font-medium">₹{appointment.doctorId.doctorProfile.consultationFee}</span></p>
              )}
            </div>
          </div>

          {/* Hospital Information */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Hospital Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Name:</span> <span className="font-medium">{appointment.hospitalId?.name}</span></p>
              {appointment.hospitalId?.address && (
                <p><span className="text-slate-500">Address:</span> <span className="font-medium">{appointment.hospitalId.address.street}, {appointment.hospitalId.address.city}, {appointment.hospitalId.address.state}</span></p>
              )}
              {appointment.hospitalId?.contactDetails?.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${appointment.hospitalId.contactDetails.phone}`} className="text-primary hover:underline">
                    {appointment.hospitalId.contactDetails.phone}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Appointment Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Date</p>
                <p className="font-medium">{formatDate(appointment.scheduledTime)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Time</p>
                <p className="font-medium">{formatTime(appointment.scheduledTime)}</p>
              </div>
              {appointment.tokenNumber && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">Token Number</p>
                  <p className="font-medium">#{appointment.tokenNumber}</p>
                </div>
              )}
              {appointment.type && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">Type</p>
                  <p className="font-medium">{appointment.type}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vitals (if recorded) */}
          {appointment.vitals && Object.keys(appointment.vitals).some(key => appointment.vitals[key]) && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                Vital Signs
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {appointment.vitals.temperature && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-slate-500">Temperature</p>
                    <p className="font-bold text-red-700">{appointment.vitals.temperature}°F</p>
                  </div>
                )}
                {appointment.vitals.weight && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-slate-500">Weight</p>
                    <p className="font-bold text-blue-700">{appointment.vitals.weight} kg</p>
                  </div>
                )}
                {appointment.vitals.bpSystolic && appointment.vitals.bpDiastolic && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-slate-500">Blood Pressure</p>
                    <p className="font-bold text-purple-700">{appointment.vitals.bpSystolic}/{appointment.vitals.bpDiastolic}</p>
                  </div>
                )}
                {appointment.vitals.heartRate && (
                  <div className="p-3 bg-pink-50 rounded-lg border border-pink-100">
                    <p className="text-slate-500">Heart Rate</p>
                    <p className="font-bold text-pink-700">{appointment.vitals.heartRate} bpm</p>
                  </div>
                )}
                {appointment.vitals.spo2 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-slate-500">SpO2</p>
                    <p className="font-bold text-green-700">{appointment.vitals.spo2}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnosis */}
          {appointment.diagnosis && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-slate-900 mb-2">Diagnosis</h3>
              <p className="text-sm text-slate-700">{appointment.diagnosis}</p>
            </div>
          )}

          {/* Prescription */}
          {(appointment.prescription?.length > 0 || appointment.prescriptionFileUrl) && (
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600" />
                Prescription
              </h3>
              
              {/* Digital Prescription */}
              {appointment.prescription?.length > 0 && (
                <div className="space-y-2 mb-4">
                  {appointment.prescription.map((med, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-emerald-200">
                      <p className="font-semibold text-slate-900">{med.name}</p>
                      <p className="text-sm text-slate-600">{med.dosage} • {med.frequency} • {med.duration}</p>
                      {med.instructions && (
                        <p className="text-xs text-slate-500 italic mt-1">{med.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Manual Prescription File */}
              {appointment.prescriptionFileUrl && (
                <div className="mt-3">
                  <a 
                    href={appointment.prescriptionFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    View Manual Prescription
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Next Visit - Clickable Card */}
          {appointment.nextVisit?.date && (
            <div 
              className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer group relative overflow-hidden"
              onClick={() => {
                const nextDate = new Date(appointment.nextVisit.date)
                setNextVisitData({
                  parentAppointmentId: appointment._id,
                  doctorId: appointment.doctorId._id,
                  hospitalId: appointment.hospitalId._id,
                  scheduledDate: nextDate.toISOString().split('T')[0],
                  scheduledTime: nextDate.toTimeString().slice(0, 5),
                  reason: appointment.nextVisit.reason || '',
                  instructions: appointment.nextVisit.instructions || ''
                })
                setIsNextVisitModalOpen(true)
              }}
            >
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <CalendarPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-purple-900 text-lg">Next Visit Scheduled</h3>
                      <p className="text-xs text-purple-700">Click to book or update appointment</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-600 text-white hover:bg-purple-700">
                    <Edit className="w-3 h-3 mr-1" />
                    Update
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-slate-500">Date:</span> 
                    <span className="font-bold text-purple-900">{formatDate(appointment.nextVisit.date)}</span>
                  </div>
                  {appointment.nextVisit.reason && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-purple-600 mt-0.5" />
                      <span className="text-slate-500">Reason:</span> 
                      <span className="font-medium text-slate-700">{appointment.nextVisit.reason}</span>
                    </div>
                  )}
                  {appointment.nextVisit.instructions && (
                    <div className="bg-white/60 p-3 rounded border border-purple-200 mt-2">
                      <p className="text-xs text-purple-800 font-medium mb-1">Instructions:</p>
                      <p className="text-sm text-slate-700 italic">{appointment.nextVisit.instructions}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-purple-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <Stethoscope className="w-4 h-4" />
                    <span>Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-purple-600 font-medium group-hover:gap-2 transition-all">
                    <span>Book Appointment</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Additional Notes</h3>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{appointment.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Reschedule Modal Component
function RescheduleModal({ isOpen, onClose, rescheduleData, setRescheduleData, onReschedule }) {
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1) // Minimum 1 day in advance
  const minDateStr = minDate.toISOString().split('T')[0]

  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3) // Maximum 3 months ahead
  const maxDateStr = maxDate.toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CalendarPlus className="w-6 h-6 text-blue-600" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Please reschedule at least 24 hours before your appointment time.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                New Appointment Date
              </label>
              <Input
                type="date"
                value={rescheduleData.newDate}
                onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                min={minDateStr}
                max={maxDateStr}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Preferred Time
              </label>
              <Input
                type="time"
                value={rescheduleData.newTime}
                onChange={(e) => setRescheduleData({ ...rescheduleData, newTime: e.target.value })}
                className="w-full"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Consultation hours: 9:00 AM - 6:00 PM
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onReschedule}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Next Visit Booking Modal Component
function NextVisitBookingModal({ isOpen, onClose, nextVisitData, setNextVisitData, onBook }) {
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async () => {
    setIsCreating(true)
    await onBook()
    setIsCreating(false)
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1) // Minimum 1 day in advance
  const minDateStr = minDate.toISOString().split('T')[0]

  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3) // Maximum 3 months ahead
  const maxDateStr = maxDate.toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CalendarPlus className="w-6 h-6 text-purple-600" />
            Book Follow-up Appointment
          </DialogTitle>    
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-800">
              <strong>Follow-up Visit:</strong> Schedule a follow-up appointment with the same doctor and hospital as your previous visit.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Appointment Date
              </label>
              <Input
                type="date"
                value={nextVisitData.scheduledDate}
                onChange={(e) => setNextVisitData({ ...nextVisitData, scheduledDate: e.target.value })}
                min={minDateStr}
                max={maxDateStr}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
             
                Preferred Time
              </label>
              <Input
                type="time"
                value={nextVisitData.scheduledTime}
                onChange={(e) => setNextVisitData({ ...nextVisitData, scheduledTime: e.target.value })}
                className="w-full" 
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Consultation hours: 9:00 AM - 6:00 PM
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Reason for Visit
              </label>
              <Input
                value={nextVisitData.reason}
                onChange={(e) => setNextVisitData({ ...nextVisitData, reason: e.target.value })}
                placeholder="Follow-up for previous consultation..."
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Additional Instructions
              </label>
              <Textarea
                value={nextVisitData.instructions}
                onChange={(e) => setNextVisitData({ ...nextVisitData, instructions: e.target.value })}
                placeholder="Any special instructions for the doctor..."
                className="w-full"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={isCreating}
            >
              {isCreating ? 'Booking...' : 'Book Appointment'}
              <CalendarPlus className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
