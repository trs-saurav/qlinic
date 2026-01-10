'use client'

import React, { useState, useEffect } from 'react'
import { useDoctor } from '@/context/DoctorContextProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Play, 
  CheckCircle, 
  SkipForward, 
  Clock, 
  Users, 
  History,
  MoreVertical,
  Stethoscope,
  AlertCircle,
  Pill,
  Plus,
  X,
  CalendarPlus,
  Upload,
  FileText,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function DoctorAppointmentsPage() {
  const { 
    appointments, 
    fetchAppointments, 
    updateAppointmentStatus,
    dashboard,
    appointmentsLoading
  } = useDoctor()

  const [activeTab, setActiveTab] = useState('queue') // 'queue' or 'history'
  const [currentPatient, setCurrentPatient] = useState(null)
  const [vitals, setVitals] = useState({
    temperature: '',
    weight: '',
    bpSystolic: '',
    bpDiastolic: '',
    spo2: '',
    heartRate: ''
  })
  const [prescription, setPrescription] = useState([])
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [prescriptionFile, setPrescriptionFile] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [nextVisit, setNextVisit] = useState({
    date: '',
    reason: '',
    instructions: ''
  })
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  })
  const [selectedHistoryAppointment, setSelectedHistoryAppointment] = useState(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isEditingPrescription, setIsEditingPrescription] = useState(false)

  // Fetch appointments on mount
  useEffect(() => {
    fetchAppointments('today')
  }, [fetchAppointments])

  // --- 1. Filter Appointments for the Queue ---
  // Only show CHECKED_IN and IN_CONSULTATION patients (SKIPPED patients go to hospital reception)
  const queueList = appointments
    .filter(a => ['CHECKED_IN', 'IN_CONSULTATION'].includes(a.status))
    .sort((a, b) => {
      // Active consultation always first
      if (a.status === 'IN_CONSULTATION') return -1
      if (b.status === 'IN_CONSULTATION') return 1
      
      // Sort by token number
      return (a.tokenNumber || 999) - (b.tokenNumber || 999)
    })

  // --- 2. Filter Completed Appointments for History ---
  const completedList = appointments
    .filter(a => a.status === 'COMPLETED')
    .sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime))

  // Find who is currently in consultation
  useEffect(() => {
    const active = appointments.find(a => a.status === 'IN_CONSULTATION')
    setCurrentPatient(active || null)
    
    // Reset form when patient changes
    if (active) {
      setVitals(active.vitals || {
        temperature: '',
        weight: '',
        bpSystolic: '',
        bpDiastolic: '',
        spo2: '',
        heartRate: ''
      })
      setPrescription([])
      setDiagnosis('')
      setNotes(active.notes || '')
      setNextVisit({
        date: '',
        reason: '',
        instructions: ''
      })
    }
  }, [appointments])

  // --- Handlers ---

  const handleNextPatient = async () => {
    // 1. Find the next CHECKED_IN patient with lowest token
    const nextInLine = queueList.find(a => a.status === 'CHECKED_IN')
    
    if (!nextInLine) {
      toast.error("No patients waiting in queue")
      return
    }

    // 2. Call API to update status
    const res = await updateAppointmentStatus(nextInLine._id, 'IN_CONSULTATION')
    if (res.success) {
      toast.success(`Started consultation with ${nextInLine.patientId.firstName}`)
    }
  }

  const handleCompleteVisit = async () => {
    if (!currentPatient) return
    
    // Only require diagnosis, prescription is now optional
    if (!diagnosis.trim()) {
      toast.error('Please enter a diagnosis')
      return
    }

    // Check if either digital prescription or manual prescription file is provided
    if (prescription.length === 0 && !prescriptionFile) {
      const confirm = window.confirm(
        'No prescription provided. Continue without prescription?'
      )
      if (!confirm) return
    }
    
    // Upload prescription file if provided
    let prescriptionFileUrl = null
    if (prescriptionFile) {
      setUploadingFile(true)
      try {
        const formData = new FormData()
        formData.append('file', prescriptionFile)
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          prescriptionFileUrl = uploadData.url
        } else {
          toast.error('Failed to upload prescription file')
          setUploadingFile(false)
          return
        }
      } catch (error) {
        toast.error('Error uploading file')
        setUploadingFile(false)
        return
      }
      setUploadingFile(false)
    }
    
    const res = await updateAppointmentStatus(currentPatient._id, 'COMPLETED', {
      vitals,
      diagnosis,
      notes,
      prescription: prescription.length > 0 ? prescription : null,
      prescriptionFileUrl,
      nextVisit: nextVisit.date ? nextVisit : null
    })
    
    if (res.success) {
      toast.success("Visit completed")
      setCurrentPatient(null)
      // Reset form
      setVitals({
        temperature: '',
        weight: '',
        bpSystolic: '',
        bpDiastolic: '',
        spo2: '',
        heartRate: ''
      })
      setPrescription([])
      setDiagnosis('')
      setNotes('')
      setPrescriptionFile(null)
      setNextVisit({
        date: '',
        reason: '',
        instructions: ''
      })
    }
  }

  const handleAddMedicine = () => {
    if (!newMedicine.name.trim() || !newMedicine.dosage.trim()) {
      toast.error('Medicine name and dosage are required')
      return
    }
    
    setPrescription([...prescription, { ...newMedicine, id: Date.now() }])
    setNewMedicine({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    })
    toast.success('Medicine added')
  }

  const handleRemoveMedicine = (id) => {
    setPrescription(prescription.filter(med => med.id !== id))
    toast('Medicine removed', { icon: '🗑️' })
  }

  const handleSkipPatient = async (id) => {
    const patient = appointments.find(a => a._id === id)
    const newSkipCount = (patient.skipCount || 0) + 1
    
    // Mark as SKIPPED so hospital can manually re-check them in
    const res = await updateAppointmentStatus(id, 'SKIPPED', {
      skipCount: newSkipCount,
      lastSkippedAt: new Date().toISOString()
    })
    
    if (res.success) {
      toast(`Patient skipped - requires manual re-check-in at reception`, { icon: '⚠️' })
      // Refresh appointments to update queue
      fetchAppointments('today')
    }
  }

  // --- Components ---

  const QueueItem = ({ apt }) => {
    const isActive = apt.status === 'IN_CONSULTATION'
    
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border mb-2 transition-all ${isActive ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white hover:bg-slate-50'}`}>
        {/* Token Badge */}
        <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
          <span className="text-[10px] font-medium uppercase">Token</span>
          <span className="text-xl font-bold leading-none">{apt.tokenNumber}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold truncate ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
            {apt.patientId?.firstName} {apt.patientId?.lastName}
          </h4>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{apt.patientId?.gender}, {apt.patientId?.age}y</span>
            {isActive && <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-blue-200 text-blue-800">Active</Badge>}
          </div>
        </div>

        {/* Actions (Only for waiting patients) */}
        {apt.status === 'CHECKED_IN' && !isActive && (
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-orange-600" onClick={() => handleSkipPatient(apt._id)}>
            <SkipForward className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  const CompletedItem = ({ apt, onClick }) => {
    return (
      <div 
        className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-emerald-50 mb-2 transition-all cursor-pointer"
        onClick={() => onClick(apt)}
      >
        {/* Token Badge */}
        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
          <span className="text-xs font-bold">#{apt.tokenNumber}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm">
            {apt.patientId?.firstName} {apt.patientId?.lastName}
          </h4>
          <div className="text-xs text-slate-500 mt-1">
            <p>{apt.patientId?.gender}, {apt.patientId?.age}y</p>
            <p className="mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(apt.scheduledTime), 'MMM d, h:mm a')}
            </p>
          </div>
          {apt.diagnosis && (
            <p className="text-xs text-emerald-700 mt-1 truncate">
              <strong>Dx:</strong> {apt.diagnosis}
            </p>
          )}
        </div>

        {/* Status Badge & View Icon */}
        <div className="flex flex-col items-end gap-1">
          <Badge className="bg-emerald-100 text-emerald-700 shrink-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Done
          </Badge>
          <Eye className="h-4 w-4 text-emerald-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)] flex flex-col gap-4">
      {/* Loading Overlay */}
      {appointmentsLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-slate-700 font-medium">Loading appointments...</span>
          </div>
        </div>
      )}

      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase">Queue</p>
              <h3 className="text-2xl font-bold text-blue-900">{queueList.length}</h3>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Waiting</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {queueList.filter(a => a.status === 'CHECKED_IN').length}
              </h3>
            </div>
            <Clock className="h-8 w-8 text-slate-200" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Completed</p>
              <h3 className="text-2xl font-bold text-slate-900">{dashboard.completedThisWeek || 0}</h3>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </CardContent>
        </Card>
        <Card>
           <Button onClick={() => fetchAppointments('today')} variant="outline" className="w-full h-full flex flex-col gap-1 items-center justify-center border-dashed">
             <History className="h-4 w-4" />
             <span className="text-xs">Refresh Data</span>
           </Button>
        </Card>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        
        {/* LEFT COLUMN: Queue List */}
        <Card className="flex flex-col h-full overflow-hidden border-t-4 border-t-slate-500">
          <CardHeader className="py-3 px-4 border-b bg-slate-50 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Patients Queue
              </CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-8">
                <TabsList className="h-8">
                  <TabsTrigger value="queue" className="text-xs h-7">Live</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs h-7">Done</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 bg-slate-50/50">
            {activeTab === 'queue' ? (
              queueList.length > 0 ? (
                queueList.map(apt => <QueueItem key={apt._id} apt={apt} />)
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                  <Users className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Queue is empty</p>
                </div>
              )
            ) : (
              completedList.length > 0 ? (
                completedList.map(apt => (
                  <CompletedItem 
                    key={apt._id} 
                    apt={apt} 
                    onClick={(appointment) => {
                      setSelectedHistoryAppointment(appointment)
                      setIsHistoryModalOpen(true)
                    }}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                  <CheckCircle className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No completed appointments today</p>
                  <p className="text-xs mt-1">Completed consultations will appear here</p>
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: Active Patient Console */}
        <Card className="lg:col-span-2 flex flex-col h-full border-t-4 border-t-blue-600 shadow-md">
          {currentPatient ? (
            <>
              {/* Active Header */}
              <CardHeader className="py-4 px-6 border-b bg-blue-50/30 flex flex-row items-center gap-4">
                 <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                   <AvatarImage src={currentPatient.patientId?.profilePicture} />
                   <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">
                     {currentPatient.patientId?.firstName?.[0]}
                   </AvatarFallback>
                 </Avatar>
                 <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                     <h2 className="text-2xl font-bold text-slate-900">
                       {currentPatient.patientId?.firstName} {currentPatient.patientId?.lastName}
                     </h2>
                     <Badge className="bg-blue-600 hover:bg-blue-700">Token #{currentPatient.tokenNumber}</Badge>
                   </div>
                   <p className="text-slate-500 text-sm flex items-center gap-3">
                     <span>{currentPatient.patientId?.gender}, {currentPatient.patientId?.age} yrs</span>
                     <span className="w-1 h-1 bg-slate-300 rounded-full" />
                     <span>+91 {currentPatient.patientId?.phoneNumber}</span>
                   </p>
                 </div>
                 <div className="text-right">
                   <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Timer</div>
                   <div className="text-2xl font-mono font-bold text-slate-700">12:30</div> 
                   {/* You can add a real timer component here */}
                 </div>
              </CardHeader>

              {/* Active Workspace */}
              <CardContent className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Reason Section */}
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-yellow-800 uppercase mb-1 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" /> Reason for Visit
                  </h4>
                  <p className="text-slate-800 font-medium">
                    {currentPatient.reason || "No specific reason provided during booking."}
                  </p>
                </div>

                {/* Vitals Input Grid */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Record Vitals</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">Temp (°F)</label>
                      <Input 
                        type="text" 
                        placeholder="98.6" 
                        value={vitals.temperature}
                        onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">Weight (kg)</label>
                      <Input 
                        type="text" 
                        placeholder="70" 
                        value={vitals.weight}
                        onChange={(e) => setVitals({...vitals, weight: e.target.value})}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">BP (mmHg)</label>
                      <div className="flex gap-1">
                        <Input 
                          type="text" 
                          placeholder="120" 
                          value={vitals.bpSystolic}
                          onChange={(e) => setVitals({...vitals, bpSystolic: e.target.value})}
                          className="h-9 w-16"
                        />
                        <span className="flex items-center text-slate-400">/</span>
                        <Input 
                          type="text" 
                          placeholder="80" 
                          value={vitals.bpDiastolic}
                          onChange={(e) => setVitals({...vitals, bpDiastolic: e.target.value})}
                          className="h-9 w-16"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">SpO2 (%)</label>
                      <Input 
                        type="text" 
                        placeholder="98" 
                        value={vitals.spo2}
                        onChange={(e) => setVitals({...vitals, spo2: e.target.value})}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">Heart Rate (bpm)</label>
                      <Input 
                        type="text" 
                        placeholder="72" 
                        value={vitals.heartRate}
                        onChange={(e) => setVitals({...vitals, heartRate: e.target.value})}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="text-sm font-semibold text-slate-900 mb-2 block">Diagnosis *</label>
                  <Textarea 
                    placeholder="Enter diagnosis..." 
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Prescription Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Pill className="h-4 w-4 text-blue-600" />
                      Prescription (Optional)
                    </h4>
                    <span className="text-xs text-slate-500">
                      {prescription.length > 0 && `${prescription.length} medicine(s)`}
                      {prescriptionFile && ` • File attached`}
                    </span>
                  </div>

                  {/* Manual Prescription Upload */}
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-purple-900 mb-1">Upload Manual Prescription</h5>
                        <p className="text-xs text-purple-700 mb-3">Upload a photo or PDF of handwritten prescription (Optional)</p>
                        
                        {prescriptionFile ? (
                          <div className="flex items-center gap-2 p-2 bg-white rounded border border-purple-200">
                            <FileText className="h-4 w-4 text-purple-600" />
                            <span className="text-sm flex-1">{prescriptionFile.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPrescriptionFile(null)}
                              className="h-6 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-300 rounded cursor-pointer hover:bg-purple-50 transition-colors">
                            <Upload className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-purple-700">Choose File (PDF/Image)</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast.error('File size must be less than 5MB')
                                    return
                                  }
                                  setPrescriptionFile(file)
                                  toast.success('File selected')
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-xs text-slate-500 mb-4">OR</div>

                  {/* Existing Medicines */}
                  {prescription.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {prescription.map((med) => (
                        <div key={med.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <Pill className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900">{med.name}</div>
                            <div className="text-sm text-slate-600 mt-1">
                              {med.dosage} • {med.frequency} • {med.duration}
                            </div>
                            {med.instructions && (
                              <div className="text-xs text-slate-500 mt-1 italic">{med.instructions}</div>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveMedicine(med.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Medicine Form */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-dashed border-slate-300">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">Medicine Name *</label>
                        <Input 
                          placeholder="e.g., Paracetamol" 
                          value={newMedicine.name}
                          onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">Dosage *</label>
                        <Input 
                          placeholder="e.g., 500mg" 
                          value={newMedicine.dosage}
                          onChange={(e) => setNewMedicine({...newMedicine, dosage: e.target.value})}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">Frequency</label>
                        <Input 
                          placeholder="e.g., 3 times/day" 
                          value={newMedicine.frequency}
                          onChange={(e) => setNewMedicine({...newMedicine, frequency: e.target.value})}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">Duration</label>
                        <Input 
                          placeholder="e.g., 5 days" 
                          value={newMedicine.duration}
                          onChange={(e) => setNewMedicine({...newMedicine, duration: e.target.value})}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-slate-600 mb-1 block">Instructions</label>
                        <Input 
                          placeholder="e.g., After meals" 
                          value={newMedicine.instructions}
                          onChange={(e) => setNewMedicine({...newMedicine, instructions: e.target.value})}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={handleAddMedicine}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medicine
                    </Button>
                  </div>
                </div>

                {/* Next Visit Schedule */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarPlus className="h-4 w-4 text-green-600" />
                    <h4 className="text-sm font-semibold text-slate-900">Schedule Next Visit (Optional)</h4>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100 space-y-3">
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">Follow-up Date</label>
                      <Input 
                        type="date" 
                        value={nextVisit.date}
                        onChange={(e) => setNextVisit({...nextVisit, date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">Reason for Follow-up</label>
                      <Input 
                        placeholder="e.g., Review test results, Check recovery progress" 
                        value={nextVisit.reason}
                        onChange={(e) => setNextVisit({...nextVisit, reason: e.target.value})}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">Instructions for Patient</label>
                      <Textarea 
                        placeholder="Any specific instructions for the next visit..." 
                        value={nextVisit.instructions}
                        onChange={(e) => setNextVisit({...nextVisit, instructions: e.target.value})}
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="text-sm font-semibold text-slate-900 mb-2 block">Additional Notes</label>
                  <Textarea 
                    placeholder="Any additional instructions or observations..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>

              </CardContent>

              {/* Active Footer Actions */}
              <div className="p-4 bg-slate-50 border-t flex items-center justify-between">
                 <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                   Cancel Visit
                 </Button>
                 <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-md w-48" onClick={handleCompleteVisit}>
                   <CheckCircle className="h-5 w-5 mr-2" />
                   Complete Visit
                 </Button>
              </div>
            </>
          ) : (
            // EMPTY STATE (No Active Patient)
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
               <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                 <Stethoscope className="h-10 w-10 text-blue-500" />
               </div>
               <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready for Consultation</h2>
               <p className="text-slate-500 max-w-sm mb-8">
                 Select a patient from the queue or click "Next Patient" to automatically call the next token.
               </p>
               
               <Button size="xl" className="h-14 px-8 text-lg shadow-lg bg-blue-600 hover:bg-blue-700" onClick={handleNextPatient}>
                 <Play className="h-6 w-6 mr-2 fill-current" />
                 Call Next Patient
               </Button>
            </div>
          )}
        </Card>

      </div>

      {/* Patient History Modal */}
      {selectedHistoryAppointment && (
        <PatientHistoryModal
          appointment={selectedHistoryAppointment}
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false)
            setSelectedHistoryAppointment(null)
            setIsEditingPrescription(false)
          }}
          onUpdate={() => {
            fetchAppointments('today')
            setIsHistoryModalOpen(false)
            setSelectedHistoryAppointment(null)
            setIsEditingPrescription(false)
          }}
        />
      )}
    </div>
  )
}

// Patient History Modal Component
function PatientHistoryModal({ appointment, isOpen, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPrescription, setEditedPrescription] = useState(appointment.prescription || [])
  const [editedDiagnosis, setEditedDiagnosis] = useState(appointment.diagnosis || '')
  const [editedNotes, setEditedNotes] = useState(appointment.notes || '')
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveUpdates = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/appointment/${appointment._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: appointment.status,
          prescription: editedPrescription,
          diagnosis: editedDiagnosis,
          notes: editedNotes
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Prescription updated successfully')
        setIsEditing(false)
        onUpdate()
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch (error) {
      toast.error('Error updating prescription')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddMedicine = () => {
    if (!newMed.name || !newMed.dosage) {
      toast.error('Medicine name and dosage are required')
      return
    }
    setEditedPrescription([...editedPrescription, { ...newMed, id: Date.now() }])
    setNewMed({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
  }

  const handleRemoveMedicine = (id) => {
    setEditedPrescription(editedPrescription.filter(m => m.id !== id))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            Patient History & Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2">Patient Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700">Name:</span>
                <span className="font-medium ml-2">
                  {appointment.patientId?.firstName} {appointment.patientId?.lastName}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Age/Gender:</span>
                <span className="font-medium ml-2">
                  {appointment.patientId?.age}y, {appointment.patientId?.gender}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Phone:</span>
                <span className="font-medium ml-2">
                  {appointment.patientId?.phoneNumber}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Visit Date:</span>
                <span className="font-medium ml-2">
                  {format(new Date(appointment.scheduledTime), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          </div>

          {/* Vitals */}
          {appointment.vitals && Object.keys(appointment.vitals).some(k => appointment.vitals[k]) && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Recorded Vitals</h3>
              <div className="grid grid-cols-3 gap-3">
                {appointment.vitals.temperature && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-700">Temperature</p>
                    <p className="font-bold text-red-900">{appointment.vitals.temperature}°F</p>
                  </div>
                )}
                {appointment.vitals.weight && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">Weight</p>
                    <p className="font-bold text-blue-900">{appointment.vitals.weight} kg</p>
                  </div>
                )}
                {appointment.vitals.bpSystolic && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-700">BP</p>
                    <p className="font-bold text-purple-900">{appointment.vitals.bpSystolic}/{appointment.vitals.bpDiastolic}</p>
                  </div>
                )}
                {appointment.vitals.heartRate && (
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <p className="text-xs text-pink-700">Heart Rate</p>
                    <p className="font-bold text-pink-900">{appointment.vitals.heartRate} bpm</p>
                  </div>
                )}
                {appointment.vitals.spo2 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700">SpO2</p>
                    <p className="font-bold text-green-900">{appointment.vitals.spo2}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnosis */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Diagnosis</h3>
              {!isEditing && (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Pill className="w-4 h-4 mr-1" />
                  Update Prescription
                </Button>
              )}
            </div>
            {isEditing ? (
              <Textarea
                value={editedDiagnosis}
                onChange={(e) => setEditedDiagnosis(e.target.value)}
                placeholder="Enter diagnosis..."
                className="w-full"
                rows={2}
              />
            ) : (
              <p className="text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                {appointment.diagnosis || 'No diagnosis recorded'}
              </p>
            )}
          </div>

          {/* Prescription */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Prescription</h3>
            {isEditing ? (
              <div className="space-y-3">
                {editedPrescription.map((med, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex-1">
                      <p className="font-semibold">{med.name}</p>
                      <p className="text-sm text-slate-600">{med.dosage} • {med.frequency} • {med.duration}</p>
                      {med.instructions && <p className="text-xs text-slate-500 italic">{med.instructions}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMedicine(med.id)}
                      className="text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Add Medicine Form */}
                <div className="bg-slate-50 p-4 rounded-lg border border-dashed">
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Medicine name" value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} />
                    <Input placeholder="Dosage" value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} />
                    <Input placeholder="Frequency" value={newMed.frequency} onChange={(e) => setNewMed({...newMed, frequency: e.target.value})} />
                    <Input placeholder="Duration" value={newMed.duration} onChange={(e) => setNewMed({...newMed, duration: e.target.value})} />
                    <Input placeholder="Instructions" value={newMed.instructions} onChange={(e) => setNewMed({...newMed, instructions: e.target.value})} className="col-span-2" />
                  </div>
                  <Button size="sm" onClick={handleAddMedicine} className="mt-3">
                    <Plus className="w-4 h-4 mr-1" />  Add Medicine
                  </Button>
                </div>
              </div>
            ) : (
              appointment.prescription && appointment.prescription.length > 0 ? (
                <div className="space-y-2">
                  {appointment.prescription.map((med, idx) => (
                    <div key={idx} className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="font-semibold">{med.name}</p>
                      <p className="text-sm text-slate-600">{med.dosage} • {med.frequency} • {med.duration}</p>
                      {med.instructions && <p className="text-xs text-slate-500 italic">{med.instructions}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No prescription recorded</p>
              )
            )}

            {/* Manual Prescription File */}
            {appointment.prescriptionFileUrl && (
              <div className="mt-3">
                <a 
                  href={appointment.prescriptionFileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800"
                >
                  <FileText className="w-4 h-4" />
                  View Manual Prescription
                </a>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
            {isEditing ? (
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Additional notes..."
                className="w-full"
                rows={3}
              />
            ) : (
              <p className="text-sm bg-slate-50 p-3 rounded-lg">
                {appointment.notes || 'No additional notes'}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveUpdates} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Updates'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={onClose} className="w-full">
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
