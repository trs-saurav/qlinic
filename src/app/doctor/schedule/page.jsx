'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDoctor } from '@/context/DoctorContextProvider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function emptyWeekly() {
  return DAYS.map((d) => ({ day: d, slots: [] }))
}

function SlotRow({ slot, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border p-2">
      <div className="text-sm">
        <span className="font-semibold">{slot.start}</span> - <span className="font-semibold">{slot.end}</span>
        {slot.room ? <span className="text-muted-foreground"> • Room {slot.room}</span> : null}
      </div>
      <Button variant="destructive" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </div>
  )
}

export default function DoctorSchedulePage() {
  const { schedule, scheduleLoading, fetchSchedule } = useDoctor()

  const [saving, setSaving] = useState(false)
  const [weekly, setWeekly] = useState([])
  const [exceptions, setExceptions] = useState([])

  // slot editor state
  const [open, setOpen] = useState(false)
  const [activeDay, setActiveDay] = useState('MON')
  const [start, setStart] = useState('10:00')
  const [end, setEnd] = useState('13:00')
  const [room, setRoom] = useState('')

  // exception editor state
  const [excDate, setExcDate] = useState('')
  const [excUnavailable, setExcUnavailable] = useState(false)

  useEffect(() => {
    if (!scheduleLoading) {
      setWeekly(schedule?.weekly?.length ? schedule.weekly : emptyWeekly())
      setExceptions(Array.isArray(schedule?.exceptions) ? schedule.exceptions : [])
    }
  }, [scheduleLoading, schedule])

  const dayMap = useMemo(() => {
    const map = new Map()
    for (const d of weekly) map.set(d.day, d)
    return map
  }, [weekly])

  function addSlot() {
    setWeekly((prev) => {
      const next = prev.map((d) => (d.day === activeDay ? { ...d, slots: [...(d.slots || []), { start, end, room }] } : d))
      return next
    })
    setOpen(false)
    setRoom('')
  }

  function removeSlot(day, index) {
    setWeekly((prev) =>
      prev.map((d) => (d.day === day ? { ...d, slots: (d.slots || []).filter((_, i) => i !== index) } : d))
    )
  }

  function upsertException() {
    if (!excDate) return toast.error('Pick a date (YYYY-MM-DD)')
    setExceptions((prev) => {
      const idx = prev.findIndex((e) => e.date === excDate)
      const nextItem = { date: excDate, unavailable: excUnavailable, slots: [] }
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = nextItem
        return copy
      }
      return [nextItem, ...prev]
    })
    setExcDate('')
    setExcUnavailable(false)
  }

  async function saveAll() {
    setSaving(true)
    try {
      const res = await fetch('/api/doctor/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekly, exceptions }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data?.error || 'Failed to save schedule')
      toast.success('Schedule saved')
      fetchSchedule()
    } catch (e) {
      toast.error('Failed to save schedule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-muted-foreground">Set weekly availability and day-based overrides.</p>
        </div>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly template</TabsTrigger>
          <TabsTrigger value="exceptions">Day overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-4">
          <div className="grid gap-4">
            {DAYS.map((day) => {
              const d = dayMap.get(day) || { day, slots: [] }
              return (
                <Card key={day} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{day}</h3>

                    <Dialog open={open && activeDay === day} onOpenChange={(v) => (setOpen(v), setActiveDay(day))}>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => (setActiveDay(day), setOpen(true))}>
                          Add slot
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add slot ({day})</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-sm font-semibold">Start</label>
                              <Input value={start} onChange={(e) => setStart(e.target.value)} placeholder="HH:mm" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold">End</label>
                              <Input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="HH:mm" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold">Room (optional)</label>
                            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 12B" />
                          </div>

                          <Button className="w-full" onClick={addSlot}>
                            Add
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {(d.slots || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No slots</p>
                  ) : (
                    <div className="space-y-2">
                      {(d.slots || []).map((slot, idx) => (
                        <SlotRow key={`${day}-${idx}`} slot={slot} onRemove={() => removeSlot(day, idx)} />
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="exceptions" className="mt-4">
          <Card className="p-4 space-y-4">
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Date</label>
                <Input value={excDate} onChange={(e) => setExcDate(e.target.value)} placeholder="YYYY-MM-DD" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Unavailable?</label>
                <Input
                  value={excUnavailable ? 'true' : 'false'}
                  onChange={(e) => setExcUnavailable(e.target.value === 'true')}
                  placeholder="true/false"
                />
              </div>
              <Button onClick={upsertException} variant="outline">
                Add / Update day
              </Button>
            </div>

            {(exceptions || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No overrides yet.</p>
            ) : (
              <div className="space-y-2">
                {exceptions.map((e) => (
                  <div key={e.date} className="flex items-center justify-between rounded-lg border p-2">
                    <div className="text-sm">
                      <span className="font-semibold">{e.date}</span>
                      <span className="text-muted-foreground"> • {e.unavailable ? 'Unavailable' : 'Custom'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
