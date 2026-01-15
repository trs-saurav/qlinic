'use client'
import React, { useState, useEffect } from 'react'
import { useDoctor } from '@/context/DoctorContextProvider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DoctorQueueList from '@/components/doctor/DoctorQueueList'
import ActivePatientConsole from '@/components/doctor/ActivePatientConsole'
import AppointmentHistoryList from '@/components/doctor/AppointmentHistoryList'
import { Card } from '@/components/ui/card'
import { Activity, Clock } from 'lucide-react'

export default function DoctorAppointmentsPage() {
  const { appointments, fetchAppointments, updateAppointmentStatus, appointmentsLoading } = useDoctor()
  const [activeTab, setActiveTab] = useState('queue')
  const [currentPatient, setCurrentPatient] = useState(null)

  useEffect(() => {
    fetchAppointments('today')
  }, []) // eslint-disable-line

  // Sync active patient from appointments list
  useEffect(() => {
    const active = appointments.find(a => a.status === 'IN_CONSULTATION')
    setCurrentPatient(active || null)
  }, [appointments])

  // Computed Lists
  const queueList = appointments
    .filter(a => ['CHECKED_IN', 'IN_CONSULTATION'].includes(a.status))
    .sort((a, b) => {
      if (a.status === 'IN_CONSULTATION') return -1
      if (b.status === 'IN_CONSULTATION') return 1
      return (a.tokenNumber || 999) - (b.tokenNumber || 999)
    })

  const historyList = appointments
    .filter(a => ['COMPLETED', 'CANCELLED', 'SKIPPED'].includes(a.status))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  return (
    <div className="h-[calc(100vh-80px)] p-4 bg-slate-50 gap-4 grid grid-cols-1 lg:grid-cols-12">
      
      {/* LEFT COLUMN: Queue & History (30% width) */}
      <Card className="lg:col-span-4 xl:col-span-3 flex flex-col h-full border-0 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-white">
           <h2 className="text-lg font-bold flex items-center gap-2">
             <Clock className="w-5 h-5 text-blue-600" /> Appointments
           </h2>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-2">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="queue">Queue ({queueList.length})</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="queue" className="flex-1 overflow-y-auto p-2">
             <DoctorQueueList 
                queue={queueList} 
                currentPatientId={currentPatient?._id}
                onSkip={(id) => updateAppointmentStatus(id, 'SKIPPED')}
             />
          </TabsContent>
          
          <TabsContent value="history" className="flex-1 overflow-y-auto p-2">
             <AppointmentHistoryList history={historyList} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* RIGHT COLUMN: Active Patient Console (70% width) */}
      <div className="lg:col-span-8 xl:col-span-9 h-full">
         <ActivePatientConsole 
            currentPatient={currentPatient}
            // ✅ FIX: Added check for currentPatient before accessing _id
            onComplete={(data) => {
               if (currentPatient) {
                  updateAppointmentStatus(currentPatient._id, 'COMPLETED', data)
               }
            }}
            onNextPatient={async () => {
               const next = queueList.find(a => a.status === 'CHECKED_IN')
               if (next) await updateAppointmentStatus(next._id, 'IN_CONSULTATION')
            }}
            hasWaitingPatients={queueList.some(a => a.status === 'CHECKED_IN')}
         />
      </div>

    </div>
  )
}
