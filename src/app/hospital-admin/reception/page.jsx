// src/app/hospital-admin/reception/page.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Clock, UserPlus, Phone, Activity, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReceptionPage() {
  const [appointments, setAppointments] = useState([])
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  const [vitals, setVitals] = useState({
    temperature: '',
    weight: '',
    bpSystolic: '',
    bpDiastolic: '',
    spo2: ''
  })

  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    age: '',
    gender: 'male',
    doctorId: '',
    isEmergency: false
  })

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

      setAppointments(apptData.appointments || [])
      setDoctors(docData.doctors || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddWalkIn = async (e) => {
    e.preventDefault()
    const loadingToast = toast.loading('Adding patient...')

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientData: {
            firstName: newPatient.firstName,
            lastName: newPatient.lastName,
            phone: newPatient.phone,
            gender: newPatient.gender,
            dateOfBirth: new Date(new Date().getFullYear() - parseInt(newPatient.age), 0, 1)
          },
          doctorId: newPatient.doctorId,
          isEmergency: newPatient.isEmergency,
          appointmentType: 'WALKIN'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Patient added to queue!', { id: loadingToast })
        setShowAddModal(false)
        setNewPatient({
          firstName: '',
          lastName: '',
          phone: '',
          age: '',
          gender: 'male',
          doctorId: '',
          isEmergency: false
        })
        fetchData()
      } else {
        toast.error(data.error, { id: loadingToast })
      }
    } catch (error) {
      toast.error('Failed to add patient', { id: loadingToast })
    }
  }

  const handleCheckIn = async () => {
    if (!selectedAppt) return

    const loadingToast = toast.loading('Checking in...')
    
    try {
      const response = await fetch(`/api/appointments/${selectedAppt._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CHECKED_IN',
          vitals: vitals
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Patient checked in', { id: loadingToast })
        fetchData()
        setSelectedAppt(null)
      } else {
        toast.error(data.error, { id: loadingToast })
      }
    } catch (error) {
      toast.error('Failed to check in', { id: loadingToast })
    }
  }

  const stats = {
    waiting: appointments.filter(a => a.status === 'CHECKED_IN').length,
    inConsult: appointments.filter(a => a.status === 'IN_CONSULTATION').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
  }

  const filteredAppointments = appointments.filter(apt => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const name = `${apt.patientId?.firstName} ${apt.patientId?.lastName}`.toLowerCase()
    const phone = apt.patientId?.phoneNumber || ''
    return name.includes(query) || phone.includes(query) || apt.tokenNumber?.toString().includes(query)
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

  return (
    <div className="space-y-6">
      {/* Add Walk-In Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full">
            <div className="bg-emerald-50 dark:bg-emerald-950 p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add Walk-In Patient</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
              </div>
            </div>

            <form onSubmit={handleAddWalkIn} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    required
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    required
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone *</Label>
                  <Input
                    required
                    type="tel"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Age *</Label>
                  <Input
                    required
                    type="number"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Gender *</Label>
                <Select value={newPatient.gender} onValueChange={(v) => setNewPatient({ ...newPatient, gender: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assign Doctor *</Label>
                <Select required value={newPatient.doctorId} onValueChange={(v) => setNewPatient({ ...newPatient, doctorId: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doc => (
                      <SelectItem key={doc._id} value={doc._id}>
                        Dr. {doc.firstName} {doc.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${newPatient.isEmergency ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}>
                <input
                  type="checkbox"
                  checked={newPatient.isEmergency}
                  onChange={(e) => setNewPatient({ ...newPatient, isEmergency: e.target.checked })}
                  className="w-5 h-5 accent-red-600"
                />
                <div>
                  <span className="font-bold block">Mark as Emergency</span>
                  <span className="text-xs text-slate-600">Priority treatment</span>
                </div>
              </label>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add to Queue
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Reception Desk</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage walk-in patients and queue</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          New Walk-In
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Waiting Queue</p>
                <p className="text-4xl font-bold text-yellow-600">{stats.waiting}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">In Consultation</p>
                <p className="text-4xl font-bold text-purple-600">{stats.inConsult}</p>
              </div>
              <Activity className="w-12 h-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Completed Today</p>
                <p className="text-4xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
              <Activity className="w-12 h-12 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Queue */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Queue</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredAppointments.map(apt => (
              <div
                key={apt._id}
                onClick={() => setSelectedAppt(apt)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedAppt?._id === apt._id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-lg">
                      #{apt.tokenNumber}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {apt.patientId?.firstName} {apt.patientId?.lastName}
                      </p>
                      <p className="text-sm text-slate-600">
                        Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(apt.status)}>
                    {apt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Patient Details & Check-In */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Patient Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAppt ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-xl font-bold">
                      {selectedAppt.patientId?.firstName?.[0]}{selectedAppt.patientId?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedAppt.patientId?.firstName} {selectedAppt.patientId?.lastName}
                    </h3>
                    <p className="text-sm text-slate-600">Token #{selectedAppt.tokenNumber}</p>
                  </div>
                </div>

                {selectedAppt.status === 'BOOKED' && (
                  <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(); }} className="space-y-4">
                    <h4 className="font-bold text-lg">Record Vitals</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Temperature (°F)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={vitals.temperature}
                          onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                          placeholder="98.6"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={vitals.weight}
                          onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                          placeholder="70"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>BP Systolic</Label>
                        <Input
                          type="number"
                          value={vitals.bpSystolic}
                          onChange={(e) => setVitals({ ...vitals, bpSystolic: e.target.value })}
                          placeholder="120"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>BP Diastolic</Label>
                        <Input
                          type="number"
                          value={vitals.bpDiastolic}
                          onChange={(e) => setVitals({ ...vitals, bpDiastolic: e.target.value })}
                          placeholder="80"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>SpO2 (%)</Label>
                        <Input
                          type="number"
                          value={vitals.spo2}
                          onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                          placeholder="98"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Check In Patient
                    </Button>
                  </form>
                )}

                {selectedAppt.status === 'CHECKED_IN' && (
                  <div className="text-center py-8">
                    <Activity className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                    <p className="font-bold text-lg">Patient is Waiting</p>
                    <p className="text-sm text-slate-600">In queue for consultation</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Select a patient from the queue</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
