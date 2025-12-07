// src/components/doctor/DoctorDashboard.jsx
'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Stethoscope, 
  Users, 
  Building2, 
  AlertCircle,
  CheckCircle,
  Clock,
  UserCircle
} from 'lucide-react'
import ProfileCompletionForm from './ProfileCompletionForm'
import HospitalAffiliations from './HospitalAffiliations'
import PatientsList from './PatientsList'

export default function DoctorDashboard() {
  const [profile, setProfile] = useState(null)
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/doctor/profile')
      const data = await response.json()
      
      if (data.user) {
        setProfile(data.user)
        checkProfileCompletion(data.user)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const checkProfileCompletion = (user) => {
    const required = [
      user.doctorProfile?.specialization,
      user.doctorProfile?.qualification,
      user.doctorProfile?.licenseNumber,
      user.doctorProfile?.experience !== undefined
    ]
    setIsProfileComplete(required.every(Boolean))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isProfileComplete) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">Complete Your Profile</CardTitle>
                <p className="text-sm text-orange-700 mt-1">
                  Please complete your professional profile to start managing appointments
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProfileCompletionForm profile={profile} onComplete={fetchProfile} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-8 h-8 text-primary" />
            Dr. {profile?.firstName} {profile?.lastName}
          </h1>
          <p className="text-slate-500 mt-1">
            {profile?.doctorProfile?.specialization} • {profile?.doctorProfile?.experience} years experience
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Profile Complete
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="affiliations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="affiliations" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Hospitals
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Patients
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="w-4 h-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="affiliations" className="mt-6">
          <HospitalAffiliations doctorId={profile?._id} />
        </TabsContent>

        <TabsContent value="patients" className="mt-6">
          <PatientsList doctorId={profile?._id} />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileCompletionForm profile={profile} onComplete={fetchProfile} isEdit />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
