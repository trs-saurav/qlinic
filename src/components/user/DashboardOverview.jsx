'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, Users, FileText, ChevronRight, Stethoscope, 
  MapPin, Clock, Search, Activity, Pause, AlertCircle, Coffee,
  Plus, Pill, CreditCard, HeartPulse, Syringe, UserPlus, Receipt,
  Home, Hospital, Settings, BookOpen
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

  // Mock user data for personalized experience
  const [user, setUser] = useState({ name: 'John Doe' })

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

  // Quick links for the dashboard — updated to user routes
  const quickLinks = [
    { label: 'Book Appointment', icon: Plus, action: 'search', bg: 'bg-blue-500', text: 'text-white', desc: 'Find and book doctors' },
    { label: 'Medical Records', icon: FileText, action: 'settings/records', bg: 'bg-violet-500', text: 'text-white', desc: 'View health history' },
    { label: 'Prescriptions', icon: Pill, action: 'prescriptions', bg: 'bg-emerald-500', text: 'text-white', desc: 'View medications and prescriptions' },
    { label: 'Billing', icon: Receipt, action: 'billing', bg: 'bg-amber-500', text: 'text-white', desc: 'Payment & invoices' },
    { label: 'Lab Results', icon: Syringe, action: 'lab-results', bg: 'bg-rose-500', text: 'text-white', desc: 'Recent test results' },
    { label: 'Family Members', icon: UserPlus, action: 'settings/family', bg: 'bg-indigo-500', text: 'text-white', desc: 'Manage dependents' },
  ]

  return (
    <div className="space-y-6 pb-20 p-4 font-sans text-slate-900 w-full max-w-3xl mx-auto">
      
      {/* 1. Header */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{formattedDate}</p>
      </div>

      {/* Live Widget */}
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

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Progress value={progressVal} className="h-2 flex-1 bg-black/20 w-full sm:w-auto" indicatorClassName="bg-white" />
              <span className="text-[10px] font-bold w-8 text-right">{Math.round(progressVal)}%</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between shadow-lg hover:shadow-xl transition-shadow rounded-2xl gap-4">
          <div className="flex-1">
            <p className="text-lg font-bold">Find a Specialist</p>
            <p className="text-sm text-slate-400 mb-3">Book appointments easily with our specialists.</p>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl" onClick={() => handleNavigate('search')}>
              <Search className="w-4 h-4 mr-2" />
              Search Doctors
            </Button>
          </div>
          <Stethoscope className="w-12 h-12 sm:w-16 sm:h-16 text-slate-700 opacity-50" />
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
      </section>

      {/* Upcoming Appointments Section */}
      <section className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Upcoming Appointments
          </h2>
          <Button 
            variant="link" 
            className="text-blue-600 h-auto p-0 text-sm font-semibold flex items-center gap-1 hover:text-blue-700 self-start sm:self-auto" 
            onClick={() => handleNavigate('appointments')}
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {data.upcoming.length > 0 ? data.upcoming.slice(0, 3).map((apt) => (
            <div 
              key={apt._id} 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300 dark:hover:border-blue-500"
              onClick={() => handleNavigate(`appointments`)}
            >
              <div className="bg-blue-50 dark:bg-blue-900/30 h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex flex-col items-center justify-center border border-blue-100 dark:border-blue-800 flex-shrink-0 text-blue-700 dark:text-blue-300">
                <span className="text-[10px] sm:text-xs font-bold uppercase opacity-60">{new Date(apt.scheduledTime).toLocaleDateString('en-US', {month: 'short'})}</span>
                <span className="text-base sm:text-lg font-bold leading-none">{new Date(apt.scheduledTime).getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white truncate">Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}</h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="truncate max-w-[120px] sm:max-w-[150px]">{apt.hospitalId?.name}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>{new Date(apt.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
                
                {/* Status badge */}
                <div className="mt-2">
                  <Badge className={
                    apt.status === 'BOOKED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                    apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }>
                    {apt.status.charAt(0) + apt.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 self-start sm:self-auto" />
            </div>
          )) : (
            <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 sm:p-8 text-center">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 sm:mb-2">No upcoming appointments</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-3 sm:mb-4 text-sm">Book your first appointment today</p>
              <Button 
                onClick={() => handleNavigate('search')}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Health Tips Section */}
      <section className="mt-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-emerald-600" />
          Health Tips
        </h2>
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg self-start">
                <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Stay hydrated today</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1">
                  Aim to drink at least 8 glasses of water throughout the day to maintain optimal health.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}