// src/components/hospital/ReceptionDashboard.jsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast' // ← Changed import
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  UserPlus,
  Printer,
  Activity,
  Heart,
  Thermometer,
  Weight,
  Search,
  X,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react'


export default function ReceptionDashboard({hospital}) {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [doctorFilter, setDoctorFilter] = useState('ALL')
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false)
  const [isVitalsOpen, setIsVitalsOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)


    if (!hospital) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-500">Loading hospital information...</p>
        </div>
      </div>
    )
  }




  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'male',
    dateOfBirth: '',
    doctorId: '',
    isEmergency: false
  })


  // Vitals State
  const [vitals, setVitals] = useState({
    temperature: '',
    weight: '',
    bpSystolic: '',
    bpDiastolic: '',
    spo2: '',
    heartRate: ''
  })


  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (doctorFilter !== 'ALL') params.append('doctorId', doctorFilter)


      const response = await fetch(`/api/appointments?${params}`)
      const data = await response.json()
      
      if (data.appointments) {
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
    }
  }, [statusFilter, doctorFilter])


  // Fetch doctors
  const fetchDoctors = useCallback(async () => {
    try {
      const response = await fetch('/api/doctors')
      const data = await response.json()
      
      if (data.doctors) {
        setDoctors(data.doctors)
        if (data.doctors.length > 0 && !newPatient.doctorId) {
          setNewPatient(prev => ({ ...prev, doctorId: data.doctors[0]._id }))
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }, [newPatient.doctorId])


  useEffect(() => {
    fetchAppointments()
    fetchDoctors()


    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchAppointments, 10000)
    return () => clearInterval(interval)
  }, [fetchAppointments, fetchDoctors])


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'n') {
        e.preventDefault()
        setIsNewPatientOpen(true)
      }
      if (e.altKey && e.key === '/') {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])


  // Handle new patient submission
  const handleNewPatientSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Create loading toast
    const loadingToast = toast.loading('Adding patient...')

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientData: newPatient,
          doctorId: newPatient.doctorId,
          isEmergency: newPatient.isEmergency
        })
      })


      const data = await response.json()


      if (data.success) {
        toast.success(
          newPatient.isEmergency ? '🚨 Emergency patient added!' : '✅ Patient added successfully',
          { id: loadingToast } // Replace loading toast
        )
        setIsNewPatientOpen(false)
        setNewPatient({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          gender: 'male',
          dateOfBirth: '',
          doctorId: doctors[0]?._id || '',
          isEmergency: false
        })
        fetchAppointments()
      } else {
        toast.error('Failed to add patient', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error adding patient:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }


  // Handle vitals submission
  const handleVitalsSubmit = async (e) => {
    e.preventDefault()
    if (!selectedAppt) return


    setIsLoading(true)
    const loadingToast = toast.loading('Recording vitals...')

    try {
      const response = await fetch(`/api/appointments/${selectedAppt._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vitals,
          status: 'CHECKED_IN'
        })
      })


      const data = await response.json()


      if (data.success) {
        toast.success('✅ Vitals recorded & patient checked in', { id: loadingToast })
        setIsVitalsOpen(false)
        setVitals({
          temperature: '',
          weight: '',
          bpSystolic: '',
          bpDiastolic: '',
          spo2: '',
          heartRate: ''
        })
        fetchAppointments()
      } else {
        toast.error('Failed to record vitals', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error recording vitals:', error)
      toast.error('Failed to record vitals', { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }


  // Quick check-in (skip vitals)
  const handleQuickCheckIn = async () => {
    if (!selectedAppt) return

    const loadingToast = toast.loading('Checking in patient...')

    try {
      const response = await fetch(`/api/appointments/${selectedAppt._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CHECKED_IN' })
      })


      if (response.ok) {
        toast.success('✅ Patient checked in', { id: loadingToast })
        fetchAppointments()
      } else {
        toast.error('Failed to check in', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error checking in:', error)
      toast.error('Failed to check in', { id: loadingToast })
    }
  }


  // Toggle payment status
  const togglePayment = async () => {
    if (!selectedAppt) return


    const newStatus = selectedAppt.paymentStatus === 'PAID' ? 'PENDING' : 'PAID'


    try {
      const response = await fetch(`/api/appointments/${selectedAppt._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus })
      })


      if (response.ok) {
        toast.success(newStatus === 'PAID' ? '💰 Payment received' : '⏳ Payment marked pending')
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error updating payment:', error)
      toast.error('Failed to update payment')
    }
  }


  // Cancel appointment
  const handleCancelAppointment = async () => {
    if (!selectedAppt) return
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    const loadingToast = toast.loading('Cancelling appointment...')

    try {
      const response = await fetch(`/api/appointments/${selectedAppt._id}`, {
        method: 'DELETE'
      })


      if (response.ok) {
        toast('⚠️ Appointment cancelled', { 
          id: loadingToast,
          icon: '🗑️',
          style: {
            background: '#fef2f2',
            color: '#991b1b',
          }
        })
        setSelectedAppt(null)
        fetchAppointments()
      } else {
        toast.error('Failed to cancel', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error('Failed to cancel appointment', { id: loadingToast })
    }
  }


  // Print token
  const handlePrintToken = () => {
    if (!selectedAppt) return
    setIsPrintModalOpen(true)
    
    // Custom toast for printing
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center gap-3 p-4`}>
        <Printer className="w-5 h-5 text-blue-600 animate-pulse" />
        <span className="font-medium text-slate-900">Printing token...</span>
      </div>
    ), { duration: 2500 })
    
    setTimeout(() => {
      setIsPrintModalOpen(false)
      toast.success('🖨️ Token printed successfully')
    }, 2500)
  }


  // Filter appointments
  const filteredAppointments = appointments.filter(appt => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const patientName = `${appt.patientId?.firstName} ${appt.patientId?.lastName}`.toLowerCase()
    const phone = appt.patientId?.phoneNumber || ''
    const token = appt.tokenNumber.toString()
    return patientName.includes(query) || phone.includes(query) || token.includes(query)
  })


  // Stats
  const stats = {
    waiting: appointments.filter(a => a.status === 'CHECKED_IN').length,
    inConsult: appointments.filter(a => a.status === 'IN_CONSULTATION').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    total: appointments.length
  }


  // Get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'BOOKED': return 'secondary'
      case 'CHECKED_IN': return 'default'
      case 'IN_CONSULTATION': return 'warning'
      case 'COMPLETED': return 'success'
      case 'SKIPPED': return 'destructive'
      default: return 'outline'
    }
  }


  // Get wait time
  const getWaitTime = (scheduledTime) => {
    const diff = Math.floor((Date.now() - new Date(scheduledTime).getTime()) / 60000)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m`
    return `${Math.floor(diff / 60)}h ${diff % 60}m`
  }


  return (
    <div className="space-y-6">
      {/* Header with Hospital Info */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            {hospital.name}
          </h1>
          <p className="text-slate-500 mt-1">
            {hospital.address?.city}, {hospital.address?.state}
            {hospital.contactDetails?.phone && ` • ${hospital.contactDetails.phone}`}
          </p>
        </div>


        <Dialog open={isNewPatientOpen} onOpenChange={setIsNewPatientOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg">
              <UserPlus className="w-5 h-5 mr-2" />
              New Walk-In
              <kbd className="ml-2 text-xs opacity-70">(Alt+N)</kbd>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Patient</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleNewPatientSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    required
                    value={newPatient.firstName}
                    onChange={e => setNewPatient({...newPatient, firstName: e.target.value})}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    required
                    value={newPatient.lastName}
                    onChange={e => setNewPatient({...newPatient, lastName: e.target.value})}
                    placeholder="Doe"
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newPatient.email}
                    onChange={e => setNewPatient({...newPatient, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    required
                    type="tel"
                    value={newPatient.phone}
                    onChange={e => setNewPatient({...newPatient, phone: e.target.value})}
                    placeholder="9876543210"
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gender *</Label>
                  <Select value={newPatient.gender} onValueChange={v => setNewPatient({...newPatient, gender: v})}>
                    <SelectTrigger>
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
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={newPatient.dateOfBirth}
                    onChange={e => setNewPatient({...newPatient, dateOfBirth: e.target.value})}
                  />
                </div>
              </div>


              <div>
                <Label>Assign to Doctor *</Label>
                <Select value={newPatient.doctorId} onValueChange={v => setNewPatient({...newPatient, doctorId: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doc => (
                      <SelectItem key={doc._id} value={doc._id}>
                        Dr. {doc.firstName} {doc.lastName} - {doc.doctorProfile?.specialization}
                        {!doc.doctorProfile?.isAvailable && ' (Away)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="flex items-center gap-2 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <input
                  type="checkbox"
                  id="emergency"
                  checked={newPatient.isEmergency}
                  onChange={e => setNewPatient({...newPatient, isEmergency: e.target.checked})}
                  className="w-5 h-5 accent-red-600"
                />
                <Label htmlFor="emergency" className="cursor-pointer font-bold text-red-700">
                  Mark as Emergency (Priority Queue)
                </Label>
              </div>


              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Register & Add to Queue'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Waiting</p>
                <p className="text-3xl font-bold text-green-600">{stats.waiting}</p>
              </div>
              <Users className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">In Consultation</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.inConsult}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600/20" />
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Today</p>
                <p className="text-3xl font-bold text-slate-600">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-slate-600/20" />
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
                id="search-input"
                placeholder="Search by name, phone, or token..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>


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


            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
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


            <Button variant="outline" onClick={fetchAppointments}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Queue */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold mb-4">Patient Queue</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredAppointments.length > 0 ? filteredAppointments.map(appt => (
                <div
                  key={appt._id}
                  onClick={() => setSelectedAppt(appt)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAppt?._id === appt._id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                        appt.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' :
                        appt.status === 'IN_CONSULTATION' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {appt.tokenNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          {appt.patientId?.firstName} {appt.patientId?.lastName}
                          {appt.type === 'EMERGENCY' && (
                            <Badge variant="destructive" className="text-[10px] animate-pulse">
                              EMERGENCY
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {new Date(appt.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                          {' • '}
                          Dr. {appt.doctorId?.firstName} {appt.doctorId?.lastName}
                        </p>
                        {appt.status === 'CHECKED_IN' && (
                          <p className="text-xs text-slate-400 mt-1">
                            ⏱️ Waiting: {getWaitTime(appt.scheduledTime)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(appt.status)}>
                      {appt.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No appointments found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


        {/* Patient Details Panel */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            {selectedAppt ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {selectedAppt.patientId?.firstName} {selectedAppt.patientId?.lastName}
                      </h3>
                      <p className="text-slate-500">
                        {selectedAppt.patientId?.patientProfile?.gender} • 
                        {selectedAppt.patientId?.phoneNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-black text-slate-200">
                        #{selectedAppt.tokenNumber}
                      </p>
                    </div>
                  </div>


                  <div className="flex gap-2">
                    <Button
                      onClick={togglePayment}
                      variant={selectedAppt.paymentStatus === 'PAID' ? 'default' : 'outline'}
                      className="flex-1"
                    >
                      {selectedAppt.paymentStatus === 'PAID' ? '✅ PAID' : '⏳ Payment Pending'}
                    </Button>
                    <Button onClick={handlePrintToken} variant="outline">
                      <Printer className="w-4 h-4" />
                    </Button>
                  </div>
                </div>


                {/* Actions */}
                {selectedAppt.status === 'BOOKED' && (
                  <div className="space-y-4">
                    <Dialog open={isVitalsOpen} onOpenChange={setIsVitalsOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="lg">
                          <Activity className="w-5 h-5 mr-2" />
                          Record Vitals & Check In
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Record Vital Signs</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleVitalsSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="temp">
                                <Thermometer className="w-4 h-4 inline mr-1" />
                                Temperature (°F)
                              </Label>
                              <Input
                                id="temp"
                                type="number"
                                step="0.1"
                                value={vitals.temperature}
                                onChange={e => setVitals({...vitals, temperature: e.target.value})}
                                placeholder="98.6"
                              />
                            </div>
                            <div>
                              <Label htmlFor="weight">
                                <Weight className="w-4 h-4 inline mr-1" />
                                Weight (kg)
                              </Label>
                              <Input
                                id="weight"
                                type="number"
                                step="0.1"
                                value={vitals.weight}
                                onChange={e => setVitals({...vitals, weight: e.target.value})}
                                placeholder="70"
                              />
                            </div>
                            <div>
                              <Label htmlFor="bpSys">
                                <Heart className="w-4 h-4 inline mr-1" />
                                BP Systolic
                              </Label>
                              <Input
                                id="bpSys"
                                type="number"
                                value={vitals.bpSystolic}
                                onChange={e => setVitals({...vitals, bpSystolic: e.target.value})}
                                placeholder="120"
                              />
                            </div>
                            <div>
                              <Label htmlFor="bpDia">BP Diastolic</Label>
                              <Input
                                id="bpDia"
                                type="number"
                                value={vitals.bpDiastolic}
                                onChange={e => setVitals({...vitals, bpDiastolic: e.target.value})}
                                placeholder="80"
                              />
                            </div>
                            <div>
                              <Label htmlFor="spo2">SpO2 (%)</Label>
                              <Input
                                id="spo2"
                                type="number"
                                value={vitals.spo2}
                                onChange={e => setVitals({...vitals, spo2: e.target.value})}
                                placeholder="98"
                              />
                            </div>
                            <div>
                              <Label htmlFor="hr">Heart Rate (bpm)</Label>
                              <Input
                                id="hr"
                                type="number"
                                value={vitals.heartRate}
                                onChange={e => setVitals({...vitals, heartRate: e.target.value})}
                                placeholder="72"
                              />
                            </div>
                          </div>
                          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save & Check In'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>


                    <Button onClick={handleQuickCheckIn} variant="outline" className="w-full">
                      Quick Check-In (Skip Vitals)
                    </Button>
                  </div>
                )}


                {/* Display Vitals if recorded */}
                {selectedAppt.vitals && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Recorded Vitals
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedAppt.vitals.temperature && (
                        <div>
                          <p className="text-slate-500">Temperature</p>
                          <p className="font-bold">{selectedAppt.vitals.temperature}°F</p>
                        </div>
                      )}
                      {selectedAppt.vitals.weight && (
                        <div>
                          <p className="text-slate-500">Weight</p>
                          <p className="font-bold">{selectedAppt.vitals.weight} kg</p>
                        </div>
                      )}
                      {selectedAppt.vitals.bpSystolic && (
                        <div>
                          <p className="text-slate-500">Blood Pressure</p>
                          <p className="font-bold">
                            {selectedAppt.vitals.bpSystolic}/{selectedAppt.vitals.bpDiastolic}
                          </p>
                        </div>
                      )}
                      {selectedAppt.vitals.spo2 && (
                        <div>
                          <p className="text-slate-500">SpO2</p>
                          <p className="font-bold">{selectedAppt.vitals.spo2}%</p>
                        </div>
                      )}
                      {selectedAppt.vitals.heartRate && (
                        <div>
                          <p className="text-slate-500">Heart Rate</p>
                          <p className="font-bold">{selectedAppt.vitals.heartRate} bpm</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* Cancel Button */}
                <Button
                  onClick={handleCancelAppointment}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancel Appointment
                </Button>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Select a patient to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Print Token Modal */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-xs">
          <div className="text-center space-y-4 font-mono">
            <h3 className="text-xl font-bold uppercase tracking-widest">QLINIC Token</h3>
            <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
            <div className="my-6">
              <p className="text-xs text-slate-400 mb-2">Token Number</p>
              <p className="text-6xl font-black text-slate-900">
                #{selectedAppt?.tokenNumber}
              </p>
            </div>
            <div className="text-sm space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold">
                  {selectedAppt?.patientId?.firstName} {selectedAppt?.patientId?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold">
                  Dr. {selectedAppt?.doctorId?.firstName} {selectedAppt?.doctorId?.lastName}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Printing...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
