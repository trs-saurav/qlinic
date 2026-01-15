// src/app/user/appointments/[id]/queue/page.jsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, Clock, MapPin, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QueuePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [appointment, setAppointment] = useState(null)
  const [queueStats, setQueueStats] = useState(null)

  // Initial Data Fetch
  useEffect(() => {
    fetchData()
  }, [])

  // Auto Refresh Interval
  useEffect(() => {
    if (!appointment) return
    const interval = setInterval(() => {
       fetchQueueStats(appointment.doctorId._id, appointment.hospitalId._id)
    }, 15000) // Fast refresh for active page (15s)
    return () => clearInterval(interval)
  }, [appointment])

  const fetchData = async () => {
    setLoading(true);
    try {
       const res = await fetch(`/api/appointment/${params.id}`)
       const data = await res.json()
       if (!data.success || !data.appointment) {
         throw new Error(data.error || "Appointment not found");
       }
       
       setAppointment(data.appointment)
       
       await fetchQueueStats(data.appointment.doctorId._id, data.appointment.hospitalId._id)
    } catch (err) {
        toast.error(err.message || "Failed to load queue details")
        console.error(err)
        // Set appointment to null in case of error to show 'not found' message
        setAppointment(null); 
    } finally {
        setLoading(false)
    }
  }

  const fetchQueueStats = async (docId, hospId) => {
      try {
        const res = await fetch(`/api/appointment/queue?doctorId=${docId}&hospitalId=${hospId}`)
        const data = await res.json()
        if (data.success) setQueueStats(data.queue)
      } catch (e) { console.error(e) }
  }

  if (loading) return <div className="p-8 text-center">Loading queue...</div>
  if (!appointment) return <div className="p-8 text-center text-red-500">Appointment not found.</div>


  // Calculations
  const myToken = appointment?.tokenNumber
  const currentToken = queueStats?.currentToken || 0
  const isMyTurn = myToken === currentToken
  const tokensAhead = Math.max(0, myToken - currentToken - 1)
  const waitTime = tokensAhead * (queueStats?.avgConsultationTime || 15)

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Live Queue Status</h1>
      </div>

      {/* Main Status Card */}
      <Card className="mb-6 border-0 shadow-lg overflow-hidden relative">
        <div className={`absolute top-0 left-0 w-full h-2 ${isMyTurn ? 'bg-green-500' : 'bg-teal-600'}`}></div>
        <CardContent className="pt-8 pb-8 text-center">
             
             {isMyTurn ? (
                 <div className="animate-pulse">
                     <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                         <Stethoscope className="w-10 h-10 text-green-600" />
                     </div>
                     <h2 className="text-2xl font-bold text-green-700">It's Your Turn!</h2>
                     <p className="text-slate-600">Please proceed to the consultation room.</p>
                 </div>
             ) : (
                 <>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Current Token Serving</p>
                    <div className="text-6xl font-black text-slate-900 mb-2">
                        {currentToken}
                    </div>
                    <div className="flex justify-center gap-2 mb-6">
                        <Badge variant="outline" className="border-teal-200 text-teal-700 bg-teal-50">
                            Your Token: #{myToken}
                        </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="max-w-xs mx-auto space-y-2 text-left">
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                            <span>Progress</span>
                            <span>{tokensAhead} people ahead</span>
                        </div>
                        <Progress value={(currentToken / myToken) * 100} className="h-2" />
                        <p className="text-center text-xs text-slate-400 mt-2">
                            Estimated Wait: <span className="text-slate-900 font-bold">{waitTime} mins</span>
                        </p>
                    </div>
                 </>
             )}
        </CardContent>
      </Card>

      {/* Doctor Info */}
      <Card className="mb-4">
          <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                  <h3 className="font-bold text-slate-900">Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}</h3>
                  <p className="text-sm text-slate-500">{appointment.hospitalId?.name}</p>
              </div>
          </CardContent>
      </Card>

      <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => fetchData()} className="text-slate-500">
              <RefreshCw className="w-3 h-3 mr-2" /> Refresh Status
          </Button>
      </div>
    </div>
  )
}
