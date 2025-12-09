// src/components/doctor/AppointmentsList.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { 
  Calendar, Clock, User, Phone, MapPin, Search,
  CheckCircle, XCircle, Loader2, AlertCircle, Video, FileText
} from 'lucide-react'

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState(null)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchQuery, activeTab])

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments')
      const data = await response.json()

      if (data.success) {
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }

  const filterAppointments = () => {
    let filtered = appointments

    // Filter by status
    const now = new Date()
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(apt => 
        new Date(apt.scheduledTime) >= now && ['BOOKED', 'CHECKED_IN'].includes(apt.status)
      )
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(apt => apt.status === 'BOOKED')
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(apt => apt.status === 'COMPLETED')
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter(apt => apt.status === 'CANCELLED')
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(apt => 
        apt.patientId?.firstName?.toLowerCase().includes(query) ||
        apt.patientId?.lastName?.toLowerCase().includes(query)
      )
    }

    setFilteredAppointments(filtered)
  }

  const handleAppointment = async (appointmentId, action) => {
    setProcessingId(appointmentId)
    const loadingToast = toast.loading(`${action === 'confirm' ? 'Confirming' : 'Cancelling'} appointment...`)

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: action === 'confirm' ? 'CHECKED_IN' : 'CANCELLED',
          cancelledBy: 'doctor'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          `✅ Appointment ${action === 'confirm' ? 'confirmed' : 'cancelled'} successfully`,
          { id: loadingToast }
        )
        fetchAppointments()
      } else {
        toast.error(data.error || 'Failed to process appointment', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error processing appointment:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setProcessingId(null)
    }
  }

  const handleComplete = async (appointmentId) => {
    setProcessingId(appointmentId)
    const loadingToast = toast.loading('Marking as completed...')

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Appointment completed', { id: loadingToast })
        fetchAppointments()
      } else {
        toast.error(data.error || 'Failed to complete appointment', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error completing appointment:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      BOOKED: { text: 'Booked', class: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300', icon: Calendar },
      CHECKED_IN: { text: 'Checked In', class: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
      IN_CONSULTATION: { text: 'In Consultation', class: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300', icon: User },
      COMPLETED: { text: 'Completed', class: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300', icon: CheckCircle },
      SKIPPED: { text: 'Skipped', class: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle },
      CANCELLED: { text: 'Cancelled', class: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300', icon: XCircle }
    }
    const badge = badges[status] || badges.BOOKED
    const Icon = badge.icon
    return (
      <Badge className={`${badge.class} font-semibold border`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </Badge>
    )
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const tabCounts = {
    upcoming: appointments.filter(apt => new Date(apt.scheduledTime) >= new Date() && ['BOOKED', 'CHECKED_IN'].includes(apt.status)).length,
    pending: appointments.filter(apt => apt.status === 'BOOKED').length,
    completed: appointments.filter(apt => apt.status === 'COMPLETED').length,
    cancelled: appointments.filter(apt => apt.status === 'CANCELLED').length
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="upcoming" className="relative font-semibold">
            Upcoming
            {tabCounts.upcoming > 0 && (
              <Badge className="ml-2 h-5 px-2 bg-blue-500">{tabCounts.upcoming}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative font-semibold">
            Pending
            {tabCounts.pending > 0 && (
              <Badge className="ml-2 h-5 px-2 bg-yellow-500">{tabCounts.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="font-semibold">Completed</TabsTrigger>
          <TabsTrigger value="cancelled" className="font-semibold">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => {
              const patientName = `${appointment.patientId?.firstName || ''} ${appointment.patientId?.lastName || ''}`.trim()
              const patientPhone = appointment.patientId?.phoneNumber || 'N/A'

              return (
                <Card key={appointment._id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Appointment Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center flex-shrink-0">
                          <User className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                {patientName || 'Unknown Patient'}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Token: #{appointment.tokenNumber} • {appointment.type}
                              </p>
                            </div>
                            {getStatusBadge(appointment.status)}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Calendar className="w-4 h-4 text-emerald-600" />
                              <span className="font-medium">{formatDate(appointment.scheduledTime)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Clock className="w-4 h-4 text-emerald-600" />
                              <span className="font-medium">{formatTime(appointment.scheduledTime)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span className="font-medium">{appointment.hospitalId?.name || 'Hospital'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Phone className="w-4 h-4 text-emerald-600" />
                              <span className="font-medium">{patientPhone}</span>
                            </div>
                          </div>

                          {appointment.notes && (
                            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                <span className="font-semibold">Notes: </span>
                                {appointment.notes}
                              </p>
                            </div>
                          )}

                          {/* Payment Status */}
                          <div className="mt-3">
                            <Badge variant="outline" className={
                              appointment.paymentStatus === 'PAID' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-orange-50 text-orange-700 border-orange-200'
                            }>
                              Payment: {appointment.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 lg:min-w-[200px]">
                        {appointment.status === 'BOOKED' && (
                          <>
                            <Button
                              onClick={() => handleAppointment(appointment._id, 'confirm')}
                              disabled={processingId === appointment._id}
                              className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                            >
                              {processingId === appointment._id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleAppointment(appointment._id, 'cancel')}
                              disabled={processingId === appointment._id}
                              className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950 font-semibold"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}

                        {['CHECKED_IN', 'IN_CONSULTATION'].includes(appointment.status) && (
                          <>
                            <Button
                              onClick={() => handleComplete(appointment._id)}
                              disabled={processingId === appointment._id}
                              className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                            >
                              {processingId === appointment._id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Mark Complete
                            </Button>
                            <Button variant="outline" className="font-semibold">
                              <Video className="w-4 h-4 mr-2" />
                              Start Consult
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleAppointment(appointment._id, 'cancel')}
                              disabled={processingId === appointment._id}
                              className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950 font-semibold"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </>
                        )}

                        {appointment.status === 'COMPLETED' && (
                          <Button variant="outline" className="font-semibold">
                            <FileText className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        )}

                        {appointment.status === 'CANCELLED' && appointment.cancelReason && (
                          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                            <p className="text-xs text-red-700 dark:text-red-300">
                              <span className="font-semibold">Reason: </span>
                              {appointment.cancelReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                  No {activeTab} appointments
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                  {searchQuery ? 'Try a different search term' : 'Appointments will appear here'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
