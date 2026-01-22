'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useDoctor } from '@/context/DoctorContextProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Calendar, CalendarClock, CalendarX, ChevronRight, Clock, Loader2, MapPin, Plus, Save, Trash2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// --- Helper Functions ---
const toMinutes = (time) => {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Function to check for overlapping schedules across hospitals
function checkCrossHospitalOverlap(currentAffiliationId, allAffiliations, newWeeklySchedule) {
  if (!allAffiliations || allAffiliations.length === 0) return [];
  
  const conflicts = [];
  const currentDayMap = {};
  
  // Build a map of the proposed schedule for the current hospital
  if (newWeeklySchedule && Array.isArray(newWeeklySchedule)) {
    newWeeklySchedule.forEach(daySchedule => {
      if (daySchedule.slots && Array.isArray(daySchedule.slots)) {
        currentDayMap[daySchedule.day] = daySchedule.slots;
      }
    });
  }
  
  // Check against all other approved affiliations
  allAffiliations.forEach(affiliation => {
    if (affiliation._id === currentAffiliationId || affiliation.status !== 'APPROVED') return;
    
    const otherSchedule = affiliation.weeklySchedule || [];
    
    // Check each day for potential conflicts
    otherSchedule.forEach(otherDaySchedule => {
      const day = otherDaySchedule.day;
      const otherSlots = otherDaySchedule.slots || [];
      
      // If the current hospital has slots on this day, check for overlaps
      if (currentDayMap[day] && currentDayMap[day].length > 0) {
        // Check each slot in the current proposed schedule against other hospital's slots
        currentDayMap[day].forEach(currentSlot => {
          otherSlots.forEach(otherSlot => {
            // Check if time ranges overlap
            const currentStart = toMinutes(currentSlot.start);
            const currentEnd = toMinutes(currentSlot.end);
            const otherStart = toMinutes(otherSlot.start);
            const otherEnd = toMinutes(otherSlot.end);
            
            // Two time ranges overlap if: (start1 < end2) AND (start2 < end1)
            if (currentStart < otherEnd && otherStart < currentEnd) {
              conflicts.push({
                day,
                currentSlot,
                otherSlot,
                otherHospital: affiliation.hospitalId?.name || 'Unknown Hospital',
                currentHospital: affiliation.hospitalId?.name || 'Current Hospital'
              });
            }
          });
        });
      }
    });
  });
  
  return conflicts;
}

// Function to validate the entire schedule against other hospitals
function validateCrossHospitalConflicts() {
  if (!activeAffiliation || !affiliations) return [];
  
  return checkCrossHospitalOverlap(activeAffiliation._id, affiliations, weekly);
}

// --- Components ---

function HospitalScheduleRow({ affiliation, onManageSchedule }) {
  const hospital = affiliation.hospitalId
  const hasSchedule = affiliation.weeklySchedule?.some(day => day.slots?.length > 0)

  return (
    <div 
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-blue-200 bg-background hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer" 
      onClick={onManageSchedule}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-lg overflow-hidden border border-blue-100 bg-blue-50">
           {hospital?.images?.[0] ? (
              <Image 
                src={hospital.images[0]} 
                alt={hospital.name} 
                fill 
                className="object-cover" 
              />
           ) : (
              <div className="h-full w-full flex items-center justify-center text-blue-400">
                 <Building2 className="h-6 w-6" />
              </div>
           )}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
           <div className="flex items-center gap-2">
              <h3 className="font-bold text-blue-900 truncate text-base sm:text-lg group-hover:text-blue-700 transition-colors">
                 {hospital?.name || 'Unknown Hospital'}
              </h3>
              <Badge variant={hasSchedule ? "default" : "secondary"} className={`h-5 text-[10px] px-1.5 ${hasSchedule ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-blue-100 text-blue-600'}`}>
                 {hasSchedule ? 'Active' : 'Setup Required'}
              </Badge>
           </div>
           {hospital?.address?.city && (
              <p className="text-sm text-blue-600 flex items-center gap-1.5 truncate">
                 <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                 {hospital.address.city}, {hospital.address.state}
              </p>
           )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 pl-16 sm:pl-0">
         {hasSchedule ? (
            <div className="hidden sm:flex flex-col items-end text-xs text-blue-600 mr-2">
               <span className="font-medium text-blue-700">Weekly Schedule</span>
               <span>{affiliation.weeklySchedule?.length || 0} days configured</span>
            </div>
         ) : (
            <span className="hidden sm:block text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded-md">
               No slots added
            </span>
         )}
         <Button variant="ghost" size="icon" className="text-blue-300 group-hover:text-blue-600">
            <ChevronRight className="h-5 w-5" />
         </Button>
      </div>
    </div>
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

  // --- Handlers (Unchanged functionality) ---
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
    if (startMins >= endMins) return 'Start time must be before end time'
    
    const existingSlots = dayMap.get(day)?.slots || []
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
    
    // Check for cross-hospital overlaps
    if (activeAffiliation && affiliations) {
      const tempWeekly = [...weekly];
      const dayIndex = tempWeekly.findIndex(d => d.day === day);
      const tempSlot = {...slot};
      
      if (dayIndex >= 0) {
        // Add the new slot temporarily to the day's schedule
        const updatedSlots = [...tempWeekly[dayIndex].slots, tempSlot];
        tempWeekly[dayIndex] = { ...tempWeekly[dayIndex], slots: updatedSlots };
      } else {
        // Create a new day entry if it doesn't exist
        tempWeekly.push({ day, slots: [tempSlot] });
      }
      
      const conflicts = checkCrossHospitalOverlap(activeAffiliation._id, affiliations, tempWeekly);
      if (conflicts.length > 0) {
        return `Time conflicts with schedule at ${conflicts[0].otherHospital} on ${conflicts[0].day} (${conflicts[0].otherSlot.start}-${conflicts[0].otherSlot.end})`;
      }
    }
    
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
    
    // Check for cross-hospital conflicts before saving
    const conflicts = validateCrossHospitalConflicts();
    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      toast.error(`Schedule conflicts with ${conflict.otherHospital} on ${conflict.day} (${conflict.otherSlot.start}-${conflict.otherSlot.end}). Please adjust your schedule.`);
      return;
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/doctor/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliationId: activeAffiliation._id,
          weekly,
          exceptions,
          slotDuration: parseInt(slotDuration)
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
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (approvedAffiliations.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-10">
        <Card className="text-center py-12 border-dashed border-blue-200 bg-blue-50 shadow-sm">
          <CardContent>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-blue-900">No Active Clinics Found</h2>
            <p className="text-blue-600 mb-6 max-w-sm mx-auto">
              You need to be affiliated with a hospital to manage your schedule.
            </p>
            <Button onClick={() => window.location.href = '/doctor/affiliations'} className="bg-blue-600 hover:bg-blue-700">
              Find Hospitals
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">Schedule Management</h1>
          <p className="text-blue-600 mt-1">Configure weekly hours and slot durations for your clinics.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
           <AlertCircle className="h-4 w-4" />
           <span>Syncs automatically with patient booking</span>
        </div>
      </div>

      {/* Hospital List */}
      <div className="space-y-4">
        {approvedAffiliations.map(aff => (
          <HospitalScheduleRow 
            key={aff._id} 
            affiliation={aff} 
            onManageSchedule={() => openScheduleEditor(aff)} 
          />
        ))}
      </div>

      {/* Main Schedule Editor Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl">
          <DialogHeader className="p-5 border-b bg-background shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100 text-blue-600">
                      <CalendarClock className="h-5 w-5" />
                   </div>
                   <div>
                      <DialogTitle className="text-lg font-bold text-slate-900">
                        {activeAffiliation?.hospitalId?.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs mt-0.5">Edit availability & exceptions</DialogDescription>
                   </div>
                </div>
                
                {/* Slot Duration Selector */}
                <div className="flex items-center gap-3 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 self-start sm:self-auto">
                    <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Slot Time
                    </Label>
                    <Select 
                      value={slotDuration.toString()} 
                      onValueChange={(val) => setSlotDuration(parseInt(val))}
                    >
                      <SelectTrigger className="w-[90px] h-7 bg-background text-xs font-semibold border-blue-200 shadow-sm focus:ring-0 focus:ring-blue-500 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 min</SelectItem>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="20">20 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
             </div>
          </DialogHeader>

          {loadingSchedule ? (
            <div className="flex-1 flex items-center justify-center bg-muted">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500/50" />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col bg-muted/30">
              <Tabs defaultValue="weekly" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-4 shrink-0">
                  <TabsList className="bg-background border border-slate-200 p-1 h-auto rounded-lg inline-flex shadow-sm">
                    <TabsTrigger value="weekly" className="text-xs px-4 py-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md">Weekly Schedule</TabsTrigger>
                    <TabsTrigger value="exceptions" className="text-xs px-4 py-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md">
                      Exceptions {exceptions.length > 0 && <span className="ml-1.5 bg-blue-200 text-blue-800 px-1.5 rounded-full text-[9px]">{exceptions.length}</span>}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* ✅ Weekly Content - LIST VIEW */}
                <TabsContent value="weekly" className="flex-1 overflow-y-auto p-4 sm:p-6 m-0">
                  <div className="bg-background rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                    {DAYS.map(day => {
                      const dayData = dayMap.get(day)
                      const hasSlots = dayData.slots.length > 0
                      
                      return (
                        <div key={day} className="p-4 flex flex-col sm:flex-row gap-4 sm:items-start group transition-colors hover:bg-accent">
                           {/* Day Column */}
                           <div className="w-16 sm:w-20 pt-1">
                              <span className={`text-sm font-bold block ${hasSlots ? 'text-blue-700' : 'text-slate-400'}`}>{day}</span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                 {hasSlots ? `${dayData.slots.length} Slots` : 'Closed'}
                              </span>
                           </div>

                           {/* Slots Column */}
                           <div className="flex-1 min-w-0">
                              {hasSlots ? (
                                 <div className="flex flex-wrap gap-2">
                                    {dayData.slots.map((slot, idx) => (
                                       <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md pl-3 pr-1 py-1.5 group/slot hover:border-blue-300 hover:bg-blue-100 transition-colors">
                                          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                                             <span>{slot.start}</span>
                                             <span className="text-blue-400">-</span>
                                             <span>{slot.end}</span>
                                          </div>
                                          {slot.room && (
                                             <span className="text-[10px] bg-blue-100 border border-blue-200 px-1 rounded text-blue-600">
                                                {slot.room}
                                             </span>
                                          )}
                                          <button 
                                             onClick={() => handleRemoveSlot(day, idx)}
                                             className="ml-1 p-1 text-blue-400 hover:text-red-600 rounded-full hover:bg-blue-100 transition-all opacity-0 group-hover/slot:opacity-100"
                                          >
                                             <Trash2 className="w-3 h-3" />
                                          </button>
                                       </div>
                                    ))}
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-2 py-1">
                                    <span className="h-px w-8 bg-blue-200"></span>
                                    <span className="text-xs text-blue-400 italic">No availability set</span>
                                 </div>
                              )}
                           </div>

                           {/* Action Column */}
                           <div className="shrink-0 pt-0 sm:pt-0">
                              <Button 
                                 size="sm" 
                                 variant={hasSlots ? "outline" : "default"} 
                                 className={`h-8 text-xs ${hasSlots ? 'text-blue-600 border-blue-300 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                 onClick={() => {
                                    setActiveDay(day)
                                    setSlotDialogOpen(true)
                                 }}
                              >
                                 <Plus className="w-3 h-3 mr-1.5" />
                                 Add Slot
                              </Button>
                           </div>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>

                {/* Exceptions Content (Unchanged) */}
                <TabsContent value="exceptions" className="flex-1 overflow-y-auto p-4 sm:p-6 m-0">
                    <div className="max-w-3xl mx-auto space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex gap-4">
                           <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">
                              <CalendarX className="h-5 w-5" />
                           </div>
                           <div>
                              <h4 className="text-sm font-bold text-slate-900">Date Overrides</h4>
                              <p className="text-xs text-slate-500 mt-0.5">Manage holidays or special working hours for specific dates.</p>
                           </div>
                        </div>
                        <Button onClick={() => setExceptionDialogOpen(true)} size="sm" className="bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" /> Add Exception
                        </Button>
                      </div>

                      {exceptions.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                          <h3 className="text-sm font-bold text-blue-900">No Exceptions Configured</h3>
                          <p className="text-xs text-blue-700 mt-1">Your schedule follows the weekly plan strictly.</p>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {exceptions.map((ex, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-background rounded-lg border border-slate-200 shadow-sm hover:border-blue-200 transition-all">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ex.unavailable ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {ex.unavailable ? <CalendarX className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 text-sm">
                                    {new Date(ex.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant={ex.unavailable ? "destructive" : "secondary"} className="text-[10px] h-4 px-1 rounded-sm">
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

          <div className="p-4 sm:p-5 border-t bg-background shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 z-10">
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto min-w-[140px] bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Slot Dialog (Functionality Unchanged) */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent className="w-[90vw] max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Add Slot - {activeDay}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Start Time</Label>
                <Input type="time" value={newSlot.start} onChange={e => setNewSlot({...newSlot, start: e.target.value})} className="font-mono"/>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">End Time</Label>
                <Input type="time" value={newSlot.end} onChange={e => setNewSlot({...newSlot, end: e.target.value})} className="font-mono"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Room Number (Optional)</Label>
              <Input value={newSlot.room} onChange={e => setNewSlot({...newSlot, room: e.target.value})} placeholder="e.g. 104"/>
            </div>
            <Button onClick={handleAddSlot} className="w-full mt-2 bg-blue-600 hover:bg-blue-700">Add Slot</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Exception Dialog (Functionality Unchanged) */}
      <Dialog open={exceptionDialogOpen} onOpenChange={setExceptionDialogOpen}>
        <DialogContent className="w-[90vw] max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Add Exception</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Select Date</Label>
              <Input type="date" value={newException.date} onChange={e => setNewException({...newException, date: e.target.value})} min={new Date().toISOString().split('T')[0]}/>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent rounded-lg border">
              <div className="space-y-0.5">
                <Label className="text-sm">Mark Unavailable</Label>
                <p className="text-[10px] text-slate-500">Close clinic for this day</p>
              </div>
              <Switch checked={newException.unavailable} onCheckedChange={c => setNewException({...newException, unavailable: c})}/>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Reason / Note</Label>
              <Input value={newException.reason} onChange={e => setNewException({...newException, reason: e.target.value})} placeholder="e.g. Public Holiday"/>
            </div>
            <Button onClick={handleAddException} className="w-full bg-blue-600 hover:bg-blue-700">Save Exception</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
