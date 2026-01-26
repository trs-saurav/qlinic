'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { CalendarPlus, Calendar as CalendarIcon, Clock, Loader2, AlertCircle, RefreshCcw } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function RescheduleModal({ isOpen, onClose, data, setData, onConfirm, doctor, hospital }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  // Set minimum date to tomorrow
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  
  // Set maximum date to 3 months ahead
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)
  
  // Initialize selected date when modal opens and data is available
  useEffect(() => {
    if (isOpen && data?.newDate) {
      try {
        const initialDate = new Date(data.newDate);
        if (!isNaN(initialDate.getTime())) {
          setSelectedDate(initialDate);
          console.log('📅 Initialized selectedDate to:', initialDate);
        }
      } catch (error) {
        console.error('Invalid date format:', data.newDate);
      }
    }
  }, [isOpen, data?.newDate]);
  
  // Fetch available slots when date changes
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { isOpen, selectedDate, doctorId: doctor?._id, hospitalId: hospital?._id })
    if (isOpen && selectedDate && doctor?._id && hospital?._id) {
      console.log('🔄 Fetching slots...')
      fetchAvailableSlots()
    }
  }, [isOpen, selectedDate, doctor?._id, hospital?._id])
  
  const fetchAvailableSlots = async () => {
    if (!doctor?._id || !hospital?._id || !selectedDate) return

    setLoadingSlots(true)
    setAvailableSlots([])
    setSelectedTime('')

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      
      const response = await fetch(
        `/api/appointment/available-slots?doctorId=${doctor._id}&hospitalId=${hospital._id}&date=${dateStr}`
      )
      const data = await response.json()

      if (data.success) {
        console.log('✅ Setting available slots:', data.availableSlots || [])
        setAvailableSlots(data.availableSlots || [])
      } else {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-lg w-full mx-2 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Please reschedule at least 24 hours before your appointment time.
            </p>
          </div>

          <div className="space-y-4">
            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Select New Date
              </label>
              <div className="border rounded-lg p-3 flex justify-center bg-white">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => {
                    return date < minDate || date > maxDate
                  }}
                  className="rounded-md border-0"
                />
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Available Time Slots
                </label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchAvailableSlots}
                  disabled={loadingSlots}
                  className="h-8 px-2 text-xs"
                >
                  <RefreshCcw className={`w-3 h-3 mr-1 ${loadingSlots ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8 border rounded-lg border-dashed">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Checking doctor's schedule...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-6 bg-orange-50 border border-orange-100 rounded-lg text-center">
                  <AlertCircle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-800">No slots available on this date.</p>
                  <p className="text-xs text-orange-600 mt-1">Please try selecting another date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots
                    .filter(slot => slot.time && slot.displayTime) // Filter out invalid slots
                    .map((slot, index) => (
                    <button
                      key={`${slot.time}-${index}`}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      className={`
                        py-2 px-1 text-xs sm:text-sm rounded-md border font-medium transition-all min-w-[60px]
                        ${selectedTime === slot.time 
                          ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/20' 
                          : 'bg-white hover:bg-muted hover:border-input text-foreground border-input'
                        }
                      `}
                    >
                      {slot.displayTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Reason for Reschedule
              </label>
              <Input
                value={data?.reason || ''}  // ✅ Add null check
                onChange={(e) => setData({ ...data, reason: e.target.value })}
                placeholder="e.g., Personal emergency, conflicting appointment"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Additional Instructions
              </label>
              <Textarea
                value={data?.instructions || ''}  // ✅ Add null check
                onChange={(e) => setData({ ...data, instructions: e.target.value })}
                placeholder="Any special instructions for the clinic..."
                className="w-full"
                rows={3}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!selectedTime) {
                  toast.error('Please select a time slot')
                  return
                }
                console.log('🔍 CONFIRM RESCHEDULE CLICKED');
                console.log('📅 Selected date:', selectedDate);
                console.log('🕐 Selected time:', selectedTime);
                
                // Update data with selected date and time before confirming
                const [hours, minutes] = selectedTime.split(':')
                const appointmentDate = new Date(selectedDate)
                appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
                
                // Validate that the appointment time is not in the past
                const now = new Date()
                const timeBuffer = 30 * 60 * 1000; // 30 minutes buffer
                
                if (appointmentDate < new Date(now.getTime() + timeBuffer)) {
                  toast.error('Cannot reschedule appointment for a time that has already passed or is too soon')
                  return
                }
                
                const updatedData = { 
                  ...data, 
                  newDate: format(selectedDate, 'yyyy-MM-dd'),
                  newTime: selectedTime,
                  scheduledTime: appointmentDate.toISOString()
                };
                
                console.log('📋 Updated data to send:', updatedData);
                
                setData(updatedData);
                onConfirm(updatedData)  // ✅ Pass updatedData to onConfirm
              }} 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!selectedTime}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}