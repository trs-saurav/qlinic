'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, Thermometer, Heart, Weight, Wind, User, Calendar, Clock, CheckCircle, CreditCard, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function PatientCheckIn({ appointment, onCheckInSuccess }) {
  const [vitals, setVitals] = useState({
    temperature: '',
    weight: '',
    bpSystolic: '',
    bpDiastolic: '',
    spo2: '',
    heartRate: ''
  })
  
  // New state for payment update
  const [paymentStatus, setPaymentStatus] = useState('PENDING')
  const [loading, setLoading] = useState(false)
  const [updateMode, setUpdateMode] = useState(false)

  // Initialize form with existing data when appointment changes
  useEffect(() => {
    if (appointment) {
      setVitals({
        temperature: appointment.vitals?.temperature || '',
        weight: appointment.vitals?.weight || '',
        bpSystolic: appointment.vitals?.bpSystolic || '',
        bpDiastolic: appointment.vitals?.bpDiastolic || '',
        spo2: appointment.vitals?.spo2 || '',
        heartRate: appointment.vitals?.heartRate || ''
      })
      setPaymentStatus(appointment.paymentStatus || 'PENDING')
      
      // If already checked in, default to update mode is false, unless user clicks edit
      setUpdateMode(false) 
    }
  }, [appointment])

  if (!appointment) {
    return (
      <Card className="h-full border-dashed border-2 border-border shadow-none bg-secondary flex items-center justify-center">
        <div className="text-center text-foreground/50 p-8">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a patient from the queue<br />to view details and check-in</p>
        </div>
      </Card>
    )
  }

  const isCompleted = appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED'
  const isCheckedIn = appointment.status === 'CHECKED_IN' || appointment.status === 'IN_CONSULTATION'
  
  // Handler for Check-In OR Update
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const vitalsData = {
        temperature: vitals.temperature || '',
        weight: vitals.weight || '',
        bpSystolic: vitals.bpSystolic || '',
        bpDiastolic: vitals.bpDiastolic || '',
        spo2: vitals.spo2 || '',
        heartRate: vitals.heartRate || ''
      };

      // Determine Endpoint: if already checked in, we just update appointment details
      // If booked, we hit check-in to generate token
      const endpoint = isCheckedIn 
        ? `/api/appointment/${appointment._id}` // PATCH endpoint (You need to ensure this route exists or use a generic update route)
        : '/api/appointment/check-in'; // POST endpoint

      const method = isCheckedIn ? 'PATCH' : 'POST';
      
      const payload = isCheckedIn ? {
        vitals: vitalsData,
        paymentStatus: paymentStatus
      } : {
        appointmentId: appointment._id,
        vitals: vitalsData,
        paymentStatus: paymentStatus
      };
      
      console.log(`📋 Sending ${isCheckedIn ? 'update' : 'check-in'} request:`, payload)
      
      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (res.ok && (data.success || data.appointment)) {
        toast.success(isCheckedIn ? 'Vitals & Payment Updated!' : `Checked In! Token #${data.tokenNumber}`)
        onCheckInSuccess?.() // Refresh parent list
        setUpdateMode(false) // Exit update mode
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch (err) {
      console.error('Submit error:', err)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Allow editing if not completed
  const enableEdit = () => {
    if (isCompleted) return;
    setUpdateMode(true);
  }

  // Show form if: 
  // 1. Not checked in yet (Booked status)
  // 2. Already checked in BUT user clicked "Update" (UpdateMode)
  const showForm = !isCheckedIn || updateMode;

  return (
    <Card className="border-border shadow-sm h-full overflow-y-auto flex flex-col">
      {/* Patient Info Header */}
      <CardHeader className="bg-gradient-to-r from-blue-50 dark:from-blue-900/20 to-slate-50 dark:to-slate-800/20 border-b flex-shrink-0">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
              {appointment.patientId?.firstName?.[0]}{appointment.patientId?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-xl text-foreground">
              {appointment.patientId?.firstName} {appointment.patientId?.lastName}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-foreground/60 mt-1 flex-wrap">
              {appointment.tokenNumber && (
                <span className="bg-background px-2 py-0.5 rounded border border-border font-mono text-xs font-bold">
                  Token #{appointment.tokenNumber}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {appointment.patientId?.phoneNumber}
              </span>
            </div>
          </div>
          
          {/* Edit Button for Checked-In Patients */}
          {isCheckedIn && !updateMode && !isCompleted && (
             <Button size="sm" variant="outline" onClick={enableEdit} className="gap-2">
               <RefreshCw className="w-4 h-4" /> Update Vitals
             </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 flex-1 overflow-y-auto">
        {isCheckedIn && !updateMode ? (
          // === READ ONLY VIEW (Already Checked In) ===
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="h-16 w-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Patient Checked In</h3>
                <p className="text-foreground/60 text-sm mt-1">Status: {appointment.status}</p>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Payment: {appointment.paymentStatus}
                </div>
              </div>
            </div>

            {/* Read-Only Vitals Display */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" /> Recorded Vitals
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-foreground/70">Temp:</span>
                  <span className="font-semibold">{appointment.vitals?.temperature || '--'}°F</span>
                </div>
                <div className="flex items-center gap-2">
                   <Weight className="w-4 h-4 text-blue-500" />
                   <span className="text-foreground/70">Weight:</span>
                   <span className="font-semibold">{appointment.vitals?.weight || '--'} kg</span>
                </div>
                <div className="flex items-center gap-2">
                   <Heart className="w-4 h-4 text-red-500" />
                   <span className="text-foreground/70">BP:</span>
                   <span className="font-semibold">{appointment.vitals?.bpSystolic || '--'}/{appointment.vitals?.bpDiastolic || '--'}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Wind className="w-4 h-4 text-cyan-500" />
                   <span className="text-foreground/70">SpO2:</span>
                   <span className="font-semibold">{appointment.vitals?.spo2 || '--'}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // === EDIT / CHECK-IN FORM ===
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Appointment Summary (Only show on initial check-in) */}
            {!isCheckedIn && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> Doctor
                  </span>
                  <span className="font-semibold text-slate-900">
                    Dr. {appointment.doctorId?.firstName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Time
                  </span>
                  <span className="font-semibold text-slate-900">
                    {format(new Date(appointment.scheduledTime), 'hh:mm a')}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Status Update */}
            <div>
              <div className="flex items-center gap-2 text-foreground font-semibold pb-2 mb-3 border-b">
                 <CreditCard className="w-5 h-5 text-green-600" /> Payment Status
              </div>
              <Select value={paymentStatus} onValueChange={setPaymentStatus} disabled={isCompleted}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending (Unpaid)</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vitals Form */}
            <div>
              <div className="flex items-center gap-2 text-foreground font-semibold pb-3 mb-4 border-b">
                <Activity className="w-5 h-5 text-blue-600" /> {updateMode ? 'Update Vitals' : 'Vitals Check'}
                <span className="text-xs text-foreground/50 font-normal ml-auto">(Optional)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Thermometer className="w-3 h-3 text-orange-500" /> Temperature (°F)
                  </Label>
                  <Input placeholder="98.6" type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})} className="h-10"/>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Weight className="w-3 h-3 text-blue-500" /> Weight (kg)
                  </Label>
                  <Input placeholder="70" type="number" step="0.1" value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})} className="h-10"/>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Heart className="w-3 h-3 text-red-500" /> BP Systolic
                  </Label>
                  <Input placeholder="120" type="number" value={vitals.bpSystolic} onChange={e => setVitals({...vitals, bpSystolic: e.target.value})} className="h-10"/>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Heart className="w-3 h-3 text-red-500" /> BP Diastolic
                  </Label>
                  <Input placeholder="80" type="number" value={vitals.bpDiastolic} onChange={e => setVitals({...vitals, bpDiastolic: e.target.value})} className="h-10"/>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Wind className="w-3 h-3 text-cyan-500" /> SpO2 (%)
                  </Label>
                  <Input placeholder="98" type="number" value={vitals.spo2} onChange={e => setVitals({...vitals, spo2: e.target.value})} className="h-10"/>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Heart className="w-3 h-3 text-pink-500" /> Heart Rate (bpm)
                  </Label>
                  <Input placeholder="72" type="number" value={vitals.heartRate} onChange={e => setVitals({...vitals, heartRate: e.target.value})} className="h-10"/>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
               {updateMode && (
                 <Button type="button" variant="outline" className="flex-1" onClick={() => setUpdateMode(false)}>
                   Cancel
                 </Button>
               )}
               <Button 
                 type="submit" 
                 disabled={loading || isCompleted} 
                 className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base shadow-md shadow-blue-200 font-semibold"
               >
                 {loading ? 'Processing...' : (
                   isCheckedIn ? 'Update Info' : (
                     <><CheckCircle className="w-5 h-5 mr-2" /> Confirm Check-In</>
                   )
                 )}
               </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
