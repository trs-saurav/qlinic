'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Bell,
  Shield,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  FileText,
  CreditCard,
  Clock,
  Building2,
  Stethoscope,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { useDoctor } from '@/context/DoctorContextProvider'

export default function DoctorSettingsHomePage() {
  const {
    doctor,
    doctorLoading,
    affiliations,
    affiliationsLoading,
    fetchAffiliations,
    dashboard,
    dashboardLoading,
    fetchDoctorDashboard,
  } = useDoctor()

  useEffect(() => {
    if (doctor?._id) {
      fetchAffiliations()
      fetchDoctorDashboard()
    }
  }, [doctor?._id, fetchAffiliations, fetchDoctorDashboard])

  // Use isProfileComplete from API or calculate
  const profileCompletion = doctor?.isProfileComplete 
    ? 100 
    : calculateProfileCompletion(doctor)
    
  const issues = getProfileIssues(doctor, affiliations)

  if (doctorLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:bg-transparent">
      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 pb-20 lg:pb-6">
        
        {/* Profile Status Card - Enhanced Mobile */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white overflow-hidden mx-0 rounded-none sm:rounded-2xl sm:mx-0">
          <CardContent className="p-4 sm:p-6 relative">
            {/* Decorative Elements */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-400/20 rounded-full blur-xl" />
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                    <User className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg">
                      Dr. {doctor?.firstName} {doctor?.lastName}
                    </h2>
                    <p className="text-emerald-100 text-xs sm:text-sm">
                      {profileCompletion}% Profile Complete
                    </p>
                  </div>
                </div>
                {profileCompletion === 100 ? (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-emerald-100">Profile Strength</span>
                  <span className="text-xs font-bold text-white">{profileCompletion}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                <StatBadge
                  label="Today"
                  value={dashboardLoading ? '...' : dashboard?.todayAppointments || 0}
                  icon={Calendar}
                />
                <StatBadge
                  label="Hospitals"
                  value={affiliationsLoading ? '...' : (affiliations || []).filter(a => a.status === 'APPROVED').length}
                  icon={Building2}
                />
                <StatBadge
                  label="This Week"
                  value={dashboardLoading ? '...' : dashboard?.completedThisWeek || 0}
                  icon={Activity}
                />
              </div>

              {/* Action Button */}
              {profileCompletion < 100 && (
                <Link href="/doctor/settings/profile" className="block">
                  <Button 
                    className="w-full bg-white hover:bg-emerald-50 text-emerald-600 font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                    size="default"
                  >
                    Complete Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}

              {/* Profile Completion Success */}
              {profileCompletion === 100 && (
                <div className="flex items-center gap-2 justify-center py-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Your profile is complete!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Issues Section - Enhanced */}
        {issues.length > 0 && (
          <Card className="border-0 shadow-lg lg:shadow-xl bg-white dark:bg-slate-900 mx-0 rounded-none sm:rounded-2xl sm:mx-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    Action Required
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {issues.length} item{issues.length > 1 ? 's' : ''} need{issues.length === 1 ? 's' : ''} attention
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {issues.map((issue, index) => (
                  <li key={index}>
                    <Link
                      href={issue.href}
                      className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all active:scale-[0.98] border border-transparent hover:border-red-200 dark:hover:border-red-900"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                        <issue.icon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {issue.title}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {issue.description}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Quick Settings - Material Design List */}
        <Card className="border-0 shadow-lg lg:shadow-xl bg-white dark:bg-slate-900 mx-0 rounded-none sm:rounded-2xl sm:mx-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Quick Settings
              </h3>
            </div>

            <div className="space-y-1">
              <QuickSettingItem
                icon={Bell}
                label="Notifications"
                description="Manage alerts and reminders"
                href="/doctor/settings/notifications"
              />
              <QuickSettingItem
                icon={Calendar}
                label="Availability"
                description="Set working hours"
                href="/doctor/settings/availability"
              />
              <QuickSettingItem
                icon={Shield}
                label="Privacy & Security"
                description="Control your data"
                href="/doctor/settings/security"
              />
              <QuickSettingItem
                icon={CreditCard}
                label="Billing"
                description="Payment methods & invoices"
                href="/doctor/settings/billing"
              />
            </div>
          </CardContent>
        </Card>

        {/* Hospital Affiliations */}
        {affiliations && affiliations.length > 0 && (
          <Card className="border-0 shadow-lg lg:shadow-xl bg-white dark:bg-slate-900 mx-0 rounded-none sm:rounded-2xl sm:mx-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                      Hospitals
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {affiliations.filter(a => a.status === 'APPROVED').length} active affiliation{affiliations.filter(a => a.status === 'APPROVED').length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Link href="/doctor/affiliations">
                  <Button variant="ghost" size="sm" className="hover:bg-purple-50 dark:hover:bg-purple-950">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <ul className="space-y-2">
                {affiliations.slice(0, 3).map((affiliation) => (
                  <li key={affiliation._id}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {affiliation.hospitalId?.name || 'Hospital'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          {affiliation.hospitalId?.city || 'Location'}
                        </p>
                      </div>
                      <Badge
                        className={
                          affiliation.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }
                      >
                        {affiliation.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Account Information */}
        <Card className="border-0 shadow-lg lg:shadow-xl bg-white dark:bg-slate-900 mx-0 rounded-none sm:rounded-2xl sm:mx-0">
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 mb-4">
              Account Information
            </h3>
            <div className="space-y-3">
              <InfoRow label="Name" value={`Dr. ${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim()} />
              <InfoRow label="Email" value={doctor?.email} />
              <InfoRow label="Phone" value={doctor?.phone || 'Not set'} />
              <InfoRow label="Specialization" value={doctor?.specialization || 'Not set'} />
              <InfoRow label="Experience" value={doctor?.experience ? `${doctor.experience} years` : 'Not set'} />
              <InfoRow label="Registration No." value={doctor?.registrationNumber || 'Not set'} />
              <InfoRow 
                label="Member Since" 
                value={doctor?.createdAt ? new Date(doctor.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'} 
              />
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link href="/doctor/settings/profile" className="block">
                <Button variant="outline" className="w-full active:scale-[0.98] transition-transform">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

// ==================== Helper Components ====================

function StatBadge({ label, value, icon: Icon }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 text-center border border-white/20">
      <div className="flex flex-col items-center gap-1">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 mb-1" />
        <p className="text-lg sm:text-xl font-bold leading-none">{value}</p>
        <p className="text-[10px] sm:text-xs text-emerald-100 uppercase tracking-wide font-medium leading-none">
          {label}
        </p>
      </div>
    </div>
  )
}

function QuickSettingItem({ icon: Icon, label, description, href, badge }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
    >
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            {label}
          </p>
          {badge && (
            <Badge variant="secondary" className="h-5 px-2 text-[10px]">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
          {description}
        </p>
      </div>
      <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
    </Link>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate ml-4 max-w-[55%] sm:max-w-[60%] text-right">
        {value || 'Not set'}
      </span>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:bg-transparent">
      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 pb-6">
        <Skeleton className="h-56 sm:h-64 w-full rounded-none sm:rounded-2xl" />
        <Skeleton className="h-48 sm:h-56 w-full rounded-none sm:rounded-2xl" />
        <Skeleton className="h-40 sm:h-48 w-full rounded-none sm:rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-none sm:rounded-2xl" />
      </div>
    </div>
  )
}

// ==================== Helper Functions ====================

/**
 * Calculate profile completion percentage
 * Uses isProfileComplete flag from API or calculates based on required fields
 */
function calculateProfileCompletion(doctor) {
  if (!doctor) return 0
  
  // Define what fields are required for profile completion
  const requiredFields = {
    // Basic Info (essential)
    firstName: !!doctor?.firstName,
    lastName: !!doctor?.lastName,
    email: !!doctor?.email,
    
    // Contact
    phone: !!doctor?.phone,
    
    // Professional Info
    specialization: !!doctor?.specialization,
    registrationNumber: !!doctor?.registrationNumber,
    experience: !!(doctor?.experience && doctor.experience > 0),
    
    // Profile Details
    bio: !!(doctor?.bio && doctor.bio.length >= 50),
    
    // Additional Info
    qualifications: !!(Array.isArray(doctor?.qualifications) && doctor.qualifications.length > 0),
    languages: !!(Array.isArray(doctor?.languages) && doctor.languages.length > 0),
  }
  
  const fieldValues = Object.values(requiredFields)
  const completed = fieldValues.filter(Boolean).length
  const total = fieldValues.length
  
  const percentage = Math.round((completed / total) * 100)
  
  // Debug log (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Profile Completion:', {
      completed: `${completed}/${total}`,
      percentage: `${percentage}%`,
      fields: requiredFields
    })
  }
  
  return percentage
}

/**
 * Get list of profile issues that need attention
 */
function getProfileIssues(doctor, affiliations) {
  const issues = []
  
  // Check specialization
  if (!doctor?.specialization) {
    issues.push({
      icon: Stethoscope,
      title: 'Add Specialization',
      description: 'Help patients find you by specialty',
      href: '/doctor/settings/profile'
    })
  }
  
  // Check registration number
  if (!doctor?.registrationNumber) {
    issues.push({
      icon: Shield,
      title: 'Verify Credentials',
      description: 'Add your medical registration number',
      href: '/doctor/settings/profile'
    })
  }
  
  // Check bio (must be at least 50 characters)
  if (!doctor?.bio || doctor?.bio.length < 50) {
    issues.push({
      icon: FileText,
      title: 'Complete Bio',
      description: 'Write a detailed professional bio (min 50 characters)',
      href: '/doctor/settings/profile'
    })
  }

  // Check phone
  if (!doctor?.phone) {
    issues.push({
      icon: User,
      title: 'Add Contact Number',
      description: 'Add your phone number for communication',
      href: '/doctor/settings/profile'
    })
  }

  // Check experience
  if (!doctor?.experience || doctor?.experience === 0) {
    issues.push({
      icon: Clock,
      title: 'Add Experience',
      description: 'Specify your years of practice',
      href: '/doctor/settings/profile'
    })
  }

  // Check qualifications
  if (!Array.isArray(doctor?.qualifications) || doctor?.qualifications.length === 0) {
    issues.push({
      icon: FileText,
      title: 'Add Qualifications',
      description: 'List your degrees and certifications',
      href: '/doctor/settings/profile'
    })
  }

  // Check languages
  if (!Array.isArray(doctor?.languages) || doctor?.languages.length === 0) {
    issues.push({
      icon: User,
      title: 'Add Languages',
      description: 'Specify languages you can communicate in',
      href: '/doctor/settings/profile'
    })
  }

  // Check hospital affiliations
  if (!affiliations || affiliations.length === 0) {
    issues.push({
      icon: Building2,
      title: 'Join a Hospital',
      description: 'Connect with hospitals to start accepting patients',
      href: '/doctor/affiliations'
    })
  }
  
  return issues
}
