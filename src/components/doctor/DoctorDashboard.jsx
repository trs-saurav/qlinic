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
  ArrowRight, Activity, Stethoscope,
  MapPin, Bell, ChevronRight, Plus,
  CalendarDays, Sparkles, BarChart3
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useDoctor } from '@/context/DoctorContextProvider'

export default function DoctorDashboard() {
  const {
    doctor,
    doctorLoading,
    dashboard,
    dashboardLoading,
    appointments,
    appointmentsLoading,
    affiliations,
    affiliationsLoading,
    fetchDoctorProfile,
    fetchDoctorDashboard,
    fetchAppointments
  } = useDoctor()

  useEffect(() => {
    if (doctor?._id) {
      fetchDoctorDashboard()
      fetchAppointments('today')
    }
  }, [doctor?._id])

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusConfig = (status) => {
    const configs = {
      BOOKED: { 
        color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        label: 'Booked'
      },
      CHECKED_IN: { 
        color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        label: 'Checked In'
      },
      IN_CONSULTATION: { 
        color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
        label: 'In Progress'
      },
      COMPLETED: { 
        color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        label: 'Completed'
      },
      CANCELLED: { 
        color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        label: 'Cancelled'
      }
    }
    return configs[status] || configs.BOOKED
  }

  if (doctorLoading) {
    return <DashboardSkeleton />
  }

  const isProfileComplete = doctor?.isProfileComplete
  const todayAppointments = appointments || []
  const approvedAffiliationsCount = (affiliations || []).filter(a => a.status === 'APPROVED').length
  const pendingAffiliationsCount = (affiliations || []).filter(a => a.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Profile Incomplete Alert - Mobile Optimized */}
        {!isProfileComplete && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-[2px]">
            <div className="bg-white dark:bg-slate-900 rounded-[14px] p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg mb-1">
                      Complete Your Profile
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Set up your profile to start accepting appointments
                    </p>
                  </div>
                </div>
                <Link href="/doctor/profile" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg shadow-orange-500/25 font-semibold">
                    Complete Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header - Enhanced Mobile Design */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 sm:p-8 shadow-xl shadow-emerald-500/20">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full translate-y-24 -translate-x-24 blur-2xl" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-emerald-100 text-sm font-medium">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, Dr. {doctor?.firstName || 'Doctor'}!
              </h1>
              <p className="text-emerald-50 text-base sm:text-lg">
                {dashboard.todayAppointments > 0 
                  ? `You have ${dashboard.todayAppointments} appointment${dashboard.todayAppointments !== 1 ? 's' : ''} scheduled for today`
                  : 'No appointments today - enjoy your day!'}
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Mobile First, Card-Based */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Today"
            value={dashboard.todayAppointments || 0}
            icon={Calendar}
            gradient="from-blue-500 to-blue-600"
            iconBg="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
            trend={dashboard.todayAppointments > 0 ? 'Scheduled' : 'Free day'}
          />
          <StatCard
            label="Patients"
            value={dashboard.upcomingAppointments || 0}
            icon={Users}
            gradient="from-emerald-500 to-emerald-600"
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
            trend="All time"
          />
          <StatCard
            label="Hospitals"
            value={approvedAffiliationsCount || dashboard.hospitalsCount || 0}
            icon={Hospital}
            gradient="from-purple-500 to-purple-600"
            iconBg="bg-purple-500/10"
            iconColor="text-purple-600 dark:text-purple-400"
            trend="Active"
          />
          <StatCard
            label="Pending"
            value={pendingAffiliationsCount || dashboard.pendingHospitalInvites || 0}
            icon={Bell}
            gradient="from-orange-500 to-red-500"
            iconBg="bg-orange-500/10"
            iconColor="text-orange-600 dark:text-orange-400"
            trend={dashboard.pendingHospitalInvites > 0 ? 'Action needed' : 'All clear'}
            highlight={(pendingAffiliationsCount || dashboard.pendingHospitalInvites) > 0}
          />
        </div>

        {/* Quick Actions - Enhanced Mobile Grid */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <QuickActionButton
              href="/doctor/appointments"
              icon={Calendar}
              label="Appointments"
              gradient="from-blue-500 to-blue-600"
            />
            <QuickActionButton
              href="/doctor/affiliations"
              icon={Hospital}
              label="Hospitals"
              gradient="from-purple-500 to-purple-600"
              badge={dashboard.pendingHospitalInvites}
            />
            <QuickActionButton
              href="/doctor/schedule"
              icon={Clock}
              label="Schedule"
              gradient="from-emerald-500 to-emerald-600"
            />
            <QuickActionButton
              href="/doctor/profile"
              icon={Stethoscope}
              label="Profile"
              gradient="from-orange-500 to-orange-600"
            />
          </CardContent>
        </Card>

        {/* Today's Schedule - Mobile Optimized List */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Today's Schedule
              </CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link href="/doctor/appointments">
              <Button variant="ghost" size="sm" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
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
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.slice(0, 5).map((appointment) => {
                  const patientName = `${appointment.patientId?.firstName || ''} ${appointment.patientId?.lastName || ''}`.trim()
                  const patientInitials = appointment.patientId?.firstName && appointment.patientId?.lastName
                    ? `${appointment.patientId.firstName[0]}${appointment.patientId.lastName[0]}`.toUpperCase()
                    : 'P'
                  const statusConfig = getStatusConfig(appointment.status)

                  return (
                    <div 
                      key={appointment._id} 
                      className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200"
                    >
                      {/* Gradient Border on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative p-4">
                        <div className="flex items-start sm:items-center gap-3">
                          {/* Avatar */}
                          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-emerald-200 dark:border-emerald-800 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-lg">
                              {patientInitials}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">
                                {patientName || 'Patient'}
                              </h3>
                              <Badge className={`${statusConfig.color} border flex-shrink-0 text-xs`}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                                {formatTime(appointment.scheduledTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                                Token #{appointment.tokenNumber}
                              </span>
                              {appointment.hospitalId?.name && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                                  <span className="truncate">{appointment.hospitalId.name}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Button - Desktop Only */}
                          <div className="hidden sm:block">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-300 dark:hover:border-emerald-700"
                              asChild
                            >
                              <Link href="/doctor/appointments">
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No appointments today"
                description="Enjoy your free time! Your next appointments will appear here."
              />
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

// Modern Stat Card Component
function StatCard({ label, value, icon: Icon, gradient, iconBg, iconColor, trend, highlight }) {
  return (
    <Card className={`
      relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300
      bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm
      ${highlight ? 'ring-2 ring-orange-500 shadow-orange-500/20' : ''}
    `}>
      {highlight && (
        <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-orange-500 to-red-500" />
      )}
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
          </div>
          
          {/* Value */}
          <div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {value}
            </p>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              {label}
            </p>
            <div className="flex items-center gap-1">
              <TrendingUp className={`w-3 h-3 ${iconColor}`} />
              <span className={`text-xs font-semibold ${iconColor}`}>
                {trend}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Action Button Component
function QuickActionButton({ href, icon: Icon, label, gradient, badge }) {
  return (
    <Link href={href} className="relative group">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300 h-full">
        <div className="p-4 sm:p-5 flex flex-col items-center text-center gap-3">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <span className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            {label}
          </span>
          {badge > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
              {badge}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// Empty State Component
function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 dark:text-slate-600" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto px-4">
        {description}
      </p>
    </div>
  )
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <Skeleton className="h-32 sm:h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 sm:h-40 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  )
}
