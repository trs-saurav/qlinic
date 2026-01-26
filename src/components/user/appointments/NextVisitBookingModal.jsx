'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { CalendarPlus, Calendar as CalendarIcon, Clock, Loader2, AlertCircle, RefreshCw, Info } from 'lucide-react'
import { format, addDays, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

export default function NextVisitBookingModal({ isOpen, onClose, data, setData, onSuccess, doctor, hospital, recommendedDate }) {
  const [isCreating, setIsCreating] = useState(false)
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
  
  // ✅ Initialize with recommended date or tomorrow
  useEffect(() => {
    if (isOpen) {
      let initialDate = minDate // Default to tomorrow
      
      // If there's a recommended date from doctor
      if (recommendedDate) {
        try {
          const parsedDate = new Date(recommendedDate)
          console.log('📅 Doctor recommended date:', parsedDate)
          
          // Use recommended date if it's in the future
          if (parsedDate > new Date() && parsedDate <= maxDate) {
            initialDate = parsedDate
            console.log('✅ Using doctor recommended date')
          } else {
            console.log('⚠️ Recommended date out of range, using tomorrow')
          }
        } catch (error) {
          console.error('Invalid recommended date:', error)
        }
      }
      
      // If data has a scheduled date (from previous selection)
      if (data?.scheduledDate) {
        try {
          const dataDate = new Date(data.scheduledDate)
          if (!isNaN(dataDate.getTime())) {
            initialDate = dataDate
            console.log('📅 Using previously selected date:', dataDate)
          }
        } catch (error) {
          console.error('Invalid data date:', error)
        }
      }
      
      setSelectedDate(initialDate)
      setSelectedTime('')
      
      console.log('📅 Modal initialized with date:', initialDate)
    }
  }, [isOpen, recommendedDate, data?.scheduledDate])
  
  // Fetch available slots when date changes or modal opens
  useEffect(() => {
    if (isOpen && selectedDate && doctor?._id && hospital?._id) {
      console.log('🚀 Fetching slots for:', format(selectedDate, 'yyyy-MM-dd'))
      fetchAvailableSlots()
    }
  }, [isOpen, selectedDate, doctor?._id, hospital?._id])
  
  const fetchAvailableSlots = async () => {
    if (!doctor?._id || !hospital?._id || !selectedDate) {
      console.log('❌ Missing required parameters')
      return
    }

    setLoadingSlots(true)
    setAvailableSlots([])
    setSelectedTime('')

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const url = `/api/appointment/available-slots?doctorId=${doctor._id}&hospitalId=${hospital._id}&date=${dateStr}`
      
      console.log('🌐 Fetching from:', url)
      
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        console.log('✅ Found', result.availableSlots?.length || 0, 'slots')
        setAvailableSlots(result.availableSlots || [])
        
        if (result.availableSlots?.length === 0) {
          toast('No slots available on this date. Try another date.', {
            icon: '📅',
            duration: 3000
          })
        }
      } else {
        console.log('❌ API Error:', result.message)
        if (!result.message?.includes('No schedule')) {
           toast.error(result.message || 'Failed to load slots')
        }
      }
    } catch (error) {
      console.error('💥 Error fetching slots:', error)
      toast.error('Failed to load availability')
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedTime) {
      toast.error('Please select a time slot')
      return
    }
    
    // Create appointment date/time
    const [hours, minutes] = selectedTime.split(':')
    const appointmentDate = new Date(selectedDate)
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    // Validate that the appointment time is not in the past
    const now = new Date()
    const timeBuffer = 30 * 60 * 1000; // 30 minutes buffer
    
    if (appointmentDate < new Date(now.getTime() + timeBuffer)) {
      toast.error('Cannot book appointment for a time that has already passed or is too soon')
      return
    }
    
    // Create updated data object
    const updatedData = { 
      ...data, 
      scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
      scheduledTime: selectedTime,
      dateTime: appointmentDate.toISOString(),
      reason: data.reason || '',
      instructions: data.instructions || ''
    }
    
    console.log('📦 Booking appointment:', updatedData)
    
    setData(updatedData)
    
    setIsCreating(true)
    try {
      await onSuccess(updatedData)
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error('Failed to book appointment')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            Book Follow-up Appointment
          </DialogTitle>    
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-800">
              <strong>Follow-up Visit:</strong> Schedule a follow-up appointment with the same doctor and hospital.
            </p>
          </div>

          {/* ✅ Show doctor's recommended date if exists */}
          {recommendedDate && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Doctor's Recommendation:</strong> {format(new Date(recommendedDate), 'MMMM dd, yyyy')}
                <br />
                <span className="text-xs text-blue-600">You can select this date or choose another date that works for you.</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Select Date
              </label>
              <div className="border rounded-lg p-2 sm:p-3 flex justify-center bg-white">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      console.log('📅 Date selected:', date)
                      setSelectedDate(date)
                    }
                  }}
                  disabled={(date) => {
                    return date < minDate || date > maxDate
                  }}
                  className="rounded-md border-0 w-full"
                  modifiers={{
                    recommended: recommendedDate ? [new Date(recommendedDate)] : []
                  }}
                  modifiersStyles={{
                    recommended: {
                      backgroundColor: '#e0e7ff',
                      fontWeight: 'bold',
                      color: '#4f46e5',
                      border: '2px solid #6366f1'
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {recommendedDate && (
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-200 border-2 border-blue-500"></span>
                    Highlighted date is doctor's recommendation
                  </span>
                )}
              </p>
            </div>

            {/* Time Slot Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Available Time Slots
                  {selectedDate && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({format(selectedDate, 'MMM dd, yyyy')})
                    </span>
                  )}
                </label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchAvailableSlots}
                  disabled={loadingSlots}
                  className="h-8 px-2 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${loadingSlots ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8 border rounded-lg border-dashed">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Checking doctor's schedule...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-6 bg-orange-50 border border-orange-100 rounded-lg text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-orange-400 mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">No slots available on this date.</p>
                    <p className="text-xs text-orange-600 mt-1">Please select another date from the calendar above.</p>
                  </div>
                  {/* ✅ Quick date suggestions */}
                  <div className="pt-2">
                    <p className="text-xs text-orange-700 mb-2">Try these dates:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[1, 2, 3, 7].map((days) => {
                        const suggestedDate = addDays(selectedDate, days)
                        if (suggestedDate <= maxDate) {
                          return (
                            <Button
                              key={days}
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDate(suggestedDate)}
                              className="h-7 px-2 text-xs"
                            >
                              {format(suggestedDate, 'MMM dd')}
                            </Button>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-white">
                  {availableSlots
                    .filter(slot => slot.time && slot.displayTime) // Filter out invalid slots
                    .map((slot, index) => (
                    <button
                      key={`${slot.time}-${index}`}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      className={`
                        py-2 px-1 text-xs sm:text-sm rounded-md border font-medium transition-all
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
                Reason for Visit
              </label>
              <Input
                value={data.reason || ''}
                onChange={(e) => setData({ ...data, reason: e.target.value })}
                placeholder="Follow-up for previous consultation..."
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Additional Instructions
              </label>
              <Textarea
                value={data.instructions || ''}
                onChange={(e) => setData({ ...data, instructions: e.target.value })}
                placeholder="Any special instructions for the doctor..."
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
              onClick={handleSubmit}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={isCreating || !selectedTime}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  Book Appointment
                  <CalendarPlus className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
