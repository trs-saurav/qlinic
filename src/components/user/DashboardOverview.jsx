'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, Users, FileText, ChevronRight, Stethoscope, 
  MapPin, Clock, Search, Activity, Pause, AlertCircle, Coffee
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ref, onValue, off } from 'firebase/database'
import { realtimeDb } from '@/config/firebase'

export default function DashboardOverview() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({ upcoming: [], activeAppointment: null })
  
  const [queueState, setQueueState] = useState({
    currentToken: 0, isLive: false, status: 'OFFLINE'
  })

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })

  // ✅ Wait for session before fetching
  useEffect(() => { 
    if (status === 'authenticated') {
      fetchDashboardData()
    } else if (status === 'unauthenticated') {
      router.push('/sign-in?role=user')
    }
  }, [status])

  useEffect(() => {
    if (!data.activeAppointment) return
    const { doctorId, hospitalId } = data.activeAppointment
    const dId = doctorId?._id || doctorId
    const hId = hospitalId?._id || hospitalId
    if (!dId || !hId) return

    const queueRef = ref(realtimeDb, `queues/${hId}/${dId}`)
    const unsubscribe = onValue(queueRef, (snapshot) => {
        const val = snapshot.val()
        if (val) setQueueState({
            currentToken: val.currentToken || 0,
            isLive: val.isLive || false,
            status: val.status || 'OFFLINE'
        })
    })
    return () => off(queueRef)
  }, [data.activeAppointment])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const appointmentsRes = await fetch('/api/patient/appointments', {
        credentials: 'include', // ✅ Ensure cookies are sent
      })
      
      if (!appointmentsRes.ok) {
        if (appointmentsRes.status === 401) {
          router.push('/sign-in?role=user')
          return
        }
        throw new Error('Failed to fetch appointments')
      }
      
      const aptData = await appointmentsRes.json()
      
      if (aptData.appointments) {
        const now = new Date()
        const upcoming = aptData.appointments.filter(a => 
          new Date(a.scheduledTime) > now && !['COMPLETED', 'CANCELLED'].includes(a.status)
        ).sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))

        const active = aptData.appointments.find(a => {
            const aptDate = new Date(a.scheduledTime).toDateString()
            return aptDate === now.toDateString() && ['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'SKIPPED'].includes(a.status)
        })
        
        setData({ upcoming, activeAppointment: active })
      }
    } catch (error) { 
      console.error('Error fetching dashboard data:', error)
      setError(error.message)
    } finally { 
      setIsLoading(false) 
    }
  }

  const handleNavigate = (path) => router.push(`/user/${path}`) 

  const getStatusDisplay = (status) => {
      switch(status) {
          case 'OPD': return { label: 'Live', color: 'bg-green-500', icon: Activity, pulse: true };
          case 'REST': return { label: 'Break', color: 'bg-orange-500', icon: Coffee, pulse: false };
          case 'MEETING': return { label: 'Busy', color: 'bg-blue-500', icon: Pause, pulse: false };
          case 'EMERGENCY': return { label: 'Urgent', color: 'bg-red-500', icon: AlertCircle, pulse: true };
          default: return { label: 'Offline', color: 'bg-slate-400', icon:  Pause, pulse: false };
      }
  }

  // ✅ Show loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // ✅ Show error state
  if (error) {
    return (
      <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-sm text-slate-600">{error}</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    )
  }

  const myToken = data.activeAppointment?.tokenNumber || 0
  const currentToken = queueState.currentToken || 0
  const tokensAhead = Math.max(0, myToken - currentToken - 1)
  const estWaitTime = tokensAhead * 10 
  const progressVal = myToken > 0 ? Math.min(100, (currentToken / myToken) * 100) : 0
  const statusMeta = getStatusDisplay(queueState.status)

  return (
    <div className="space-y-6 pb-20 p-4 font-sans text-slate-900 w-full max-w-3xl mx-auto">
      
      {/* 1. Header */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{formattedDate}</p>
      </div>

      {/* 2. Live Widget */}
      {data.activeAppointment ? (
        <Card className="border-0 shadow-lg bg-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mt-12 -mr-12"></div>
            
            <CardContent className="p-5 relative z-10">
                <div className="flex justify-between items-start mb-5">
                    <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.color} ${statusMeta.pulse ? 'animate-pulse' : ''}`}></span>
                            <span className="text-xs font-bold uppercase opacity-90">{statusMeta.label}</span>
                        </div>
                        <h3 className="font-bold text-lg md:text-xl truncate">Dr. {data.activeAppointment.doctorId?.firstName} {data.activeAppointment.doctorId?.lastName}</h3>
                        <p className="text-xs md:text-sm text-blue-100 truncate opacity-80">{data.activeAppointment.hospitalId?.name}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-center min-w-[70px]">
                        <p className="text-[10px] uppercase font-bold opacity-70">Token</p>
                        <p className="text-2xl md:text-3xl font-bold leading-none">#{myToken}</p>
                    </div>
                </div>

                <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between mb-4 text-sm gap-2">
                    <div className="text-center flex-1 border-r border-white/10 last:border-0">
                        <p className="text-[10px] text-blue-200 uppercase mb-0.5">Serving</p>
                        <p className="font-bold text-lg">#{currentToken || '--'}</p>
                    </div>
                    <div className="text-center flex-1 border-r border-white/10 last:border-0">
                        <p className="text-[10px] text-blue-200 uppercase mb-0.5">Ahead</p>
                        <p className="font-bold text-lg">{tokensAhead}</p>
                    </div>
                    <div className="text-center flex-1 last:border-0">
                        <p className="text-[10px] text-blue-200 uppercase mb-0.5">Wait</p>
                        <p className="font-bold text-lg">{estWaitTime}m</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                     <Progress value={progressVal} className="h-2 flex-1 bg-black/20" indicatorClassName="bg-white" />
                     <span className="text-[10px] font-bold w-8 text-right">{Math.round(progressVal)}%</span>
                </div>
            </CardContent>
        </Card>
      ) : (
        <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center justify-between shadow-lg">
            <div>
                <p className="text-lg font-bold">Find a Specialist</p>
                <p className="text-sm text-slate-400 mb-3">Book appointments easily.</p>
                <Button size="sm" variant="secondary" className="px-4" onClick={() => handleNavigate('search')}>Search Doctors</Button>
            </div>
            <Stethoscope className="w-12 h-12 text-slate-700 opacity-50" />
        </div>
      )}

      {/* 3. Icon Grid */}
      <div className="grid grid-cols-4 gap-3 md:gap-4">
        {[
            { label: 'Book', icon: Calendar, action: 'search', bg: 'bg-blue-50', text: 'text-blue-600' },
            { label: 'Family', icon: Users, action: 'settings/family', bg: 'bg-indigo-50', text: 'text-indigo-600' },
            { label: 'Records', icon: FileText, action: 'settings/records', bg: 'bg-violet-50', text: 'text-violet-600' },
            { label: 'Search', icon: Search, action: 'search', bg: 'bg-slate-100', text: 'text-slate-600' },
        ].map((item, idx) => (
            <button key={idx} onClick={() => handleNavigate(item.action)} className="flex flex-col items-center p-3 rounded-xl hover:bg-slate-50 transition-colors w-full">
                <div className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl ${item.bg} ${item.text} flex items-center justify-center mb-2 shadow-sm`}>
                    <item.icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-slate-600">{item.label}</span>
            </button>
        ))}
      </div>

      {/* 4. Upcoming List */}
      <section>
          <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base md:text-lg text-slate-900">Upcoming Appointments</h3>
              <Button variant="link" className="text-blue-600 h-auto p-0 text-sm font-semibold" onClick={() => handleNavigate('appointments')}>
                  View All
              </Button>
          </div>
          
          <div className="space-y-3">
              {data.upcoming.length > 0 ? data.upcoming.slice(0, 3).map((apt) => (
                  <div key={apt._id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate(`appointments`)}>
                      <div className="bg-slate-50 h-12 w-12 rounded-xl flex flex-col items-center justify-center border border-slate-100 flex-shrink-0 text-slate-700">
                          <span className="text-[10px] font-bold uppercase opacity-60">{new Date(apt.scheduledTime).toLocaleDateString('en-US', {month: 'short'})}</span>
                          <span className="text-lg font-bold leading-none">{new Date(apt.scheduledTime).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                          <h4 className="text-sm md:text-base font-bold text-slate-800 truncate">Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}</h4>
                          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 mt-0.5">
                             <span className="truncate max-w-[150px]">{apt.hospitalId?.name}</span>
                             <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0"></span>
                             <span>{new Date(apt.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
              )) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400">No upcoming appointments</p>
                  </div>
              )}
          </div>
      </section>
    </div>
  )
}
