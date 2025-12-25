// src/components/hospital/HospitalDashboard.jsx
'use client'

import { useEffect } from 'react'
import { useHospitalAdmin } from '@/context/HospitalAdminContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, Calendar, Hospital, Clock, Bed,
  DollarSign, TrendingUp, Activity, AlertCircle,
  Stethoscope, UserPlus, ArrowRight, CheckCircle,
  XCircle, Package, MessageSquare, BarChart3,
  Bell, Download, FileText, Phone, Mail, RefreshCw
} from 'lucide-react'
import Link from 'next/link'

export default function HospitalDashboard() {
  const { 
    hospital,
    hospitalLoading,
    stats,
    statsLoading,
    appointments,
    appointmentsLoading,
    doctors,
    doctorsLoading,
    lowStockItems,
    fetchAppointments,
    fetchDoctors,
    fetchInventory,
    fetchStats,
    refreshAll
  } = useHospitalAdmin()

  // Fetch initial data
  useEffect(() => {
    fetchAppointments('today')
    fetchDoctors()
    fetchInventory()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats()
      fetchAppointments('today')
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
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

  // Show loading skeleton
  if (hospitalLoading) {
    return <DashboardSkeleton />
  }

  // Filter today's appointments
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todaySchedule = appointments
    .filter(apt => {
      const aptDate = new Date(apt.scheduledTime)
      return aptDate >= today && aptDate < tomorrow
    })
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
    .slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome to {hospital?.name || 'Hospital Dashboard'}
              </h1>
              <p className="text-emerald-50 text-lg">
                You have {stats.todayAppointments} appointment{stats.todayAppointments !== 1 ? 's' : ''} scheduled for today
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={refreshAll}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Hospital className="w-32 h-32 opacity-20 absolute right-6" />
            </div>
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
          trend={`${stats.pendingAppointments} pending`}
          href="/hospital-admin/appointments"
          loading={statsLoading}
        />
        <StatCard
          label="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          color="emerald"
          trend="All time"
          href="/hospital-admin/patients"
          loading={statsLoading}
        />
        <StatCard
          label="Active Staff"
          value={`${stats.totalDoctors}`}
          icon={Stethoscope}
          color="purple"
          trend={`${doctors.filter(d => d.doctorProfile?.isAvailable).length} available now`}
          href="/hospital-admin/staff"
          loading={statsLoading}
        />
        <StatCard
          label="Revenue Today"
          value={`₹${(stats.revenue?.today || 0).toLocaleString()}`}
          icon={DollarSign}
          color="green"
          trend={`₹${(stats.revenue?.month || 0).toLocaleString()} this month`}
          href="/hospital-admin/reports"
          loading={statsLoading}
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/hospital-admin/reception" className="block">
              <Button className="w-full h-24 flex-col gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200" variant="outline">
                <UserPlus className="w-6 h-6" />
                <span className="font-semibold">Add Walk-In</span>
              </Button>
            </Link>
            <Link href="/hospital-admin/appointments" className="block">
              <Button className="w-full h-24 flex-col gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-200" variant="outline">
                <Calendar className="w-6 h-6" />
                <span className="font-semibold">Appointments</span>
              </Button>
            </Link>
            <Link href="/hospital-admin/staff" className="block">
              <Button className="w-full h-24 flex-col gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-purple-200" variant="outline">
                <Stethoscope className="w-6 h-6" />
                <span className="font-semibold">Manage Staff</span>
              </Button>
            </Link>
            <Link href="/hospital-admin/reports" className="block">
              <Button className="w-full h-24 flex-col gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border-2 border-orange-200" variant="outline">
                <BarChart3 className="w-6 h-6" />
                <span className="font-semibold">View Reports</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">Today's Schedule</CardTitle>
            <Link href="/hospital-admin/appointments">
              <Button variant="ghost" size="sm" className="font-semibold">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.map((appointment) => {
                  const patientName = `${appointment.patientId?.firstName || ''} ${appointment.patientId?.lastName || ''}`.trim()
                  const doctorName = `Dr. ${appointment.doctorId?.firstName || ''} ${appointment.doctorId?.lastName || ''}`.trim()
                  const patientInitials = appointment.patientId?.firstName && appointment.patientId?.lastName
                    ? `${appointment.patientId.firstName[0]}${appointment.patientId.lastName[0]}`.toUpperCase()
                    : 'P'

                  return (
                    <div key={appointment._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl hover:shadow-md transition-shadow border border-slate-100">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="w-12 h-12 border-2 border-emerald-500">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                            {patientInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {patientName || 'Patient'}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(appointment.scheduledTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Stethoscope className="w-3 h-3" />
                              {doctorName}
                            </span>
                            {appointment.tokenNumber && (
                              <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                Token: #{appointment.tokenNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.replace('_', ' ')}
                        </Badge>
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Hospital Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Hospital Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Hospital className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Hospital</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{hospital?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Consultation Fee</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">₹{hospital?.consultationFee || 500}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Staff</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{doctors.length} Doctors</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Bed className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Beds</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {stats.availableBeds}/{stats.totalBeds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          {lowStockItems?.length > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-orange-900 dark:text-orange-100">
                  <AlertCircle className="w-5 h-5" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 5).map(item => (
                    <div key={item._id} className="flex items-center justify-between p-2 bg-white dark:bg-orange-900 rounded-lg">
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Min: {item.minStockLevel}</p>
                      </div>
                      <Badge variant="destructive" className="font-mono">
                        {item.currentStock}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Link href="/hospital-admin/inventory">
                  <Button variant="outline" className="w-full mt-4">
                    Manage Inventory
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Completed Today</span>
                  <span className="font-bold">{stats.completedAppointments || 0}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all" 
                    style={{width: `${Math.min((stats.completedAppointments || 0) / Math.max(stats.todayAppointments, 1) * 100, 100)}%`}}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Today's Progress</span>
                  <span className="font-bold">{stats.todayAppointments} appts</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '60%'}}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Doctors */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Active Doctors</CardTitle>
          <Link href="/hospital-admin/staff">
            <Button variant="ghost" size="sm" className="font-semibold">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {doctorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : doctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.slice(0, 6).map(doc => (
                <div key={doc._id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100">
                  <Avatar className="w-14 h-14 border-2 border-emerald-500">
                    <AvatarImage src={doc.profileImage} />
                    <AvatarFallback className="text-lg font-bold">
                      {doc.firstName?.[0]}{doc.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Dr. {doc.firstName} {doc.lastName}
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {doc.doctorProfile?.specialization || 'General'}
                    </p>
                    <Badge className="mt-1" variant={doc.doctorProfile?.isAvailable ? 'default' : 'secondary'}>
                      {doc.doctorProfile?.isAvailable ? 'Available' : 'Busy'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                No doctors registered yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Activity Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Weekly Patient Flow</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {[42, 68, 35, 85, 58, 95, 48].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg relative group hover:from-emerald-600 hover:to-emerald-500 transition-all cursor-pointer"
                  style={{height: `${val}%`}}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">
                    {val}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color, trend, href, loading }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
    green: 'text-green-600 bg-green-50 dark:bg-green-950',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-950'
  }

  const CardWrapper = href ? Link : 'div'

  return (
    <CardWrapper href={href || '#'} className="block">
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {label}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
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
          )}
        </CardContent>
      </Card>
    </CardWrapper>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}
