// src/components/patient/BookAppointmentModal.jsx
'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'
import { Calendar as CalendarIcon, Clock, User, AlertCircle } from 'lucide-react'

export default function BookAppointmentModal({ isOpen, onClose, doctor, hospital }) {
  const [familyMembers, setFamilyMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState('')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchFamilyMembers()
    }
  }, [isOpen])

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/patient/family')
      const data = await response.json()

      if (data.familyMembers) {
        setFamilyMembers(data.familyMembers)
        // Auto-select "Self" if available
        const self = data.familyMembers.find(m => m.relationship === 'Self')
        if (self) {
          setSelectedMember(self._id)
        }
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
    }
  }

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
    '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedMember) {
      toast.error('Please select a family member')
      return
    }

    if (!selectedTime) {
      toast.error('Please select a time slot')
      return
    }

    setIsLoading(true)
    const loadingToast = toast.loading('Booking appointment...')

    try {
      // Combine date and time
      const [time, period] = selectedTime.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0

      const appointmentDate = new Date(selectedDate)
      appointmentDate.setHours(hour, parseInt(minutes), 0, 0)

      const response = await fetch('/api/patient/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor._id,
          hospitalId: hospital._id,
          familyMemberId: selectedMember,
          scheduledTime: appointmentDate.toISOString(),
          reason,
          type: 'SCHEDULED'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Appointment booked successfully!', { id: loadingToast })
        onClose()
        // Refresh appointments
        window.dispatchEvent(new CustomEvent('patientTabChange', { detail: 'appointments' }))
      } else {
        toast.error(data.error || 'Failed to book appointment', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Doctor Info */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                {doctor.firstName[0]}{doctor.lastName[0]}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  Dr. {doctor.firstName} {doctor.lastName}
                </h4>
                <p className="text-sm text-slate-600">{doctor.doctorProfile?.specialization}</p>
                <p className="text-xs text-slate-500">{hospital.name}</p>
              </div>
            </div>
            {doctor.doctorProfile?.consultationFee && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-slate-600">
                  Consultation Fee: <span className="font-bold text-slate-900">₹{doctor.doctorProfile.consultationFee}</span>
                </p>
              </div>
            )}
          </div>

          {/* Select Family Member */}
          <div>
            <Label htmlFor="member" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Appointment For <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedMember} onValueChange={setSelectedMember} required>
              <SelectTrigger id="member" className="mt-2">
                <SelectValue placeholder="Select family member" />
              </SelectTrigger>
              <SelectContent>
                {familyMembers.map((member) => (
                  <SelectItem key={member._id} value={member._id}>
                    {member.firstName} {member.lastName} ({member.relationship})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {familyMembers.length === 0 && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Please add yourself as a family member first
              </p>
            )}
          </div>

          {/* Select Date */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <CalendarIcon className="w-4 h-4" />
              Select Date <span className="text-red-500">*</span>
            </Label>
            <div className="border rounded-lg p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                className="rounded-md"
              />
            </div>
          </div>

          {/* Select Time */}
          <div>
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Time Slot <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={`p-2 text-sm rounded-lg border-2 transition-all ${
                    selectedTime === slot
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason for Visit (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe your symptoms or reason for consultation..."
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isLoading || familyMembers.length === 0}
            >
              {isLoading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
