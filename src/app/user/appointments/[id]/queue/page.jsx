// src/app/patient/appointments/[id]/queue/page.jsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, AlertCircle, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

export default function QueueDashboard() {
  const { id } = useParams()
  const router = useRouter()
  const [queueData, setQueueData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQueueStatus()
    const interval = setInterval(fetchQueueStatus, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [id])

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(`/api/appointment/queue?appointmentId=${id}`)
      const data = await response.json()
      
      if (data.success) {
        setQueueData(data)
      }
    } catch (error) {
      console.error('Error fetching queue:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // State 1: Pre-Arrival (Relax Mode)
  if (queueData?.state === 'PRE_ARRIVAL') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Appointment Confirmed</h2>
            <p className="text-slate-600 mb-6">
              {queueData.appointment.hospitalName}
            </p>
            
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
              <p className="text-sm text-green-700 uppercase font-semibold mb-2">Safe Arrival Time</p>
              <p className="text-3xl font-bold text-green-900">
                {new Date(queueData.appointment.scheduledTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-sm text-green-600 mt-2">
                {new Date(queueData.appointment.scheduledTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 text-left">
              <p className="text-sm text-slate-700 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> Your token number will be assigned when you check in at the reception.
                  The queue will become visible after check-in.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // State 3: Skipped (Panic Mode)
  if (queueData?.state === 'SKIPPED') {
    return (
      <div className="min-h-screen bg-red-50 p-6">
        <Card className="max-w-2xl mx-auto border-red-300">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">You Missed Your Turn</h2>
            <p className="text-red-700 text-lg mb-6">
              {queueData.message}
            </p>
            <Button variant="destructive" size="lg" onClick={() => router.push('/patient/appointments')}>
              Contact Reception
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // State 2: Live Queue (Active Mode)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Your Token Card */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardContent className="p-8">
            <p className="text-sm opacity-90 uppercase tracking-wide mb-2">Your Token Number</p>
            <h1 className="text-7xl font-bold mb-4">#{queueData.yourToken}</h1>
            {queueData.isYourTurnSoon && (
              <Badge className="bg-amber-500 text-white px-4 py-1">
                Get Ready! You're up in ~{queueData.tokensAhead} turns
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Current Token */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Currently Serving</p>
                <p className="text-4xl font-bold text-slate-900">#{queueData.currentToken}</p>
              </div>
              <Users className="w-12 h-12 text-slate-300" />
            </div>
          </CardContent>
        </Card>

        {/* Wait Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Estimated Wait Time</p>
                <p className="text-3xl font-bold text-slate-900">~{queueData.estimatedWaitMins} mins</p>
                <p className="text-sm text-slate-600 mt-2">{queueData.tokensAhead} people ahead of you</p>
              </div>
              <Clock className="w-12 h-12 text-slate-300" />
            </div>
          </CardContent>
        </Card>

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Auto-updating every 10 seconds</span>
        </div>
      </div>
    </div>
  )
}
