// src/app/hospital-admin/appointments/page.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Calendar, Clock, User, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [doctorFilter, setDoctorFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [apptRes, docRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/hospital/doctors')
      ])

      const [apptData, docData] = await Promise.all([
        apptRes.json(),
        docRes.json()
      ])

      if (apptData.success) {
        setAppointments(apptData.appointments || [])
      }
      if (docData.success) {
        setDoctors(docData.doctors || [])
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    const loadingToast = toast.loading('Updating status...')

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Status updated', { id: loadingToast })
        fetchData()
      } else {
        toast.error(data.error, { id: loadingToast })
      }
    } catch (error) {
      toast.error('Failed to update', { id: loadingToast })
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter
    const matchesDoctor = doctorFilter === 'ALL' || apt.doctorId?._id === doctorFilter
    const matchesType = typeFilter === 'ALL' || apt.appointmentType === typeFilter

    if (!searchQuery) return matchesStatus && matchesDoctor && matchesType

    const query = searchQuery.toLowerCase()
    const name = `${apt.patientId?.firstName} ${apt.patientId?.lastName}`.toLowerCase()
    const phone = apt.patientId?.phoneNumber || ''
    const token = apt.tokenNumber?.toString() || ''

    return matchesStatus && matchesDoctor && matchesType && 
           (name.includes(query) || phone.includes(query) || token.includes(query))
  })

  const getStatusColor = (status) => {
    const colors = {
      BOOKED: 'bg-blue-100 text-blue-700 border-blue-200',
      CHECKED_IN: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      IN_CONSULTATION: 'bg-purple-100 text-purple-700 border-purple-200',
      COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[status] || colors.BOOKED
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Appointments</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage all hospital appointments
          </p>
        </div>
        <Link href="/hospital-admin/reception">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Add Walk-In
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search patients, phone, token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="WALKIN">Walk-In</SelectItem>
                <SelectItem value="ONLINE">Online</SelectItem>
              </SelectContent>
            </Select>

            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-[200px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Token</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map(apt => (
                    <tr key={apt._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-lg">#{apt.tokenNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {apt.patientId?.firstName?.[0]}{apt.patientId?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {apt.patientId?.firstName} {apt.patientId?.lastName}
                            </p>
                            <p className="text-sm text-slate-500">{apt.patientId?.phoneNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">
                          Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {apt.doctorId?.doctorProfile?.specialization}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{formatTime(apt.scheduledTime)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={apt.type === 'EMERGENCY' ? 'destructive' : 'outline'}>
                          {apt.appointmentType === 'WALKIN' ? '🚶 Walk-In' : '💻 Online'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(apt.status)}>
                          {apt.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={apt.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                          {apt.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Select
                          value={apt.status}
                          onValueChange={(v) => handleStatusUpdate(apt._id, v)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BOOKED">Booked</SelectItem>
                            <SelectItem value="CHECKED_IN">Check In</SelectItem>
                            <SelectItem value="IN_CONSULTATION">In Consult</SelectItem>
                            <SelectItem value="COMPLETED">Complete</SelectItem>
                            <SelectItem value="CANCELLED">Cancel</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-600">No appointments found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
