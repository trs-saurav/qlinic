'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useDoctor } from '@/context/DoctorContextProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Loader2,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// --- Helper Functions ---

const toMinutes = (time) => {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// --- Helper Components ---

function SlotRow({ slot, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50/50 p-2.5 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all group">
      <div className="flex items-center gap-3 text-sm overflow-hidden">
        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="font-semibold text-slate-700">{slot.start}</span>
          <span className="text-slate-400 text-xs">to</span>
          <span className="font-semibold text-slate-700">{slot.end}</span>
          {slot.room && (
            <Badge variant="secondary" className="text-[10px] px-1.5 h-5 ml-1 font-normal bg-white border-slate-200 text-slate-500">
              Rm {slot.room}
            </Badge>
          )}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onRemove}
        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

function HospitalScheduleCard({ affiliation, onManageSchedule }) {
  const hospital = affiliation.hospitalId
  const hasSchedule = affiliation.weeklySchedule?.some(day => day.slots?.length > 0)

  return (
    <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden border-l-4 border-l-transparent hover:border-l-primary" onClick={onManageSchedule}>
      <CardHeader className="pb-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg truncate text-slate-800 group-hover:text-primary transition-colors">
              <Building2 className="h-5 w-5 shrink-0" />
              <span className="truncate">{hospital?.name || 'Hospital'}</span>
            </CardTitle>
            {hospital?.address?.city && (
              <CardDescription className="flex items-center gap-1.5 text-xs truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {hospital.address.city}, {hospital.address.state}
              </CardDescription>
            )}
          </div>
          <Badge variant={hasSchedule ? "default" : "secondary"} className={`shrink-0 ${hasSchedule ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}`}>
            {hasSchedule ? 'Active' : 'Setup'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button className="w-full bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:text-primary hover:border-primary transition-all shadow-sm group-hover:shadow">
          <CalendarClock className="h-4 w-4 mr-2" />
          Manage Schedule
        </Button>
      </CardContent>
    </Card>
  )
}

// --- Main Page Component ---

export default function DoctorSchedulePage() {
  const { affiliations, affiliationsLoading, fetchAffiliations } = useDoctor()

  // --- State ---
  const [activeAffiliation, setActiveAffiliation] = useState(null)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Schedule Data
  const [weekly, setWeekly] = useState([])
  const [exceptions, setExceptions] = useState([])
  
  // ✅ FIX: Default is 15, but we will explicitly check API response
  const [slotDuration, setSlotDuration] = useState(15) 

  // Slot Editor State
  const [slotDialogOpen, setSlotDialogOpen] = useState(false)
  const [activeDay, setActiveDay] = useState('MON')
  const [newSlot, setNewSlot] = useState({ start: '09:00', end: '17:00', room: '' })

  // Exception Editor State
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false)
  const [newException, setNewException] = useState({ date: '', unavailable: false, reason: '' })

  // --- Derived State ---
  const approvedAffiliations = useMemo(() => {
    return (affiliations || []).filter(a => a.status === 'APPROVED')
  }, [affiliations])

  const dayMap = useMemo(() => {
    const map = new Map()
    DAYS.forEach(d => map.set(d, { day: d, slots: [] }))
    if (weekly) {
      weekly.forEach(d => map.set(d.day, d))
    }
    return map
  }, [weekly])

  // --- Effects ---
  useEffect(() => {
    if (!affiliationsLoading && affiliations.length === 0) {
      fetchAffiliations()
    }
  }, [])

  // --- Handlers ---

  const openScheduleEditor = async (affiliation) => {
    setActiveAffiliation(affiliation)
    setScheduleDialogOpen(true)
    setLoadingSchedule(true)

    try {
      const res = await fetch(`/api/doctor/schedule?affiliationId=${affiliation._id}`)
      const data = await res.json()

      if (data.success) {
        setWeekly(data.schedule.weekly || [])
        setExceptions(data.schedule.exceptions || [])
        
        // ✅ CRITICAL FIX: Only update if value exists, otherwise fallback to 15
        const duration = data.schedule.slotDuration ? parseInt(data.schedule.slotDuration) : 15
        setSlotDuration(duration)
        
      } else {
        setWeekly([])
        setExceptions([])
        setSlotDuration(15)
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load schedule')
    } finally {
      setLoadingSchedule(false)
    }
  }

  function validateSlot(day, slot) {
    if (!slot.start.match(/^\d{2}:\d{2}$/) || !slot.end.match(/^\d{2}:\d{2}$/)) {
      return 'Invalid time format (HH:mm)'
    }

    const startMins = toMinutes(slot.start)
    const endMins = toMinutes(slot.end)

    if (startMins >= endMins) {
      return 'Start time must be before end time'
    }
    
    const existingSlots = dayMap.get(day)?.slots || []
    
    // Robust Overlap Check
    const hasOverlap = existingSlots.some(s => {
      const sStart = toMinutes(s.start)
      const sEnd = toMinutes(s.end)

      return (
        (startMins >= sStart && startMins < sEnd) || 
        (endMins > sStart && endMins <= sEnd) ||     
        (startMins <= sStart && endMins >= sEnd)     
      )
    })
    
    if (hasOverlap) return 'Slot overlaps with existing time'
    
    return null
  }

  function handleAddSlot() {
    const error = validateSlot(activeDay, newSlot)
    if (error) return toast.error(error)

    setWeekly(prev => {
      const existingDayIndex = prev.findIndex(d => d.day === activeDay)
      const updatedSlot = { ...newSlot }
      
      const sortSlots = (slots) => [...slots].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))

      if (existingDayIndex >= 0) {
        const updatedWeekly = [...prev]
        const currentSlots = [...updatedWeekly[existingDayIndex].slots]
        updatedWeekly[existingDayIndex] = {
          ...updatedWeekly[existingDayIndex],
          slots: sortSlots([...currentSlots, updatedSlot])
        }
        return updatedWeekly
      } else {
        return [...prev, { day: activeDay, slots: [updatedSlot] }]
      }
    })

    setSlotDialogOpen(false)
    setNewSlot({ start: '09:00', end: '17:00', room: '' })
    toast.success('Slot added')
  }

  function handleRemoveSlot(day, index) {
    setWeekly(prev => {
      return prev.map(d => {
        if (d.day !== day) return d
        return { ...d, slots: d.slots.filter((_, i) => i !== index) }
      }).filter(d => d.slots.length > 0)
    })
  }

  function handleAddException() {
    if (!newException.date) return toast.error('Select a date')
    
    const today = new Date().toISOString().split('T')[0]
    if (newException.date < today) return toast.error('Cannot set past dates')

    setExceptions(prev => {
      const filtered = prev.filter(e => e.date !== newException.date)
      return [...filtered, { ...newException, slots: [] }].sort((a, b) => a.date.localeCompare(b.date))
    })

    setExceptionDialogOpen(false)
    setNewException({ date: '', unavailable: false, reason: '' })
    toast.success('Exception added')
  }

  function handleRemoveException(date) {
    setExceptions(prev => prev.filter(e => e.date !== date))
  }

  async function handleSave() {
    if (!activeAffiliation) return
    setSaving(true)

    try {
      const res = await fetch('/api/doctor/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliationId: activeAffiliation._id,
          weekly,
          exceptions,
          slotDuration: parseInt(slotDuration) // ✅ Ensure number is sent
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Schedule saved successfully')
        setScheduleDialogOpen(false)
        fetchAffiliations()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch (e) {
      toast.error('Network error saving schedule')
    } finally {
      setSaving(false)
    }
  }

  // --- Render ---

  if (affiliationsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (approvedAffiliations.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card className="text-center py-12 border-dashed shadow-sm">
          <CardContent>
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-slate-900">No Active Clinics</h2>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              You need to be affiliated with a hospital to manage your schedule.
            </p>
            <Button onClick={() => window.location.href = '/doctor/affiliations'}>
              Find Hospitals
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Schedule Management</h1>
        <p className="text-slate-500 mt-2 text-lg">Set your weekly hours and manage holiday exceptions.</p>
      </div>

      <Alert className="bg-blue-50 border-blue-100 text-blue-800">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          Tip: Setting a schedule enables patients to book appointments online automatically.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {approvedAffiliations.map(aff => (
          <HospitalScheduleCard 
            key={aff._id} 
            affiliation={aff} 
            onManageSchedule={() => openScheduleEditor(aff)} 
          />
        ))}
      </div>

      {/* Main Schedule Editor Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="w-[95vw] max-w-5xl h-[90vh] md:h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
          <DialogHeader className="p-4 sm:p-6 pb-4 border-b bg-white shrink-0">
             <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl">
                    {activeAffiliation?.hospitalId?.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1">Manage availability</DialogDescription>
                </div>
                
                {/* Slot Duration Selector */}
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                   <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                     Per Patient
                   </Label>
                   <Select 
                     value={slotDuration.toString()} // ✅ Force string match
                     onValueChange={(val) => setSlotDuration(parseInt(val))} // ✅ Parse number for state
                   >
                     <SelectTrigger className="w-[110px] h-8 bg-white text-xs font-medium border-slate-200">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="10">10 mins</SelectItem>
                       <SelectItem value="15">15 mins</SelectItem>
                       <SelectItem value="20">20 mins</SelectItem>
                       <SelectItem value="30">30 mins</SelectItem>
                       <SelectItem value="45">45 mins</SelectItem>
                       <SelectItem value="60">60 mins</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
             </div>
          </DialogHeader>

          {loadingSchedule ? (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
              <Tabs defaultValue="weekly" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 sm:px-6 bg-white border-b shrink-0">
                  <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4 h-9">
                    <TabsTrigger value="weekly" className="text-xs">Weekly Schedule</TabsTrigger>
                    <TabsTrigger value="exceptions" className="text-xs">
                      Exceptions {exceptions.length > 0 && `(${exceptions.length})`}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Weekly Content */}
                <TabsContent value="weekly" className="flex-1 overflow-y-auto p-4 sm:p-6 m-0">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {DAYS.map(day => {
                      const dayData = dayMap.get(day)
                      const hasSlots = dayData.slots.length > 0
                      
                      return (
                        <Card key={day} className={`flex flex-col h-full border transition-all ${hasSlots ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50/50 opacity-80 hover:opacity-100'}`}>
                          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between space-y-0 bg-white rounded-t-lg">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${hasSlots ? 'text-primary' : 'text-slate-400'}`}>{day}</span>
                              {hasSlots && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-slate-400 hover:text-primary hover:bg-primary/5" 
                              onClick={() => {
                                setActiveDay(day)
                                setSlotDialogOpen(true)
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent className="flex-1 p-2 space-y-2 min-h-[100px]">
                            {!hasSlots ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-4 gap-2">
                                <CalendarX className="h-6 w-6 opacity-20" />
                                <span className="text-xs font-medium">Off Day</span>
                              </div>
                            ) : (
                              dayData.slots.map((slot, idx) => (
                                <SlotRow 
                                  key={idx} 
                                  slot={slot} 
                                  onRemove={() => handleRemoveSlot(day, idx)} 
                                />
                              ))
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>

                {/* Exceptions Content */}
                <TabsContent value="exceptions" className="flex-1 overflow-y-auto p-4 sm:p-6 m-0">
                   <div className="max-w-3xl mx-auto space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-blue-900">Date Overrides</h4>
                          <p className="text-xs text-blue-700">Add holidays or special working hours for specific dates.</p>
                        </div>
                        <Button onClick={() => setExceptionDialogOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" /> Add Override
                        </Button>
                      </div>

                      {exceptions.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-white">
                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="h-6 w-6 text-slate-300" />
                          </div>
                          <h3 className="text-sm font-medium text-slate-900">No Exceptions</h3>
                          <p className="text-xs text-slate-500 mt-1">Your schedule follows the weekly plan strictly.</p>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {exceptions.map((ex, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm hover:border-slate-300 transition-all">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ex.unavailable ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {ex.unavailable ? <CalendarX className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 text-sm">
                                    {new Date(ex.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant={ex.unavailable ? "destructive" : "secondary"} className="text-[10px] h-4 px-1">
                                      {ex.unavailable ? 'Closed' : 'Custom Hours'}
                                    </Badge>
                                    <span className="text-xs text-slate-500 truncate max-w-[200px]">
                                      {ex.reason || 'No reason specified'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveException(ex.date)}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <div className="p-4 sm:p-6 border-t bg-white shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 z-10">
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto min-w-[140px]">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Slot Dialog */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent className="w-[90vw] max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Add Slot - {activeDay}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Start Time</Label>
                <Input 
                  type="time" 
                  value={newSlot.start} 
                  onChange={e => setNewSlot({...newSlot, start: e.target.value})} 
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">End Time</Label>
                <Input 
                  type="time" 
                  value={newSlot.end} 
                  onChange={e => setNewSlot({...newSlot, end: e.target.value})} 
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Room Number (Optional)</Label>
              <Input 
                value={newSlot.room} 
                onChange={e => setNewSlot({...newSlot, room: e.target.value})} 
                placeholder="e.g. 104"
              />
            </div>
            <Button onClick={handleAddSlot} className="w-full mt-2">Add Slot</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Exception Dialog */}
      <Dialog open={exceptionDialogOpen} onOpenChange={setExceptionDialogOpen}>
        <DialogContent className="w-[90vw] max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Add Exception</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Select Date</Label>
              <Input 
                type="date" 
                value={newException.date} 
                onChange={e => setNewException({...newException, date: e.target.value})} 
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <div className="space-y-0.5">
                <Label className="text-sm">Mark Unavailable</Label>
                <p className="text-[10px] text-slate-500">Close clinic for this day</p>
              </div>
              <Switch 
                checked={newException.unavailable} 
                onCheckedChange={c => setNewException({...newException, unavailable: c})} 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Reason / Note</Label>
              <Input 
                value={newException.reason} 
                onChange={e => setNewException({...newException, reason: e.target.value})} 
                placeholder="e.g. Public Holiday"
              />
            </div>
            <Button onClick={handleAddException} className="w-full">Save Exception</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
