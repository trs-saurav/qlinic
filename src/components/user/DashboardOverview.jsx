// src/components/patient/DashboardOverview.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText,
  Activity,
  Heart,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Hospital,
  Stethoscope
} from 'lucide-react'

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    familyMembers: 0,
    medicalRecords: 0,
    lastVisit: null
  })
  const [recentAppointments, setRecentAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [appointmentsRes, familyRes] = await Promise.all([
        fetch('/api/patient/appointments'),
        fetch('/api/patient/family')
      ])

      const appointmentsData = await appointmentsRes.json()
      const familyData = await familyRes.json()

      if (appointmentsData.appointments) {
        const upcoming = appointmentsData.appointments.filter(a => 
          new Date(a.scheduledTime) > new Date() && a.status !== 'COMPLETED'
        )
        setRecentAppointments(appointmentsData.appointments.slice(0, 3))
        setStats(prev => ({ ...prev, upcomingAppointments: upcoming.length }))
      }

      if (familyData.familyMembers) {
        setStats(prev => ({ ...prev, familyMembers: familyData.familyMembers.length }))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    { 
      icon: Hospital, 
      label: 'Find Hospital', 
      color: 'bg-blue-500', 
      action: 'hospitals',
      description: 'Search nearby hospitals'
    },
    { 
      icon: Calendar, 
      label: 'Book Appointment', 
      color: 'bg-green-500', 
      action: 'hospitals',
      description: 'Schedule a consultation'
    },
    { 
      icon: Users, 
      label: 'Add Family Member', 
      color: 'bg-purple-500', 
      action: 'family',
      description: 'Manage family health'
    },
    { 
      icon: FileText, 
      label: 'View Records', 
      color: 'bg-orange-500', 
      action: 'records',
      description: 'Access medical history'
    }
  ]

  const handleQuickAction = (action) => {
    window.dispatchEvent(new CustomEvent('patientTabChange', { detail: action }))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-primary to-blue-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome Back! 👋</h2>
              <p className="text-blue-100">Manage your health and family appointments in one place</p>
            </div>
            <Activity className="w-16 h-16 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Upcoming</p>
                <p className="text-3xl font-bold text-slate-900">{stats.upcomingAppointments}</p>
                <p className="text-xs text-slate-400 mt-1">Appointments</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Family</p>
                <p className="text-3xl font-bold text-slate-900">{stats.familyMembers}</p>
                <p className="text-xs text-slate-400 mt-1">Members</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Records</p>
                <p className="text-3xl font-bold text-slate-900">{stats.medicalRecords}</p>
                <p className="text-xs text-slate-400 mt-1">Documents</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Health Score</p>
                <p className="text-3xl font-bold text-slate-900">85</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Good
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.action)}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-slate-100 hover:border-primary hover:shadow-lg transition-all group"
                >
                  <div className={`${action.color} p-4 rounded-xl mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{action.label}</h3>
                  <p className="text-xs text-slate-500 text-center">{action.description}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Appointments</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleQuickAction('appointments')}
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentAppointments.length > 0 ? (
            <div className="space-y-3">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg">
                      <Stethoscope className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {appointment.doctorId?.doctorProfile?.specialization}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(appointment.scheduledTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={appointment.status === 'COMPLETED' ? 'success' : 'default'}
                    className="capitalize"
                  >
                    {appointment.status.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No appointments yet</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => handleQuickAction('hospitals')}
              >
                Book your first appointment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Health Tip of the Day</h4>
              <p className="text-sm text-blue-700">
                Stay hydrated! Drink at least 8 glasses of water daily to maintain optimal health and energy levels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
