// app/admin/dashboard/page.jsx
'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  UserCheck, 
  Building2, 
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch dashboard stats
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with Qlinic today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>Last year</option>
          </select>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Download Report
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value="12,485"
          change="+12.5%"
          trend="up"
          icon={Users}
          iconColor="bg-blue-500"
          description="Active patients"
        />
        <StatCard
          title="Doctors"
          value="324"
          change="+8.2%"
          trend="up"
          icon={UserCheck}
          iconColor="bg-green-500"
          badge={{ count: 5, label: 'Pending' }}
          description="Verified doctors"
        />
        <StatCard
          title="Hospitals"
          value="89"
          change="+3.1%"
          trend="up"
          icon={Building2}
          iconColor="bg-purple-500"
          badge={{ count: 2, label: 'Pending' }}
          description="Registered hospitals"
        />
        <StatCard
          title="Support Tickets"
          value="47"
          change="-15.3%"
          trend="down"
          icon={MessageSquare}
          iconColor="bg-orange-500"
          badge={{ count: 12, label: 'Open' }}
          description="Total tickets"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MiniStatCard
          title="Today's Appointments"
          value="156"
          icon={Calendar}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <MiniStatCard
          title="Revenue (MTD)"
          value="₹2.4L"
          icon={DollarSign}
          iconBg="bg-green-50 dark:bg-green-900/20"
          iconColor="text-green-600 dark:text-green-400"
        />
        <MiniStatCard
          title="Avg Response Time"
          value="2.3 hrs"
          icon={Clock}
          iconBg="bg-orange-50 dark:bg-orange-900/20"
          iconColor="text-orange-600 dark:text-orange-400"
        />
        <MiniStatCard
          title="System Uptime"
          value="99.8%"
          icon={Activity}
          iconBg="bg-green-50 dark:bg-green-900/20"
          iconColor="text-green-600 dark:text-green-400"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentActivities />
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Verifications */}
        <PendingVerifications />

        {/* Recent Support Tickets */}
        <RecentTickets />
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, change, trend, icon: Icon, iconColor, badge, description }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </h3>
            {change && (
              <span className={cn(
                'flex items-center gap-1 text-sm font-medium',
                trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {change}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>
        <div className={cn('p-3 rounded-lg', iconColor)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      {badge && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">{badge.label}</span>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
              {badge.count}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Mini Stat Card
function MiniStatCard({ title, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('p-2.5 rounded-lg', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

// Recent Activities Component
function RecentActivities() {
  const activities = [
    { 
      id: 1, 
      type: 'user', 
      message: 'New user registered', 
      user: 'Rajesh Kumar',
      time: '2 minutes ago',
      icon: Users,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    { 
      id: 2, 
      type: 'doctor', 
      message: 'Doctor verification approved', 
      user: 'Dr. Priya Sharma',
      time: '15 minutes ago',
      icon: CheckCircle2,
      iconBg: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    { 
      id: 3, 
      type: 'hospital', 
      message: 'Hospital profile updated', 
      user: 'Apollo Hospital',
      time: '1 hour ago',
      icon: Building2,
      iconBg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    { 
      id: 4, 
      type: 'support', 
      message: 'Support ticket resolved', 
      user: 'Ticket #1234',
      time: '2 hours ago',
      icon: CheckCircle2,
      iconBg: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    { 
      id: 5, 
      type: 'appointment', 
      message: 'Appointment cancelled', 
      user: 'Amit Patel',
      time: '3 hours ago',
      icon: XCircle,
      iconBg: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400'
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Activities
        </h2>
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={cn('p-2 rounded-lg flex-shrink-0', activity.iconBg)}>
                <Icon className={cn('w-4 h-4', activity.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {activity.user} • {activity.time}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Quick Actions Component
function QuickActions() {
  const actions = [
    { label: 'Verify Doctor', icon: UserCheck, color: 'text-green-600 dark:text-green-400', href: '/admin/doctors?tab=pending' },
    { label: 'Approve Hospital', icon: Building2, color: 'text-purple-600 dark:text-purple-400', href: '/admin/hospitals?tab=pending' },
    { label: 'View Tickets', icon: MessageSquare, color: 'text-orange-600 dark:text-orange-400', href: '/admin/support' },
    { label: 'Add User', icon: Users, color: 'text-blue-600 dark:text-blue-400', href: '/admin/users/new' }
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Quick Actions
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Icon className={cn('w-6 h-6', action.color)} />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          System Health
        </h3>
        <div className="space-y-3">
          <HealthItem label="Database" status="operational" />
          <HealthItem label="API Services" status="operational" />
          <HealthItem label="Email Server" status="operational" />
        </div>
      </div>
    </div>
  )
}

function HealthItem({ label, status }) {
  const isOperational = status === 'operational'
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          isOperational ? 'bg-green-500' : 'bg-red-500'
        )}></div>
        <span className={cn(
          'text-xs font-medium',
          isOperational ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {isOperational ? 'Operational' : 'Down'}
        </span>
      </div>
    </div>
  )
}

// Pending Verifications Component
function PendingVerifications() {
  const verifications = [
    { id: 1, name: 'Dr. Amit Verma', type: 'Doctor', specialty: 'Cardiologist', submitted: '2 days ago' },
    { id: 2, name: 'Dr. Sneha Reddy', type: 'Doctor', specialty: 'Pediatrician', submitted: '3 days ago' },
    { id: 3, name: 'City Care Hospital', type: 'Hospital', specialty: 'Multi-specialty', submitted: '5 days ago' }
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Pending Verifications
        </h2>
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
          {verifications.length} Pending
        </span>
      </div>

      <div className="space-y-3">
        {verifications.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {item.specialty} • {item.submitted}
              </p>
            </div>
            <button className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
              Review
            </button>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
        View All Pending
      </button>
    </div>
  )
}

// Recent Support Tickets Component
function RecentTickets() {
  const tickets = [
    { id: 1234, subject: 'Cannot book appointment', user: 'Rahul Singh', priority: 'high', status: 'open', time: '30 min ago' },
    { id: 1235, subject: 'Payment failed', user: 'Anjali Gupta', priority: 'urgent', status: 'in_progress', time: '1 hour ago' },
    { id: 1236, subject: 'Profile update issue', user: 'Vikram Patel', priority: 'normal', status: 'open', time: '2 hours ago' }
  ]

  const priorityColors = {
    urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Support Tickets
        </h2>
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    #{ticket.id}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 text-[10px] font-semibold rounded-full',
                    priorityColors[ticket.priority]
                  )}>
                    {ticket.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {ticket.subject}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {ticket.user} • {ticket.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
