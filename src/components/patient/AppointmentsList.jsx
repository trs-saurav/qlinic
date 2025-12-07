// src/components/patient/AppointmentsList.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  AlertCircle
} from 'lucide-react'

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [statusFilter, searchQuery, appointments])

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/patient/appointments')
      const data = await response.json()

      if (data.appointments) {
        // Sort by date (newest first)
        const sorted = data.appointments.sort((a, b) => 
          new Date(b.scheduledTime) - new Date(a.scheduledTime)
        )
        setAppointments(sorted)
        setFilteredAppointments(sorted)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }

  const filterAppointments = () => {
    let filtered = [...appointments]

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(a => a.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.doctorId?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.doctorId?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.hospitalId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredAppointments(filtered)
  }

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    const loadingToast = toast.loading('Cancelling appointment...')

    try {
      const response = await fetch(`/api/patient/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      })

      if (response.ok) {
        toast.success('Appointment cancelled successfully', { id: loadingToast })
        fetchAppointments()
      } else {
        toast.error('Failed to cancel appointment', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
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
        label: 'In Progress' 
      },
      'COMPLETED': { 
        bg: 'bg-slate-100', 
        text: 'text-slate-600', 
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
        label: 'Missed' 
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
    upcoming: appointments.filter(a => isUpcoming(a.scheduledTime) && a.status !== 'CANCELLED' && a.status !== 'COMPLETED').length,
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">My Appointments</h2>
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
              <Clock className="w-8 h-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600/20" />
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
              <XCircle className="w-8 h-8 text-red-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
                <SelectItem value="IN_CONSULTATION">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchAppointments}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => {
            const statusConfig = getStatusConfig(appointment.status)
            const StatusIcon = statusConfig.icon
            const upcoming = isUpcoming(appointment.scheduledTime)

            return (
              <Card 
                key={appointment._id}
                className={`hover:shadow-lg transition-all ${
                  upcoming && appointment.status === 'BOOKED' ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Token Number */}
                      {appointment.tokenNumber && (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <div className="text-center">
                            <p className="text-xs text-slate-500 font-medium">Token</p>
                            <p className="text-xl font-bold text-primary">#{appointment.tokenNumber}</p>
                          </div>
                        </div>
                      )}

                      {/* Appointment Details */}
                      <div className="flex-1 space-y-3">
                        {/* Doctor & Hospital */}
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
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{formatDate(appointment.scheduledTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{formatTime(appointment.scheduledTime)}</span>
                          </div>
                        </div>

                        {/* Patient Name */}
                        {appointment.patientId && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <User className="w-4 h-4" />
                            <span>
                              Patient: <span className="font-medium">
                                {appointment.patientId.firstName} {appointment.patientId.lastName}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* Type Badge */}
                        {appointment.type === 'EMERGENCY' && (
                          <Badge variant="destructive" className="animate-pulse">
                            Emergency
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Status & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      {/* Status Badge */}
                      <Badge className={`${statusConfig.bg} ${statusConfig.text} flex items-center gap-1.5 px-3 py-1.5`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </Badge>

                      {/* Payment Status */}
                      {appointment.paymentStatus && (
                        <Badge 
                          variant={appointment.paymentStatus === 'PAID' ? 'success' : 'secondary'}
                          className="text-xs"
                        >
                          {appointment.paymentStatus === 'PAID' ? '✓ Paid' : 'Payment Pending'}
                        </Badge>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setIsDetailsModalOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>

                        {upcoming && (appointment.status === 'BOOKED' || appointment.status === 'CHECKED_IN') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancelAppointment(appointment._id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prescription/Notes (if completed) */}
                  {appointment.status === 'COMPLETED' && appointment.prescription && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">Prescription Available</p>
                          <Button size="sm" variant="link" className="px-0 h-auto">
                            <Download className="w-3 h-3 mr-1" />
                            Download Prescription
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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
                <Button 
                  className="mt-4"
                  onClick={() => window.dispatchEvent(new CustomEvent('patientTabChange', { detail: 'hospitals' }))}
                >
                  Find Hospitals
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <Badge className={`${getStatusConfig(selectedAppointment.status).bg} ${getStatusConfig(selectedAppointment.status).text}`}>
                  {getStatusConfig(selectedAppointment.status).label}
                </Badge>
              </div>

              {/* Doctor Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Doctor Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Name:</span> <span className="font-medium">Dr. {selectedAppointment.doctorId?.firstName} {selectedAppointment.doctorId?.lastName}</span></p>
                  <p><span className="text-slate-500">Specialization:</span> <span className="font-medium">{selectedAppointment.doctorId?.doctorProfile?.specialization}</span></p>
                  {selectedAppointment.doctorId?.doctorProfile?.consultationFee && (
                    <p><span className="text-slate-500">Consultation Fee:</span> <span className="font-medium">₹{selectedAppointment.doctorId.doctorProfile.consultationFee}</span></p>
                  )}
                </div>
              </div>

              {/* Hospital Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Hospital Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Name:</span> <span className="font-medium">{selectedAppointment.hospitalId?.name}</span></p>
                  {selectedAppointment.hospitalId?.address && (
                    <p><span className="text-slate-500">Address:</span> <span className="font-medium">{selectedAppointment.hospitalId.address.city}, {selectedAppointment.hospitalId.address.state}</span></p>
                  )}
                  {selectedAppointment.hospitalId?.contactDetails?.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <a href={`tel:${selectedAppointment.hospitalId.contactDetails.phone}`} className="text-primary hover:underline">
                        {selectedAppointment.hospitalId.contactDetails.phone}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Appointment Details */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Appointment Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Date:</span> <span className="font-medium">{formatDate(selectedAppointment.scheduledTime)}</span></p>
                  <p><span className="text-slate-500">Time:</span> <span className="font-medium">{formatTime(selectedAppointment.scheduledTime)}</span></p>
                  {selectedAppointment.tokenNumber && (
                    <p><span className="text-slate-500">Token Number:</span> <span className="font-medium">#{selectedAppointment.tokenNumber}</span></p>
                  )}
                  {selectedAppointment.reason && (
                    <p><span className="text-slate-500">Reason:</span> <span className="font-medium">{selectedAppointment.reason}</span></p>
                  )}
                </div>
              </div>

              {/* Vitals (if recorded) */}
              {selectedAppointment.vitals && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Vital Signs</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedAppointment.vitals.temperature && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-slate-500">Temperature</p>
                        <p className="font-bold text-slate-900">{selectedAppointment.vitals.temperature}°F</p>
                      </div>
                    )}
                    {selectedAppointment.vitals.weight && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-slate-500">Weight</p>
                        <p className="font-bold text-slate-900">{selectedAppointment.vitals.weight} kg</p>
                      </div>
                    )}
                    {selectedAppointment.vitals.bpSystolic && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-slate-500">Blood Pressure</p>
                        <p className="font-bold text-slate-900">{selectedAppointment.vitals.bpSystolic}/{selectedAppointment.vitals.bpDiastolic}</p>
                      </div>
                    )}
                    {selectedAppointment.vitals.heartRate && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-slate-500">Heart Rate</p>
                        <p className="font-bold text-slate-900">{selectedAppointment.vitals.heartRate} bpm</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
