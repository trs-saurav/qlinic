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
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  useEffect(() => {
    fetchAppointments('today')
    setLastRefresh(Date.now())
  }, []) // eslint-disable-line

  // 30-minute fallback refresh effect
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastRefresh = Date.now() - lastRefresh;
      if (timeSinceLastRefresh >= 30 * 60 * 1000) { // 30 minutes
        fetchAppointments('today');
        setLastRefresh(Date.now());
      }
    }, 60 * 1000); // Check every minute
    
    return () => clearInterval(interval);
  }, [lastRefresh, fetchAppointments]);

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

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchAppointments('today');
    setLastRefresh(Date.now());
    setIsRefreshing(false);
  };

  return (
    <div className="h-[calc(100vh-80px)] p-4 bg-background gap-4 grid grid-cols-1 lg:grid-cols-12">
      
      {/* LEFT COLUMN: Queue & History (30% width) */}
      <Card className="lg:col-span-4 xl:col-span-3 flex flex-col h-full border border-slate-200 shadow-sm overflow-hidden bg-card">
        <div className="p-4 border-b bg-background flex justify-between items-center">
           <h2 className="text-lg font-bold flex items-center gap-2 text-blue-900">
             <Clock className="w-5 h-5 text-blue-600" /> Appointments
           </h2>
           <Button 
             variant="outline" 
             size="sm" 
             onClick={handleManualRefresh}
             disabled={appointmentsLoading || isRefreshing}
             className="h-8 w-8 p-0"
           >
             {isRefreshing ? (
               <RefreshCw className="w-4 h-4 animate-spin" />
             ) : (
               <RefreshCw className="w-4 h-4" />
             )}
           </Button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-2">
            <TabsList className="w-full grid grid-cols-2 bg-transparent border border-slate-200 rounded-lg p-1">
              <TabsTrigger value="queue" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none">Queue ({queueList.length})</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none">History</TabsTrigger>
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
