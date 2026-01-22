'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Activity, Thermometer, Heart, Weight, Wind, User, Calendar, Clock, CheckCircle } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)

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

  // ✅ Use the dedicated check-in endpoint that generates token
  const handleCheckIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/appointment/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appointmentId: appointment._id,
          vitals: {
            temperature: vitals.temperature || undefined,
            weight: vitals.weight || undefined,
            bpSystolic: vitals.bpSystolic || undefined,
            bpDiastolic: vitals.bpDiastolic || undefined,
            spo2: vitals.spo2 || undefined,
            heartRate: vitals.heartRate || undefined
          },
          paymentStatus: 'PAID'
        })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        toast.success(`Checked In! Token #${data.tokenNumber}`)
        onCheckInSuccess?.()
        // Reset form
        setVitals({
          temperature: '',
          weight: '',
          bpSystolic: '',
          bpDiastolic: '',
          spo2: '',
          heartRate: ''
        })
      } else {
        toast.error(data.error || 'Check-in failed')
      }
    } catch (err) {
      console.error('Check-in error:', err)
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const isCheckedIn = appointment.status === 'CHECKED_IN' || appointment.status === 'IN_CONSULTATION'

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
        </div>
      </CardHeader>

      <CardContent className="p-6 flex-1 overflow-y-auto">
        {isCheckedIn ? (
          // Already Checked In State
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="h-20 w-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Patient Checked In</h3>
                <p className="text-foreground/60 text-sm mt-1">Token #{appointment.tokenNumber}</p>
                <p className="text-foreground/50 text-xs mt-2">Waiting for doctor's consultation call</p>
              </div>
            </div>

            {/* Show Recorded Vitals if Available */}
            {appointment.vitals && Object.keys(appointment.vitals).length > 0 && (
              <div className="border-t pt-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" /> Recorded Vitals
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {appointment.vitals.temperature && (
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      <span className="text-foreground/70">Temp:</span>
                      <span className="font-semibold">{appointment.vitals.temperature}°F</span>
                    </div>
                  )}
                  {appointment.vitals.weight && (
                    <div className="flex items-center gap-2">
                      <Weight className="w-4 h-4 text-blue-500" />
                      <span className="text-foreground/70">Weight:</span>
                      <span className="font-semibold">{appointment.vitals.weight} kg</span>
                    </div>
                  )}
                  {appointment.vitals.bpSystolic && appointment.vitals.bpDiastolic && (
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-foreground/70">BP:</span>
                      <span className="font-semibold">{appointment.vitals.bpSystolic}/{appointment.vitals.bpDiastolic}</span>
                    </div>
                  )}
                  {appointment.vitals.spo2 && (
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-cyan-500" />
                      <span className="text-foreground/70">SpO2:</span>
                      <span className="font-semibold">{appointment.vitals.spo2}%</span>
                    </div>
                  )}
                  {appointment.vitals.heartRate && (
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span className="text-foreground/70">Heart Rate:</span>
                      <span className="font-semibold">{appointment.vitals.heartRate} bpm</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Appointment Details */}
            <div className="border-t pt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Doctor</span>
                <span className="font-semibold text-foreground">
                  Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Scheduled</span>
                <span className="font-semibold text-foreground">
                  {format(new Date(appointment.scheduledTime), 'hh:mm a')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Type</span>
                <span className="font-semibold text-foreground">{appointment.type || 'Regular'}</span>
              </div>
            </div>
          </div>
        ) : (
          // Check-In Form
          <form onSubmit={handleCheckIn} className="space-y-6">
            {/* Appointment Details Card */}
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
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Type
                </span>
                <span className="font-semibold text-slate-900">{appointment.type || 'Regular'}</span>
              </div>
            </div>

            {/* Vitals Form */}
            <div>
              <div className="flex items-center gap-2 text-foreground font-semibold pb-3 mb-4 border-b">
                <Activity className="w-5 h-5 text-blue-600" /> Vitals Check
                <span className="text-xs text-foreground/50 font-normal ml-auto">(Optional)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Temperature */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Thermometer className="w-3 h-3 text-orange-500" /> Temperature (°F)
                  </Label>
                  <Input 
                    placeholder="98.6" 
                    type="number" 
                    step="0.1" 
                    value={vitals.temperature} 
                    onChange={e => setVitals({...vitals, temperature: e.target.value})}
                    className="h-10"
                  />
                </div>
                
                {/* Weight */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Weight className="w-3 h-3 text-blue-500" /> Weight (kg)
                  </Label>
                  <Input 
                    placeholder="70" 
                    type="number" 
                    step="0.1" 
                    value={vitals.weight} 
                    onChange={e => setVitals({...vitals, weight: e.target.value})}
                    className="h-10"
                  />
                </div>

                {/* BP Systolic */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Heart className="w-3 h-3 text-red-500" /> BP Systolic
                  </Label>
                  <Input 
                    placeholder="120" 
                    type="number" 
                    value={vitals.bpSystolic} 
                    onChange={e => setVitals({...vitals, bpSystolic: e.target.value})}
                    className="h-10"
                  />
                </div>
                
                {/* BP Diastolic */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Heart className="w-3 h-3 text-red-500" /> BP Diastolic
                  </Label>
                  <Input 
                    placeholder="80" 
                    type="number" 
                    value={vitals.bpDiastolic} 
                    onChange={e => setVitals({...vitals, bpDiastolic: e.target.value})}
                    className="h-10"
                  />
                </div>

                {/* SpO2 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Wind className="w-3 h-3 text-cyan-500" /> SpO2 (%)
                  </Label>
                  <Input 
                    placeholder="98" 
                    type="number" 
                    value={vitals.spo2} 
                    onChange={e => setVitals({...vitals, spo2: e.target.value})}
                    className="h-10"
                  />
                </div>
                
                {/* Heart Rate */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground/70 text-xs font-medium">
                    <Heart className="w-3 h-3 text-pink-500" /> Heart Rate (bpm)
                  </Label>
                  <Input 
                    placeholder="72" 
                    type="number" 
                    value={vitals.heartRate} 
                    onChange={e => setVitals({...vitals, heartRate: e.target.value})}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base shadow-md shadow-blue-200 font-semibold"
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm Check-In
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
