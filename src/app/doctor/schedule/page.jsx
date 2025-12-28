'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDoctor } from '@/context/DoctorContextProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  MapPin, 
  AlertCircle,
  Save,
  CalendarX,
  CalendarClock,
  CheckCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function emptyWeekly() {
  return DAYS.map((d) => ({ day: d, slots: [] }))
}

function SlotRow({ slot, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div>
          <span className="font-semibold">{slot.start}</span>
          <span className="text-muted-foreground mx-1">→</span>
          <span className="font-semibold">{slot.end}</span>
          {slot.room && (
            <span className="text-muted-foreground ml-2">• Room {slot.room}</span>
          )}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onRemove}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function HospitalScheduleCard({ affiliation, onManageSchedule }) {
  const hospital = affiliation.hospitalId

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onManageSchedule}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              {hospital?.name || 'Hospital'}
            </CardTitle>
            {hospital?.address?.city && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {hospital.address.city}, {hospital.address.state}
              </CardDescription>
            )}
          </div>
          <Badge variant="secondary">
            {affiliation.hasSchedule ? 'Schedule Set' : 'No Schedule'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="outline">
          <CalendarClock className="h-4 w-4 mr-2" />
          Manage Schedule
        </Button>
      </CardContent>
    </Card>
  )
}

export default function DoctorSchedulePage() {
  const { affiliations, affiliationsLoading, fetchAffiliations } = useDoctor()

  // Active hospital being edited
  const [activeAffiliation, setActiveAffiliation] = useState(null)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)

  // Schedule data for active hospital
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [weekly, setWeekly] = useState([])
  const [exceptions, setExceptions] = useState([])

  // Slot editor state
  const [slotDialogOpen, setSlotDialogOpen] = useState(false)
  const [activeDay, setActiveDay] = useState('MON')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('17:00')
  const [room, setRoom] = useState('')

  // Exception editor state
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false)
  const [excDate, setExcDate] = useState('')
  const [excUnavailable, setExcUnavailable] = useState(false)
  const [excReason, setExcReason] = useState('')

  useEffect(() => {
    fetchAffiliations()
  }, [])

  // Get approved affiliations only
  const approvedAffiliations = useMemo(() => {
    return (affiliations || []).filter(a => a.status === 'APPROVED')
  }, [affiliations])

  const dayMap = useMemo(() => {
    const map = new Map()
    for (const d of weekly) map.set(d.day, d)
    return map
  }, [weekly])

  async function openScheduleEditor(affiliation) {
    setActiveAffiliation(affiliation)
    setScheduleDialogOpen(true)
    setLoading(true)

    try {
      const res = await fetch(`/api/doctor/schedule?affiliationId=${affiliation._id}`)
      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error || 'Failed to load schedule')
        setWeekly(emptyWeekly())
        setExceptions([])
      } else {
        setWeekly(data?.schedule?.weekly?.length ? data.schedule.weekly : emptyWeekly())
        setExceptions(Array.isArray(data?.schedule?.exceptions) ? data.schedule.exceptions : [])
      }
    } catch (e) {
      toast.error('Failed to load schedule')
      setWeekly(emptyWeekly())
      setExceptions([])
    } finally {
      setLoading(false)
    }
  }

  function validateSlot(day, newSlot) {
    const dayData = dayMap.get(day)
    if (!dayData?.slots?.length) return { valid: true }

    const newStart = newSlot.start
    const newEnd = newSlot.end

    // Check time format
    if (!newStart.match(/^\d{2}:\d{2}$/)) {
      return { valid: false, error: 'Invalid start time format. Use HH:mm' }
    }
    if (!newEnd.match(/^\d{2}:\d{2}$/)) {
      return { valid: false, error: 'Invalid end time format. Use HH:mm' }
    }

    // Check start < end
    if (newStart >= newEnd) {
      return { valid: false, error: 'Start time must be before end time' }
    }

    // Check for overlaps
    for (const slot of dayData.slots) {
      const slotStart = slot.start
      const slotEnd = slot.end

      // Check if new slot overlaps with existing slot
      if (
        (newStart >= slotStart && newStart < slotEnd) ||
        (newEnd > slotStart && newEnd <= slotEnd) ||
        (newStart <= slotStart && newEnd >= slotEnd)
      ) {
        return { 
          valid: false, 
          error: `Overlaps with existing slot ${slotStart}-${slotEnd}`
        }
      }
    }

    return { valid: true }
  }

  function addSlot() {
    const validation = validateSlot(activeDay, { start, end })

    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setWeekly((prev) => {
      const next = prev.map((d) => 
        d.day === activeDay 
          ? { ...d, slots: [...(d.slots || []), { start, end, room }].sort((a, b) => a.start.localeCompare(b.start)) } 
          : d
      )
      return next
    })

    toast.success('Slot added')
    setSlotDialogOpen(false)
    setRoom('')
    setStart('09:00')
    setEnd('17:00')
  }

  function removeSlot(day, index) {
    setWeekly((prev) =>
      prev.map((d) => (d.day === day ? { ...d, slots: (d.slots || []).filter((_, i) => i !== index) } : d))
    )
    toast.success('Slot removed')
  }

  function upsertException() {
    if (!excDate) return toast.error('Please select a date')

    // Validate date format
    if (!excDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return toast.error('Invalid date format. Use YYYY-MM-DD')
    }

    // Check if date is in the past
    const selectedDate = new Date(excDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      return toast.error('Cannot set exception for past dates')
    }

    setExceptions((prev) => {
      const idx = prev.findIndex((e) => e.date === excDate)
      const nextItem = { 
        date: excDate, 
        unavailable: excUnavailable,
        reason: excReason || '',
        slots: [] 
      }

      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = nextItem
        return copy
      }
      return [...prev, nextItem].sort((a, b) => a.date.localeCompare(b.date))
    })

    toast.success(excUnavailable ? 'Day marked as unavailable' : 'Exception added')
    setExceptionDialogOpen(false)
    setExcDate('')
    setExcUnavailable(false)
    setExcReason('')
  }

  function removeException(date) {
    setExceptions((prev) => prev.filter(e => e.date !== date))
    toast.success('Exception removed')
  }

  async function saveSchedule() {
    if (!activeAffiliation) return

    setSaving(true)
    try {
      const res = await fetch('/api/doctor/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          affiliationId: activeAffiliation._id,
          weekly, 
          exceptions 
        }),
      })
      const data = await res.json()

      if (!res.ok) return toast.error(data?.error || 'Failed to save schedule')

      toast.success(`Schedule saved for ${activeAffiliation.hospitalId.name}`)
      setScheduleDialogOpen(false)
      fetchAffiliations()
    } catch (e) {
      toast.error('Failed to save schedule')
    } finally {
      setSaving(false)
    }
  }

  if (affiliationsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (approvedAffiliations.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Hospital Affiliations</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                You need to be affiliated with at least one hospital to set your schedule.
                Go to Affiliations page to request affiliation with hospitals.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage your availability across different hospitals
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Set separate schedules for each hospital. Patients can only book appointments during your available slots.
        </AlertDescription>
      </Alert>

      {/* Hospital Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {approvedAffiliations.map((affiliation) => (
          <HospitalScheduleCard
            key={affiliation._id}
            affiliation={affiliation}
            onManageSchedule={() => openScheduleEditor(affiliation)}
          />
        ))}
      </div>

      {/* Schedule Editor Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {activeAffiliation?.hospitalId?.name} - Schedule
            </DialogTitle>
            <DialogDescription>
              Set your weekly availability and day-specific exceptions for this hospital
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="weekly" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="weekly" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Weekly Schedule
                </TabsTrigger>
                <TabsTrigger value="exceptions" className="gap-2">
                  <CalendarX className="h-4 w-4" />
                  Exceptions ({exceptions.length})
                </TabsTrigger>
              </TabsList>

              {/* Weekly Schedule Tab */}
              <TabsContent value="weekly" className="mt-4 space-y-4">
                {DAYS.map((day) => {
                  const d = dayMap.get(day) || { day, slots: [] }
                  return (
                    <Card key={day}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">{day}</CardTitle>
                          <Dialog 
                            open={slotDialogOpen && activeDay === day} 
                            onOpenChange={(open) => {
                              setSlotDialogOpen(open)
                              if (open) setActiveDay(day)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setActiveDay(day)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Slot
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Time Slot - {day}</DialogTitle>
                                <DialogDescription>
                                  Define when you'll be available on {day}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="start">Start Time</Label>
                                    <Input 
                                      id="start"
                                      type="time"
                                      value={start} 
                                      onChange={(e) => setStart(e.target.value)} 
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="end">End Time</Label>
                                    <Input 
                                      id="end"
                                      type="time"
                                      value={end} 
                                      onChange={(e) => setEnd(e.target.value)} 
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="room">Room Number (Optional)</Label>
                                  <Input 
                                    id="room"
                                    value={room} 
                                    onChange={(e) => setRoom(e.target.value)} 
                                    placeholder="e.g., 101, OPD-3"
                                  />
                                </div>
                              </div>

                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSlotDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={addSlot}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Slot
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(d.slots || []).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No slots defined for this day
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {(d.slots || []).map((slot, idx) => (
                              <SlotRow 
                                key={`${day}-${idx}`} 
                                slot={slot} 
                                onRemove={() => removeSlot(day, idx)} 
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </TabsContent>

              {/* Exceptions Tab */}
              <TabsContent value="exceptions" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Add Exception</CardTitle>
                    <CardDescription>
                      Mark specific dates as unavailable or set custom availability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={exceptionDialogOpen} onOpenChange={setExceptionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Date Exception
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Date Exception</DialogTitle>
                          <DialogDescription>
                            Set a specific date as unavailable or with custom hours
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="exc-date">Date</Label>
                            <Input 
                              id="exc-date"
                              type="date"
                              value={excDate} 
                              onChange={(e) => setExcDate(e.target.value)} 
                            />
                          </div>

                          <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                              <Label>Mark as Unavailable</Label>
                              <p className="text-xs text-muted-foreground">
                                No appointments will be accepted on this date
                              </p>
                            </div>
                            <Switch
                              checked={excUnavailable}
                              onCheckedChange={setExcUnavailable}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="exc-reason">Reason (Optional)</Label>
                            <Input 
                              id="exc-reason"
                              value={excReason} 
                              onChange={(e) => setExcReason(e.target.value)} 
                              placeholder="e.g., Conference, Leave, Emergency"
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setExceptionDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={upsertException}>
                            Add Exception
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                {/* Exceptions List */}
                {exceptions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Scheduled Exceptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {exceptions.map((exc) => (
                          <div 
                            key={exc.date} 
                            className="flex items-center justify-between rounded-lg border bg-card p-3"
                          >
                            <div className="flex items-center gap-3">
                              <CalendarX className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-semibold text-sm">
                                  {new Date(exc.date).toLocaleDateString('en-IN', { 
                                    weekday: 'short',
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}
                                </p>
                                {exc.unavailable ? (
                                  <Badge variant="destructive" className="text-xs mt-1">
                                    Unavailable
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Custom
                                  </Badge>
                                )}
                                {exc.reason && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {exc.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeException(exc.date)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSchedule} disabled={saving}>
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
