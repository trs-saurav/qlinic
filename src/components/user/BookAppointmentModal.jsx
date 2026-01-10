'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { Calendar as CalendarIcon, Clock, User, AlertCircle, Loader2, Info } from 'lucide-react'
import { format } from 'date-fns'
import { useUser } from '@/context/UserContext' // ✅ Import User Context

export default function BookAppointmentModal({ isOpen, onClose, doctor, hospital }) {
  const { familyMembers: contextFamilyMembers, loading: userLoading } = useUser() // ✅ Use Context
  
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // ✅ Auto-select 'Self' from context when modal opens
  useEffect(() => {
    if (isOpen && contextFamilyMembers?.length > 0 && !selectedMember) {
      const self = contextFamilyMembers.find(m => m.relationship === 'Self')
      if (self) setSelectedMember(self._id)
    }
  }, [isOpen, contextFamilyMembers])

  // Fetch slots whenever date/doctor changes
  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchAvailableSlots()
    }
  }, [isOpen, selectedDate, doctor, hospital])

  const fetchAvailableSlots = async () => {
    if (!doctor?._id || !hospital?._id || !selectedDate) return

    setLoadingSlots(true)
    setAvailableSlots([])
    setSelectedTime('') // Reset time when date changes

    try {
      // Use local date string to avoid timezone shifts
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      
      const response = await fetch(
        `/api/appointment/available-slots?doctorId=${doctor._id}&hospitalId=${hospital._id}&date=${dateStr}`
      )
      const data = await response.json()

      if (data.success) {
        setAvailableSlots(data.availableSlots || [])
      } else {
        // Only show error if it's not a "no schedule" message
        if (!data.message?.includes('No schedule')) {
           toast.error(data.message || 'Failed to load slots')
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to load availability')
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedMember) return toast.error('Please select a family member')
    if (!selectedTime) return toast.error('Please select a time slot')

    setIsLoading(true)
    const loadingToast = toast.loading('Confirming booking...')

    try {
      // Combine Date + Time accurately
      const [hours, minutes] = selectedTime.split(':')
      const appointmentDate = new Date(selectedDate)
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const response = await fetch('/api/appointment/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor._id,
          hospitalId: hospital._id,
          familyMemberId: selectedMember,
          scheduledTime: appointmentDate.toISOString(),
          reason,
          type: 'REGULAR'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Booking Confirmed! Token assigned upon arrival.', { id: loadingToast, duration: 5000 })
        onClose()
        // Optional: Trigger a refresh in parent component
        if (window.location.pathname.includes('/appointments')) {
           window.location.reload()
        }
      } else {
        toast.error(data.error || 'Failed to book appointment', { id: loadingToast })
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Network error. Please try again.', { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
        <DialogHeader className="p-6 pb-2 shrink-0 border-b">
          <DialogTitle className="text-xl">Book Appointment</DialogTitle>
          <DialogDescription>
            Schedule a visit with Dr. {doctor?.firstName} {doctor?.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Doctor Summary */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              {doctor?.firstName?.[0]}{doctor?.lastName?.[0]}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900">Dr. {doctor?.firstName} {doctor?.lastName}</h4>
              <p className="text-sm text-slate-600">{doctor?.specialization || 'General Physician'}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="font-medium text-slate-700">{hospital?.name}</span>
                {doctor?.consultationFee && (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 border-green-200">
                    ₹{doctor.consultationFee}
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {/* Smart Queue Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3 text-sm text-blue-800">
            <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
            <p>
              <strong>Note:</strong> Your specific Token Number will be generated when you physically arrive and check-in at the reception.
            </p>
          </div>

          <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Who is it for? */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" /> Patient
              </Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder={userLoading ? "Loading profiles..." : "Select Patient"} />
                </SelectTrigger>
                <SelectContent>
                  {contextFamilyMembers && contextFamilyMembers.length > 0 ? (
                    contextFamilyMembers.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.firstName} {member.lastName} <span className="text-slate-400 text-xs">({member.relationship})</span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no_members" disabled>No profiles found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 2. When? (Date) */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Preferred Date
              </Label>
              <div className="border rounded-lg p-3 flex justify-center bg-white">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => {
                    const today = new Date()
                    today.setHours(0,0,0,0)
                    return date < today || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  }}
                  className="rounded-md border-0"
                />
              </div>
            </div>

            {/* 3. Which Slot? (Time) */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> Available Slots
              </Label>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8 border rounded-lg border-dashed">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                  <span className="text-sm text-slate-500">Checking doctor's schedule...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-6 bg-orange-50 border border-orange-100 rounded-lg text-center">
                  <AlertCircle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-800">No slots available on this date.</p>
                  <p className="text-xs text-orange-600 mt-1">Please try selecting another date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      className={`
                        py-2 px-1 text-sm rounded-md border font-medium transition-all
                        ${selectedTime === slot.time 
                          ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/20' 
                          : 'bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 border-slate-200'
                        }
                      `}
                    >
                      {slot.displayTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Why? (Reason) */}
            <div className="space-y-3">
              <Label htmlFor="reason">Reason for Visit (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe symptoms (e.g., Fever, Headache)..."
                className="resize-none"
                rows={3}
              />
            </div>

          </form>
        </div>

        <div className="p-6 border-t bg-slate-50 shrink-0 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1" type="button">
            Cancel
          </Button>
          <Button 
            form="booking-form"
            type="submit" 
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={isLoading || !selectedMember || !selectedTime}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isLoading ? 'Booking...' : 'Confirm Appointment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
