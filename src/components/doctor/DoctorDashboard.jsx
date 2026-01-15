'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, Calendar, Clock, 
  MapPin, ChevronRight, Activity, 
  Play, Pause, Coffee, AlertCircle, CheckCircle,
  Stethoscope, User, LogOut, Briefcase, ChevronDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'
import { useDoctor } from '@/context/DoctorContextProvider'
import { useRealtimeQueue } from '@/hooks/useRealtimeQueue'

export default function DoctorDashboard() {
  const {
    doctor,
    doctorLoading,
    appointments,
    fetchDoctorDashboard,
    fetchAppointments,
    setDoctorStatus, 
    performQueueAction 
  } = useDoctor()

  // STATE: Active Hospital Selection
  const [selectedHospitalId, setSelectedHospitalId] = useState(null)

  // 1. Smart Hospital Selection
  useEffect(() => {
    if (!selectedHospitalId && appointments?.length > 0) {
      const todayHospital = appointments[0].hospitalId?._id || appointments[0].hospitalId;
      if (todayHospital) setSelectedHospitalId(todayHospital);
    } else if (!selectedHospitalId && doctor?.affiliations?.length > 0) {
       const primary = doctor.affiliations.find(a => a.status === 'APPROVED')
       if (primary) setSelectedHospitalId(primary.hospitalId?._id || primary.hospitalId)
    }
  }, [appointments, doctor, selectedHospitalId])

  // Realtime Hook
  const { currentToken, isLive, status: queueStatus } = useRealtimeQueue(doctor?._id, selectedHospitalId)

  // Auto-Initialize Queue
  useEffect(() => {
    const initQueue = async () => {
      if (doctor?._id && selectedHospitalId && queueStatus === 'NOT_STARTED') {
        console.log('⚡ Auto-initializing Queue...');
        await setDoctorStatus('OPD', 'Auto-Start', selectedHospitalId);
      }
    }
    const timer = setTimeout(initQueue, 1500);
    return () => clearTimeout(timer);
  }, [doctor?._id, selectedHospitalId, queueStatus, setDoctorStatus]);

  useEffect(() => {
    if (doctor?._id) {
      fetchDoctorDashboard()
      fetchAppointments('today')
    }
  }, [doctor?._id, fetchDoctorDashboard, fetchAppointments])

  if (doctorLoading) return <DashboardSkeleton />

  // Filter appointments
  const hospitalAppointments = (appointments || []).filter(apt => {
     const hId = apt.hospitalId?._id || apt.hospitalId;
     return hId === selectedHospitalId;
  })
  
  const ongoingPatient = hospitalAppointments.find(apt => apt.status === 'IN_CONSULTATION')
  const nextPatient = hospitalAppointments
    .filter(apt => apt.status === 'CHECKED_IN')
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0))[0]

  // --- HELPER TO FIX MISSING NAME ---
  const getPatientName = (apt) => {
      if (!apt.patientId) return 'Unknown Patient';
      if (apt.patientId.firstName) {
          return `${apt.patientId.firstName} ${apt.patientId.lastName || ''}`.trim();
      }
      if (typeof apt.patientId === 'string') return `Patient #${apt.patientId.slice(-4)}`;
      return 'Unknown Patient';
  }

  // Handlers
  const handleStatusChange = async (newStatus) => {
    if (!selectedHospitalId) return;
    let message = ''
    if (newStatus === 'REST') message = 'Lunch Break'
    if (newStatus === 'MEETING') message = 'In Meeting'
    if (newStatus === 'EMERGENCY') message = 'Emergency Case'
    await setDoctorStatus(newStatus, message, selectedHospitalId)
  }

  const handleEndDay = async () => {
    if (!selectedHospitalId) return;
    if (confirm('Are you sure you want to end today\'s consultation? This will clear the queue.')) {
       await setDoctorStatus('REST', 'Consultation Ended', selectedHospitalId)
    }
  }

  const handleNextPatient = async () => {
     if (nextPatient) await performQueueAction('START', nextPatient._id)
  }

  const handleCompleteVisit = async () => {
     if (ongoingPatient) await performQueueAction('COMPLETE', ongoingPatient._id)
  }

  const currentHospitalName = appointments?.find(a => (a.hospitalId?._id || a.hospitalId) === selectedHospitalId)?.hospitalId?.name 
                              || doctor?.affiliations?.find(a => (a.hospitalId?._id || a.hospitalId) === selectedHospitalId)?.hospitalId?.name 
                              || 'Select Clinic';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans">
      
      {/* HEADER */}
      {/* FIX: Removed 'overflow-hidden' from parent so the negative-bottom card isn't clipped */}
      <div className="bg-blue-600 pt-6 pb-20 px-4 rounded-b-[2.5rem] shadow-xl relative">
        
        {/* Background Decorations - Wrapped in their own overflow-hidden container */}
        <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] pointer-events-none">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        </div>
        
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8 relative z-10">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl pl-3 pr-4 h-12 max-w-[200px]">
                   <div className="flex flex-col items-start mr-2 overflow-hidden text-left">
                      <span className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">Current Clinic</span>
                      <span className="text-sm font-bold truncate w-full leading-tight">
                        {currentHospitalName}
                      </span>
                   </div>
                   <ChevronDown className="w-4 h-4 opacity-70 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Switch Clinic</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {doctor?.affiliations?.filter(a => a.status === 'APPROVED').map(aff => (
                   <DropdownMenuItem 
                      key={aff._id} 
                      onClick={() => setSelectedHospitalId(aff.hospitalId?._id || aff.hospitalId)}
                      className="flex items-center gap-2 cursor-pointer"
                   >
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="flex-1 truncate">{aff.hospitalId?.name || 'Unknown Clinic'}</span>
                      {selectedHospitalId === (aff.hospitalId?._id || aff.hospitalId) && <CheckCircle className="w-4 h-4 text-green-600" />}
                   </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
           </DropdownMenu>

           <Link href="/doctor/profile" className="h-12 w-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold text-lg hover:bg-white/20 transition">
              {doctor?.firstName?.[0]}
           </Link>
        </div>

        {/* Welcome Text */}
        <div className="text-white relative z-10 mb-4 px-1">
           <h1 className="text-3xl font-bold">Hello, Dr. {doctor?.lastName}</h1>
           <p className="text-blue-100 opacity-90 text-sm">
             Ready? You have <span className="font-bold text-white">{hospitalAppointments.length}</span> appointments today.
           </p>
        </div>

        {/* FLOATING CARD - Now visible because parent is not overflow-hidden */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xl flex items-center justify-between absolute left-4 right-4 -bottom-14 z-20 border border-slate-100">
          
          <div className="flex-1">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              Now Serving
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">
                 {currentToken > 0 ? `#${currentToken}` : '--'}
              </span>
              <span className="text-slate-400 text-sm font-medium">
                / {hospitalAppointments.length}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
             <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                       variant={queueStatus === 'OPD' ? 'default' : 'outline'} 
                       className={`h-9 px-3 text-xs font-semibold gap-2 ${
                          queueStatus === 'OPD' 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'border-orange-200 text-orange-600 bg-orange-50'
                       }`}
                    >
                       {queueStatus === 'OPD' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                       {queueStatus === 'OPD' ? 'Live (OPD)' : (queueStatus === 'NOT_STARTED' ? 'Offline' : queueStatus)}
                       <ChevronDown className="w-3 h-3 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Set Availability</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleStatusChange('OPD')} className="gap-2 cursor-pointer">
                       <Play className="w-4 h-4 text-green-600" /> Start / Resume OPD
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('REST')} className="gap-2 cursor-pointer">
                       <Coffee className="w-4 h-4 text-orange-500" /> Take Break
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('MEETING')} className="gap-2 cursor-pointer">
                       <Briefcase className="w-4 h-4 text-blue-500" /> In Meeting
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('EMERGENCY')} className="gap-2 cursor-pointer">
                       <AlertCircle className="w-4 h-4 text-red-500" /> Emergency
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleEndDay} className="gap-2 cursor-pointer text-red-600 focus:text-red-700 bg-red-50 focus:bg-red-100">
                       <LogOut className="w-4 h-4" /> End Consultation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-20 space-y-6">

        {/* CRITICAL ACTION CARD */}
        {ongoingPatient ? (
           <Card className="border-l-4 border-l-blue-500 shadow-lg overflow-hidden ring-1 ring-slate-100">
             <CardContent className="p-0">
               <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex justify-between items-start">
                  <div>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 mb-2 border-0 shadow-none">In Consultation</Badge>
                    <h3 className="text-xl font-bold text-slate-900">{getPatientName(ongoingPatient)}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                       <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ongoingPatient.patientId?.gender || 'N/A'}</span>
                       <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Token #{ongoingPatient.tokenNumber}</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-lg border-2 border-blue-100 shadow-sm">
                    {ongoingPatient.patientId?.firstName?.[0] || 'P'}
                  </div>
               </div>
               <div className="p-4">
                 <Button onClick={handleCompleteVisit} className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 py-6 text-base transition-transform active:scale-[0.98]">
                   Complete Visit <CheckCircle className="w-5 h-5 ml-2" />
                 </Button>
               </div>
             </CardContent>
           </Card>
        ) : nextPatient ? (
           <Card className="border-l-4 border-l-green-500 shadow-lg overflow-hidden ring-1 ring-slate-100">
             <CardContent className="p-0">
               <div className="bg-green-50/50 p-4 border-b border-green-100 flex justify-between items-start">
                  <div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 mb-2 border-0 shadow-none">Next in Queue</Badge>
                    <h3 className="text-xl font-bold text-slate-900">{getPatientName(nextPatient)}</h3>
                    <p className="text-slate-500 text-sm mt-1">Token #{nextPatient.tokenNumber}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-green-600 font-bold text-lg border-2 border-green-100 shadow-sm">
                    #{nextPatient.tokenNumber}
                  </div>
               </div>
               <div className="p-4">
                 <Button onClick={handleNextPatient} className="w-full bg-slate-900 text-white hover:bg-slate-800 py-6 text-base shadow-xl shadow-slate-200 transition-transform active:scale-[0.98]">
                   Call Patient <Play className="w-5 h-5 ml-2" />
                 </Button>
               </div>
             </CardContent>
           </Card>
        ) : (
           <Card className="bg-slate-50 border-dashed border-2 border-slate-200 shadow-none">
             <CardContent className="p-8 text-center text-slate-400">
               <Coffee className="w-6 h-6 text-slate-300 mx-auto mb-3" />
               <p className="font-medium">No patients waiting.</p>
               <p className="text-xs mt-1">{hospitalAppointments.length > 0 ? "You've seen everyone!" : "No appointments yet."}</p>
             </CardContent>
           </Card>
        )}

        {/* UPCOMING LIST */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-bold text-slate-700 text-lg">Upcoming</h3>
            <Link href="/doctor/appointments" className="text-blue-600 text-sm font-semibold flex items-center">View All <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="space-y-3 pb-6">
            {hospitalAppointments.filter(apt => ['BOOKED', 'CHECKED_IN'].includes(apt.status)).sort((a,b) => (a.tokenNumber || 0) - (b.tokenNumber || 0)).slice(0, 3).map(apt => (
              <div key={apt._id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                 <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${apt.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>#{apt.tokenNumber || '?'}</div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-semibold text-slate-900 text-sm truncate">{getPatientName(apt)}</h4>
                   <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {new Date(apt.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} <span className="mx-1">•</span> {apt.type || 'Regular'}</p>
                 </div>
                 <Badge variant="outline" className="text-[10px] h-5 border-slate-200 text-slate-500">{apt.status === 'CHECKED_IN' ? 'Checked In' : 'Booked'}</Badge>
              </div>
            ))}
            {hospitalAppointments.filter(apt => ['BOOKED', 'CHECKED_IN'].includes(apt.status)).length === 0 && (
               <p className="text-center text-slate-400 text-sm py-4 bg-slate-50 rounded-xl">Queue is empty</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
      <div className={`p-2.5 rounded-full ${bg} mb-2`}><Icon className={`w-5 h-5 ${color}`} /></div>
      <span className="text-3xl font-bold text-slate-900">{value}</span>
      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</span>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen">
      <Skeleton className="h-48 w-full rounded-b-3xl" />
      <div className="mt-8 space-y-4">
         <Skeleton className="h-40 w-full rounded-xl" />
         <div className="grid grid-cols-2 gap-4">
           <Skeleton className="h-28 rounded-xl" />
           <Skeleton className="h-28 rounded-xl" />
         </div>
      </div>
    </div>
  )
}
