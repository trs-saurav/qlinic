// src/components/doctor/PatientsList.jsx
'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Search, 
  Calendar,
  Phone,
  Mail,
  Activity,
  RefreshCw,
  FileText
} from 'lucide-react'

export default function PatientsList({ doctorId }) {
  const [appointments, setAppointments] = useState([])
  const [affiliations, setAffiliations] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [hospitalFilter, setHospitalFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAffiliations()
    fetchPatients()
  }, [hospitalFilter, statusFilter])

  const fetchAffiliations = async () => {
    try {
      const response = await fetch('/api/doctor/affiliations')
      const data = await response.json()
      
      if (data.affiliations) {
        const approved = data.affiliations.filter(a => a.status === 'APPROVED')
        setAffiliations(approved)
      }
    } catch (error) {
      console.error('Error fetching affiliations:', error)
    }
  }

  const fetchPatients = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (hospitalFilter !== 'ALL') params.append('hospitalId', hospitalFilter)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)

      const response = await fetch(`/api/doctor/patients?${params}`)
      const data = await response.json()
      
      if (data.appointments) {
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Failed to load patients')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAppointments = appointments.filter(appt => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const patientName = `${appt.patientId?.firstName} ${appt.patientId?.lastName}`.toLowerCase()
    const phone = appt.patientId?.phoneNumber || ''
    const email = appt.patientId?.email || ''
    return patientName.includes(query) || phone.includes(query) || email.includes(query)
  })

  const getStatusBadge = (status) => {
    const variants = {
      'BOOKED': { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Booked' },
      'CHECKED_IN': { color: 'bg-green-100 text-green-700 border-green-200', label: 'Checked In' },
      'IN_CONSULTATION': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'In Progress' },
      'COMPLETED': { color: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Completed' },
      'SKIPPED': { color: 'bg-red-100 text-red-700 border-red-200', label: 'Missed' }
    }
    const variant = variants[status] || variants['BOOKED']
    return <Badge className={variant.color}>{variant.label}</Badge>
  }

  const stats = {
    total: appointments.length,
    today: appointments.filter(a => {
      const today = new Date().toDateString()
      return new Date(a.scheduledTime).toDateString() === today
    }).length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    pending: appointments.filter(a => ['BOOKED', 'CHECKED_IN'].includes(a.status)).length
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Patients</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-slate-900/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Today</p>
                <p className="text-3xl font-bold text-blue-600">{stats.today}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600/20" />
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
              <Activity className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Activity className="w-8 h-8 text-yellow-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Hospitals</SelectItem>
                {affiliations.map(aff => (
                  <SelectItem key={aff.hospitalId._id} value={aff.hospitalId._id}>
                    {aff.hospitalId.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="BOOKED">Booked</SelectItem>
                <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                <SelectItem value="IN_CONSULTATION">In Consultation</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchPatients}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="space-y-3">
              {filteredAppointments.map(appt => (
                <div
                  key={appt._id}
                  className="p-4 border rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            {appt.patientId?.firstName} {appt.patientId?.lastName}
                            <span className="text-slate-400 text-sm font-normal">
                              #{appt.tokenNumber}
                            </span>
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">
                            {appt.patientId?.patientProfile?.gender && (
                              <span className="capitalize">{appt.patientId.patientProfile.gender}</span>
                            )}
                          </p>
                        </div>
                        {getStatusBadge(appt.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(appt.scheduledTime).toLocaleString()}
                        </div>
                        {appt.patientId?.phoneNumber && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="w-4 h-4" />
                            {appt.patientId.phoneNumber}
                          </div>
                        )}
                        {appt.patientId?.email && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="w-4 h-4" />
                            {appt.patientId.email}
                          </div>
                        )}
                      </div>

                      {appt.vitals && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Vitals Recorded
                          </p>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                            {appt.vitals.temperature && (
                              <div>
                                <p className="text-slate-500">Temp</p>
                                <p className="font-semibold">{appt.vitals.temperature}°F</p>
                              </div>
                            )}
                            {appt.vitals.bpSystolic && (
                              <div>
                                <p className="text-slate-500">BP</p>
                                <p className="font-semibold">{appt.vitals.bpSystolic}/{appt.vitals.bpDiastolic}</p>
                              </div>
                            )}
                            {appt.vitals.spo2 && (
                              <div>
                                <p className="text-slate-500">SpO2</p>
                                <p className="font-semibold">{appt.vitals.spo2}%</p>
                              </div>
                            )}
                            {appt.vitals.weight && (
                              <div>
                                <p className="text-slate-500">Weight</p>
                                <p className="font-semibold">{appt.vitals.weight}kg</p>
                              </div>
                            )}
                            {appt.vitals.heartRate && (
                              <div>
                                <p className="text-slate-500">Heart Rate</p>
                                <p className="font-semibold">{appt.vitals.heartRate} bpm</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <FileText className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No patients found</p>
              <p className="text-sm mt-1">Patients will appear here once you receive appointments</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
