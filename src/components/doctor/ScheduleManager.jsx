// src/components/doctor/ScheduleManager.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'
import { 
  Clock, Plus, Trash2, Save, Hospital, 
  Calendar, CheckCircle, Loader2, AlertCircle 
} from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${minute}`
})

export default function ScheduleManager() {
  const [hospitals, setHospitals] = useState([])
  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [hospitalsRes, schedulesRes] = await Promise.all([
        fetch('/api/doctor/affiliations'),
        fetch('/api/doctor/schedule')
      ])

      const [hospitalsData, schedulesData] = await Promise.all([
        hospitalsRes.json(),
        schedulesRes.json()
      ])

      if (hospitalsData.success) {
        const activeHospitals = hospitalsData.affiliations?.filter(a => a.status === 'accepted') || []
        setHospitals(activeHospitals)
      }

      if (schedulesData.success) {
        setSchedules(schedulesData.schedules || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load schedule data')
    } finally {
      setIsLoading(false)
    }
  }

  const getHospitalSchedule = (hospitalId) => {
    return schedules.find(s => s.hospitalId === hospitalId) || {
      hospitalId,
      workingDays: DAYS.map(day => ({
        day,
        isWorking: false,
        shifts: [{ startTime: '09:00', endTime: '17:00' }]
      }))
    }
  }

  const handleDayToggle = (hospitalId, dayIndex) => {
    setSchedules(prev => {
      const schedule = getHospitalSchedule(hospitalId)
      const updatedDays = [...schedule.workingDays]
      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        isWorking: !updatedDays[dayIndex].isWorking
      }

      const existingIndex = prev.findIndex(s => s.hospitalId === hospitalId)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...schedule, workingDays: updatedDays }
        return updated
      } else {
        return [...prev, { ...schedule, workingDays: updatedDays }]
      }
    })
  }

  const handleTimeChange = (hospitalId, dayIndex, shiftIndex, field, value) => {
    setSchedules(prev => {
      const schedule = getHospitalSchedule(hospitalId)
      const updatedDays = [...schedule.workingDays]
      const updatedShifts = [...updatedDays[dayIndex].shifts]
      updatedShifts[shiftIndex] = { ...updatedShifts[shiftIndex], [field]: value }
      updatedDays[dayIndex] = { ...updatedDays[dayIndex], shifts: updatedShifts }

      const existingIndex = prev.findIndex(s => s.hospitalId === hospitalId)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...schedule, workingDays: updatedDays }
        return updated
      } else {
        return [...prev, { ...schedule, workingDays: updatedDays }]
      }
    })
  }

  const addShift = (hospitalId, dayIndex) => {
    setSchedules(prev => {
      const schedule = getHospitalSchedule(hospitalId)
      const updatedDays = [...schedule.workingDays]
      updatedDays[dayIndex].shifts.push({ startTime: '09:00', endTime: '17:00' })

      const existingIndex = prev.findIndex(s => s.hospitalId === hospitalId)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...schedule, workingDays: updatedDays }
        return updated
      } else {
        return [...prev, { ...schedule, workingDays: updatedDays }]
      }
    })
  }

  const removeShift = (hospitalId, dayIndex, shiftIndex) => {
    setSchedules(prev => {
      const schedule = getHospitalSchedule(hospitalId)
      const updatedDays = [...schedule.workingDays]
      updatedDays[dayIndex].shifts = updatedDays[dayIndex].shifts.filter((_, i) => i !== shiftIndex)

      const existingIndex = prev.findIndex(s => s.hospitalId === hospitalId)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...schedule, workingDays: updatedDays }
        return updated
      }
      return prev
    })
  }

  const handleSave = async (hospitalId) => {
    setIsSaving(true)
    const loadingToast = toast.loading('Saving schedule...')

    try {
      const schedule = getHospitalSchedule(hospitalId)

      const response = await fetch('/api/doctor/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Schedule saved successfully', { id: loadingToast })
        fetchData()
      } else {
        toast.error(data.error || 'Failed to save schedule', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (hospitals.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-12 text-center">
          <Hospital className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
            No Hospital Affiliations
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
            Accept hospital affiliations to set your work schedule
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hospital Selector */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <Label className="text-base font-semibold mb-3 block">Select Hospital</Label>
          <Select value={selectedHospital} onValueChange={setSelectedHospital}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Choose a hospital to set schedule" />
            </SelectTrigger>
            <SelectContent>
              {hospitals.map((hospital) => (
                <SelectItem key={hospital._id} value={hospital.hospitalId?._id}>
                  {hospital.hospitalId?.name || 'Hospital'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedHospital && (
        <>
          {/* Schedule Grid */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-6">
                {DAYS.map((day, dayIndex) => {
                  const schedule = getHospitalSchedule(selectedHospital)
                  const daySchedule = schedule.workingDays[dayIndex]

                  return (
                    <div key={day} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={daySchedule.isWorking}
                            onCheckedChange={() => handleDayToggle(selectedHospital, dayIndex)}
                          />
                          <Label className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {day}
                          </Label>
                          {daySchedule.isWorking && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        {daySchedule.isWorking && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addShift(selectedHospital, dayIndex)}
                            className="font-semibold"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Shift
                          </Button>
                        )}
                      </div>

                      {daySchedule.isWorking && (
                        <div className="space-y-3 ml-8">
                          {daySchedule.shifts.map((shift, shiftIndex) => (
                            <div key={shiftIndex} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg">
                              <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs text-slate-500 mb-1">Start Time</Label>
                                  <Select
                                    value={shift.startTime}
                                    onValueChange={(v) => handleTimeChange(selectedHospital, dayIndex, shiftIndex, 'startTime', v)}
                                  >
                                    <SelectTrigger className="h-10">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIME_SLOTS.map(time => (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs text-slate-500 mb-1">End Time</Label>
                                  <Select
                                    value={shift.endTime}
                                    onValueChange={(v) => handleTimeChange(selectedHospital, dayIndex, shiftIndex, 'endTime', v)}
                                  >
                                    <SelectTrigger className="h-10">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIME_SLOTS.map(time => (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              {daySchedule.shifts.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeShift(selectedHospital, dayIndex, shiftIndex)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={() => handleSave(selectedHospital)}
            disabled={isSaving}
            className="w-full h-12 text-base font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving Schedule...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Schedule
              </>
            )}
          </Button>
        </>
      )}
    </div>
  )
}
