'use client'

import { useEffect, useState } from 'react'
import { useHospitalAdmin } from '@/context/HospitalAdminContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  Users, Calendar, Hospital, Clock, Bed,
  DollarSign, TrendingUp, Activity, AlertCircle,
  Stethoscope, UserPlus, ArrowRight, CheckCircle,
  Package, BarChart3, RefreshCw, MapPin,
  Phone, Mail, Building2, CircleDot, Timer,
  TrendingDown, Minus, ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

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

  const [expandedSections, setExpandedSections] = useState({
    schedule: true,
    doctors: true
  })

  useEffect(() => {
    fetchAppointments('today')
    fetchDoctors()
    fetchInventory()
    
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

  const getStatusColor = (status) => {
    const colors = {
      BOOKED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
      CHECKED_IN: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300',
      IN_CONSULTATION: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
      COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
      CANCELLED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
    }
    return colors[status] || colors.BOOKED
  }

  if (hospitalLoading) {
    return <DashboardSkeleton />
  }

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

  const activeDoctorsCount = doctors.filter(d => d.doctorProfile?.isAvailable).length || doctors.length

  return (
    <motion.div 
      className="space-y-4 pb-20 lg:pb-8 px-0 sm:px-0"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      
      {/* Compact Welcome Header - Mobile Optimized */}
      <motion.div 
        className="flex items-center justify-between px-4 sm:px-0"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshAll}
            className="gap-1.5 h-8 sm:h-9"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline text-sm">Refresh</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Grid - Mobile First */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-0"
        variants={gridVariants}
      >
        <motion.div variants={gridItemVariants}>
          <StatCard
            label="Appointments"
            value={stats.todayAppointments}
            icon={Calendar}
            color="blue"
            trend={stats.pendingAppointments}
            trendLabel="pending"
            href="/hospital-admin/appointments"
            loading={statsLoading}
          />
        </motion.div>
        <motion.div variants={gridItemVariants}>
          <StatCard
            label="Patients"
            value={stats.totalPatients}
            icon={Users}
            color="emerald"
            trend={12}
            trendLabel="new"
            trendUp
            href="/hospital-admin/patients"
            loading={statsLoading}
          />
        </motion.div>
        <motion.div variants={gridItemVariants}>
          <StatCard
            label="Doctors"
            value={stats.totalDoctors || doctors.length}
            icon={Stethoscope}
            color="purple"
            trend={activeDoctorsCount}
            trendLabel="active"
            href="/hospital-admin/staff"
            loading={statsLoading}
          />
        </motion.div>
        <motion.div variants={gridItemVariants}>
          <StatCard
            label="Revenue"
            value={`₹${((stats.revenue?.today || 0) / 1000).toFixed(0)}k`}
            icon={DollarSign}
            color="green"
            trend={15}
            trendLabel="+15%"
            trendUp
            href="/hospital-admin/reports"
            loading={statsLoading}
          />
        </motion.div>
      </motion.div>

      {/* Quick Actions - Mobile Grid */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-200 dark:border-slate-800 mx-4 sm:mx-0">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <QuickActionButton
                href="/hospital-admin/reception"
                icon={UserPlus}
                label="Walk-In"
                color="blue"
              />
              <QuickActionButton
                href="/hospital-admin/appointments"
                icon={Calendar}
                label="Appointments"
                color="emerald"
              />
              <QuickActionButton
                href="/hospital-admin/staff"
                icon={Stethoscope}
                label="Staff"
                color="purple"
              />
              <QuickActionButton
                href="/hospital-admin/reports"
                icon={BarChart3}
                label="Reports"
                color="orange"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content - Mobile Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Today's Schedule */}
        <motion.div 
          className="lg:col-span-2 space-y-4"
          variants={itemVariants}
        >
          <Card className="border-slate-200 dark:border-slate-800 mx-4 sm:mx-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
              <div>
                <CardTitle className="text-base sm:text-lg">Today's Schedule</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {todaySchedule.length} appointments
                </p>
              </div>
              <Link href="/hospital-admin/appointments">
                <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
                  <span className="text-xs sm:text-sm">All</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {appointmentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : todaySchedule.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  <motion.div className="space-y-2" layout>
                    {todaySchedule.map((appointment, index) => {
                      const patient = appointment.patientId
                      const doctor = appointment.doctorId
                      
                      const patientName = patient 
                        ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient'
                        : 'Patient'
                      
                      const doctorName = doctor
                        ? `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()
                        : 'Doctor TBD'
                      
                      const patientInitials = patient?.firstName && patient?.lastName
                        ? `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase()
                        : 'PT'

                      return (
                        <motion.div
                          key={appointment._id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ 
                            delay: index * 0.05,
                            type: "spring",
                            stiffness: 300,
                            damping: 25
                          }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg active:bg-slate-100 dark:active:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 + 0.1 }}
                          >
                            <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-blue-500">
                              <AvatarFallback className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-xs sm:text-sm">
                                {patientInitials}
                              </AvatarFallback>
                            </Avatar>
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                              {patientName}
                            </p>
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                {formatTime(appointment.scheduledTime)}
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:flex items-center gap-1 truncate">
                                <Stethoscope className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{doctorName}</span>
                              </span>
                              {appointment.tokenNumber && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="hidden sm:inline flex-shrink-0">#{appointment.tokenNumber}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(appointment.status)} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0`} variant="outline">
                            {appointment.status.replace('_', ' ').split(' ')[0]}
                          </Badge>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <motion.div 
                  className="text-center py-8 sm:py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                    No appointments today
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Active Doctors - Hidden on Mobile, Shown on Tablet+ */}
          <Card className="border-slate-200 dark:border-slate-800 mx-4 sm:mx-0 hidden sm:block">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
              <div>
                <CardTitle className="text-base sm:text-lg">Active Doctors</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {activeDoctorsCount} available now
                </p>
              </div>
              <Link href="/hospital-admin/staff">
                <Button variant="ghost" size="sm" className="gap-1 h-8">
                  All
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {doctorsLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : doctors.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
                  variants={gridVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {doctors.slice(0, 4).map((doc, index) => {
                    const doctorFirstName = doc.firstName || 'Doctor'
                    const doctorLastName = doc.lastName || ''
                    const doctorInitials = `${doctorFirstName[0]}${doctorLastName[0] || doctorFirstName[1] || 'R'}`.toUpperCase()
                    
                    return (
                      <motion.div
                        key={doc._id}
                        variants={gridItemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800"
                      >
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-emerald-500">
                          <AvatarImage src={doc.profileImage} />
                          <AvatarFallback className="text-xs sm:text-sm font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            {doctorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                            Dr. {doctorFirstName} {doctorLastName}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 truncate">
                            {doc.doctorProfile?.specialization || 'General'}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <motion.div
                              animate={{ 
                                scale: doc.doctorProfile?.isAvailable ? [1, 1.2, 1] : 1 
                              }}
                              transition={{ 
                                repeat: doc.doctorProfile?.isAvailable ? Infinity : 0, 
                                duration: 2 
                              }}
                            >
                              <CircleDot className={`w-2 h-2 ${doc.doctorProfile?.isAvailable ? 'text-emerald-500' : 'text-slate-400'}`} />
                            </motion.div>
                            <span className={`text-[10px] sm:text-xs ${doc.doctorProfile?.isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                              {doc.doctorProfile?.isAvailable ? 'Available' : 'Busy'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Stethoscope className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    No doctors yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar - Mobile Optimized */}
        <motion.div 
          className="space-y-4"
          variants={itemVariants}
        >
          
          {/* Hospital Info */}
          <Card className="border-slate-200 dark:border-slate-800 mx-4 sm:mx-0">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Hospital Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 px-4 pb-4">
              <InfoRow
                icon={Hospital}
                label="Hospital"
                value={hospital?.name}
                color="blue"
              />
              <InfoRow
                icon={MapPin}
                label="Location"
                value={`${hospital?.address?.city || 'N/A'}, ${hospital?.address?.state || ''}`}
                color="emerald"
              />
              <InfoRow
                icon={DollarSign}
                label="Fee"
                value={`₹${hospital?.consultationFee || 500}`}
                color="green"
              />
              <InfoRow
                icon={Users}
                label="Staff"
                value={`${doctors.length} Doctors`}
                color="purple"
              />
              <InfoRow
                icon={Bed}
                label="Beds"
                value={`${stats.availableBeds}/${stats.totalBeds}`}
                color="orange"
              />
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          {lowStockItems?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 mx-4 sm:mx-0">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-orange-900 dark:text-orange-100">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Low Stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {lowStockItems.slice(0, 3).map((item, index) => (
                      <motion.div 
                        key={item._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-2 bg-white dark:bg-orange-900/30 rounded-lg border border-orange-100 dark:border-orange-900"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Min: {item.minStockLevel}</p>
                        </div>
                        <Badge variant="destructive" className="font-mono text-[10px] sm:text-xs">
                          {item.currentStock}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/hospital-admin/inventory">
                    <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-xs sm:text-sm">
                      View All
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Performance */}
          <Card className="border-slate-200 dark:border-slate-800 mx-4 sm:mx-0">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-base sm:text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 pb-4">
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Completed</span>
                  <motion.span 
                    className="font-semibold text-slate-900 dark:text-slate-100"
                    key={stats.completedAppointments}
                    initial={{ scale: 1.2, color: "#10b981" }}
                    animate={{ scale: 1, color: "inherit" }}
                  >
                    {stats.completedAppointments || 0}/{stats.todayAppointments}
                  </motion.span>
                </div>
                <Progress 
                  value={Math.min((stats.completedAppointments || 0) / Math.max(stats.todayAppointments, 1) * 100, 100)} 
                  className="h-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800">
                <motion.div 
                  className="text-center p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.completedAppointments || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Done</p>
                </motion.div>
                <motion.div 
                  className="text-center p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Timer className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                  <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.pendingAppointments || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Pending</p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Chart - Hidden on Mobile */}
      <motion.div variants={itemVariants} className="hidden lg:block">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Weekly Patient Flow</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Last 7 days</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {[42, 68, 35, 85, 58, 95, 48].map((val, i) => (
                <motion.div 
                  key={i} 
                  className="flex-1 flex flex-col items-center gap-2"
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  transition={{ delay: i * 0.1, type: "spring" }}
                >
                  <motion.div 
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg relative group hover:from-blue-700 hover:to-blue-600 transition-all cursor-pointer"
                    style={{height: `${val}%`}}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                    whileHover={{ scaleY: 1.05 }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold px-2 py-1 rounded shadow-lg">
                      {val}
                    </div>
                  </motion.div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
}

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  }
}

// Modern Stat Card - Mobile Optimized
function StatCard({ label, value, icon: Icon, color, trend, trendLabel, trendUp, href, loading }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600'
  }

  const CardWrapper = href ? Link : 'div'

  return (
    <CardWrapper href={href || '#'}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            {loading ? (
              <div className="space-y-1.5 sm:space-y-2">
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                <Skeleton className="h-6 sm:h-8 w-10 sm:w-16" />
                <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-24" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide truncate">
                      {label}
                    </p>
                    <motion.p 
                      className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-1"
                      key={value}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {value}
                    </motion.p>
                  </div>
                  <motion.div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-md`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </motion.div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                  {trendUp ? (
                    <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                  ) : trendUp === false ? (
                    <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600" />
                  ) : (
                    <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
                  )}
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {trend} {trendLabel}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </CardWrapper>
  )
}

// Quick Action Button - Mobile Optimized
function QuickActionButton({ href, icon: Icon, label, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    purple: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
  }

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          variant="outline" 
          className={`w-full h-16 sm:h-20 flex-col gap-1 sm:gap-2 ${colorClasses[color]} font-semibold`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-sm">{label}</span>
        </Button>
      </motion.div>
    </Link>
  )
}

// Info Row - Mobile Optimized
function InfoRow({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    green: 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
  }

  return (
    <motion.div 
      className="flex items-center gap-2 sm:gap-3"
      whileHover={{ x: 2 }}
    >
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{value}</p>
      </div>
    </motion.div>
  )
}

// Loading Skeleton - Mobile Optimized
function DashboardSkeleton() {
  return (
    <div className="space-y-4 pb-8 px-4 sm:px-0">
      <Skeleton className="h-6 sm:h-8 w-40 sm:w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 sm:h-28" />
        ))}
      </div>
      <Skeleton className="h-28 sm:h-32 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-80 sm:h-96 lg:col-span-2" />
        <Skeleton className="h-80 sm:h-96" />
      </div>
    </div>
  )
}
