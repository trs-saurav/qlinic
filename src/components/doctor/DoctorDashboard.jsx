// src/components/doctor/DoctorDashboard.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, Calendar, Hospital, Clock, 
  CheckCircle, AlertCircle, TrendingUp, 
  ArrowRight, Activity, DollarSign, Stethoscope,
  MapPin, Phone, Video
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function DoctorDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    stats: {
      todayAppointments: 0,
      totalPatients: 0,
      hospitalAffiliations: 0,
      pendingRequests: 0
    },
    todaySchedule: [],
    recentAppointments: [],
    profile: null
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch all data in parallel
      const [profileRes, appointmentsRes, affiliationsRes] = await Promise.all([
        fetch('/api/doctor/profile'),
        fetch('/api/appointments'),
        fetch('/api/doctor/affiliations')
      ])

      const [profileData, appointmentsData, affiliationsData] = await Promise.all([
        profileRes.json(),
        appointmentsRes.json(),
        affiliationsRes.json()
      ])

      // Process data
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const appointments = appointmentsData.appointments || []
      
      // Filter today's appointments
      const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledTime)
        return aptDate >= today && aptDate < tomorrow
      })

      // Get unique patients
      const uniquePatients = new Set(appointments.map(apt => apt.patientId?._id)).size

      // Get active affiliations
      const activeAffiliations = (affiliationsData.affiliations || [])
        .filter(aff => aff.status === 'APPROVED').length

      // Get pending requests
      const pendingRequests = (affiliationsData.requests || [])
        .filter(req => req.status === 'PENDING').length

      // Sort today's appointments by time
      const sortedTodaySchedule = todayAppointments
        .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
        .slice(0, 5)

      setDashboardData({
        stats: {
          todayAppointments: todayAppointments.length,
          totalPatients: uniquePatients,
          hospitalAffiliations: activeAffiliations,
          pendingRequests: pendingRequests
        },
        todaySchedule: sortedTodaySchedule,
        recentAppointments: appointments.slice(0, 5),
        profile: profileData.profile || null
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      BOOKED: 'bg-blue-100 text-blue-700 border-blue-200',
      CHECKED_IN: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      IN_CONSULTATION: 'bg-purple-100 text-purple-700 border-purple-200',
      COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[status] || colors.BOOKED
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const { stats, todaySchedule, profile } = dashboardData

  // Check if profile is complete
  const isProfileComplete = profile?.isProfileComplete

  return (
    <div className="space-y-6">
      {/* Profile Incomplete Warning */}
      {!isProfileComplete && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <div>
                <h3 className="font-bold text-orange-900 dark:text-orange-100 text-lg">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  You need to complete your profile to start accepting appointments
                </p>
              </div>
            </div>
            <Link href="/doctor/profile">
              <Button className="bg-orange-600 hover:bg-orange-700 font-semibold">
                Complete Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Welcome Banner */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, Dr. {profile?.firstName || 'Doctor'}!
              </h1>
              <p className="text-emerald-50 text-lg">
                You have {stats.todayAppointments} appointment{stats.todayAppointments !== 1 ? 's' : ''} scheduled for today
              </p>
            </div>
            <Stethoscope className="w-20 h-20 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Today's Appointments"
          value={stats.todayAppointments}
          icon={Calendar}
          color="blue"
          trend={stats.todayAppointments > 0 ? `${stats.todayAppointments} scheduled` : 'None today'}
        />
        <StatCard
          label="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          color="emerald"
          trend="All time"
        />
        <StatCard
          label="Hospital Affiliations"
          value={stats.hospitalAffiliations}
          icon={Hospital}
          color="purple"
          trend={stats.hospitalAffiliations > 0 ? 'Active' : 'None yet'}
        />
        <StatCard
          label="Pending Requests"
          value={stats.pendingRequests}
          icon={AlertCircle}
          color="orange"
          trend={stats.pendingRequests > 0 ? 'Needs action' : 'All clear'}
          highlight={stats.pendingRequests > 0}
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/doctor/appointments" className="block">
              <Button className="w-full h-20 text-base font-semibold flex-col gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300" variant="outline">
                <Calendar className="w-6 h-6" />
                View Appointments
              </Button>
            </Link>
            <Link href="/doctor/affiliations" className="block">
              <Button className="w-full h-20 text-base font-semibold flex-col gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-300" variant="outline">
                <Hospital className="w-6 h-6" />
                Hospital Requests
                {stats.pendingRequests > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                    {stats.pendingRequests}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/doctor/schedule" className="block">
              <Button className="w-full h-20 text-base font-semibold flex-col gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300" variant="outline">
                <Clock className="w-6 h-6" />
                Manage Schedule
              </Button>
            </Link>
            <Link href="/doctor/profile" className="block">
              <Button className="w-full h-20 text-base font-semibold flex-col gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border-2 border-orange-200 dark:bg-orange-950 dark:hover:bg-orange-900 dark:text-orange-300" variant="outline">
                <Users className="w-6 h-6" />
                Update Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Today's Schedule</CardTitle>
          <Link href="/doctor/appointments">
            <Button variant="ghost" size="sm" className="font-semibold">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {todaySchedule.length > 0 ? (
            <div className="space-y-4">
              {todaySchedule.map((appointment) => {
                const patientName = `${appointment.patientId?.firstName || ''} ${appointment.patientId?.lastName || ''}`.trim()
                const patientInitials = appointment.patientId?.firstName && appointment.patientId?.lastName
                  ? `${appointment.patientId.firstName[0]}${appointment.patientId.lastName[0]}`.toUpperCase()
                  : 'P'

                return (
                  <div key={appointment._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-14 h-14 border-2 border-emerald-500">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                          {patientInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                          {patientName || 'Patient'}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(appointment.scheduledTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Token: #{appointment.tokenNumber}
                          </span>
                          {appointment.type === 'EMERGENCY' && (
                            <Badge variant="destructive" className="text-xs">
                              Emergency
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-4">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {appointment.hospitalId?.name || 'Hospital'}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/doctor/appointments`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                No appointments scheduled for today
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                Enjoy your day off!
              </p>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color, trend, highlight }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-950'
  }

  return (
    <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow ${highlight ? 'ring-2 ring-orange-500' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              {label}
            </p>
            <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {value}
            </p>
            <div className="flex items-center gap-1">
              <TrendingUp className={`w-3 h-3 ${colorClasses[color].split(' ')[0]}`} />
              <span className={`text-xs font-semibold ${colorClasses[color].split(' ')[0]}`}>
                {trend}
              </span>
            </div>
          </div>
          <div className={`w-16 h-16 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${colorClasses[color].split(' ')[0]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
