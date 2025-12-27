// src/components/doctor/ProfileCompletion.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import toast from 'react-hot-toast'
import { 
  Upload, CheckCircle, AlertCircle, Loader2, Edit2, 
  User, Phone, Award, Briefcase, DollarSign, Languages,
  Mail, X, Camera, Save, Copy, Check, Hash
} from 'lucide-react'

const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'General Medicine', 'Neurology', 'Oncology', 'Orthopedics',
  'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery', 'Urology',
  'Ophthalmology', 'ENT', 'Anesthesiology', 'Pathology'
]

export default function ProfileCompletion() {
  const [state, setState] = useState({
    isLoading: false,
    isFetching: true,
    isEditing: false,
    profileComplete: false
  })

  const [profilePhoto, setProfilePhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [existingPhotoUrl, setExistingPhotoUrl] = useState('')
  const [shortId, setShortId] = useState('')
  const [idCopied, setIdCopied] = useState(false)

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    experience: '',
    qualification: '',
    registrationNumber: '',
    about: '',
    consultationFee: '',
    languages: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setState(prev => ({ ...prev, isFetching: true }))

    try {
      const response = await fetch('/api/doctor/profile')
      const data = await response.json()

      if (data.success && data.doctor) {
        const p = data.doctor

        setProfile({
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          email: p.email || '',
          phone: p.phoneNumber || '',
          specialization: p.doctorProfile?.specialization || '',
          experience: p.doctorProfile?.experience || '',
          qualification: p.doctorProfile?.qualification || '',
          registrationNumber: p.doctorProfile?.licenseNumber || '',
          about: p.doctorProfile?.about || '',
          consultationFee: p.doctorProfile?.consultationFee || '',
          languages: Array.isArray(p.doctorProfile?.languages) 
            ? p.doctorProfile.languages.join(', ') 
            : ''
        })

        setShortId(p.shortId || p._id?.toString().slice(-8).toUpperCase())

        setState(prev => ({
          ...prev,
          profileComplete: p.isProfileComplete || false,
          isEditing: !p.isProfileComplete
        }))

        setExistingPhotoUrl(p.profileImage || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setState(prev => ({ ...prev, isFetching: false }))
    }
  }

  const copyShortId = async () => {
    if (!shortId) return

    try {
      await navigator.clipboard.writeText(shortId)
      setIdCopied(true)
      toast.success('Doctor ID copied to clipboard')
      setTimeout(() => setIdCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy ID')
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo size must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setProfilePhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    toast.success('✓ Photo selected')
  }

  const removePhoto = () => {
    setProfilePhoto(null)
    setPhotoPreview('')
    const input = document.getElementById('photo-upload')
    if (input) input.value = ''
  }

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const required = [
      'firstName', 'lastName', 'phone', 'specialization', 
      'experience', 'qualification', 'registrationNumber', 
      'about', 'consultationFee', 'languages'
    ]

    for (const field of required) {
      if (!profile[field]?.toString().trim()) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
        return false
      }
    }

    if (parseInt(profile.experience) < 0) {
      toast.error('Experience must be a positive number')
      return false
    }

    if (parseFloat(profile.consultationFee) <= 0) {
      toast.error('Consultation fee must be greater than 0')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setState(prev => ({ ...prev, isLoading: true }))
    const loadingToast = toast.loading('Updating profile...')

    try {
      const formData = new FormData()

      Object.entries(profile).forEach(([key, value]) => {
        formData.append(key, value.toString())
      })

      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto)
      }

      const response = await fetch('/api/doctor/profile', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Profile updated successfully!', { id: loadingToast })
        setState(prev => ({ 
          ...prev, 
          profileComplete: true, 
          isEditing: false 
        }))
        setProfilePhoto(null)
        setPhotoPreview('')
        await fetchProfile()
      } else {
        toast.error(data.error || 'Failed to update profile', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const cancelEdit = () => {
    setState(prev => ({ ...prev, isEditing: false }))
    setProfilePhoto(null)
    setPhotoPreview('')
    fetchProfile()
  }

  // Loading State
  if (state.isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading profile...</p>
      </div>
    )
  }

  // View Mode - Profile Display
  if (state.profileComplete && !state.isEditing) {
    const displayPhoto = existingPhotoUrl
    const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Success Banner */}
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-lg">
                  Profile Complete
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  You can now accept hospital affiliations and appointments
                </p>
              </div>
            </div>
            <Button
              onClick={() => setState(prev => ({ ...prev, isEditing: true }))}
              variant="outline"
              className="font-semibold border-emerald-600 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Doctor ID Card */}
        {shortId && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Your Doctor ID
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold font-mono tracking-wider">{shortId}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyShortId}
                    >
                      {idCopied ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy ID
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this ID with hospitals to receive invitations
                  </p>
                </div>
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Hash className="h-10 w-10 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Header Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Profile Photo */}
              <div className="relative">
                <Avatar className="w-40 h-40 border-4 border-emerald-500">
                  <AvatarImage src={displayPhoto} alt={profile.firstName} />
                  <AvatarFallback className="text-3xl font-bold bg-emerald-100 text-emerald-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-3 shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Dr. {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-xl text-emerald-600 dark:text-emerald-400 font-semibold mb-4">
                  {profile.specialization}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {profile.experience} years experience
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    <Award className="w-3 h-3 mr-1" />
                    {profile.qualification}
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    <DollarSign className="w-3 h-3 mr-1" />
                    ₹{profile.consultationFee}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span>{profile.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Languages className="w-4 h-4" />
                    <span>{profile.languages}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Award className="w-4 h-4" />
                    <span>Reg: {profile.registrationNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {profile.about && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    About
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {profile.about}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Edit Mode - Form
  const displayPhoto = photoPreview || existingPhotoUrl
  const initials = profile.firstName && profile.lastName
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
    : 'DR'

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                {state.profileComplete ? 'Edit Profile' : 'Complete Your Profile'}
              </CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {state.profileComplete 
                  ? 'Update your professional information' 
                  : 'Fill in your details to start accepting appointments'}
              </p>
            </div>
            {state.profileComplete && (
              <Button
                type="button"
                variant="ghost"
                onClick={cancelEdit}
                disabled={state.isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          {!state.profileComplete && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <p className="text-sm text-orange-900 dark:text-orange-100">
                Complete your profile to unlock all features and start accepting patients
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Profile Photo Section */}
            <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-slate-200 dark:border-slate-700">
                  <AvatarImage src={displayPhoto} alt="Profile" />
                  <AvatarFallback className="text-2xl font-bold bg-emerald-100 text-emerald-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {(photoPreview || existingPhotoUrl) && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                     onClick={() => document.getElementById('photo-upload').click()}>
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="text-center">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('photo-upload').click()}
                  className="font-semibold"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {displayPhoto ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                  JPG, PNG or GIF • Max 5MB • Recommended: 400x400px
                </p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    required
                    value={profile.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    required
                    value={profile.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 9876543210"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languages">
                    Languages Spoken <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="languages"
                    required
                    value={profile.languages}
                    onChange={(e) => handleInputChange('languages', e.target.value)}
                    placeholder="English, Hindi, Tamil"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                Professional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">
                    Specialization <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={profile.specialization} 
                    onValueChange={(v) => handleInputChange('specialization', v)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALIZATIONS.map(spec => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">
                    Experience (Years) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    required
                    value={profile.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    placeholder="5"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">
                    Qualification <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="qualification"
                    required
                    value={profile.qualification}
                    onChange={(e) => handleInputChange('qualification', e.target.value)}
                    placeholder="MBBS, MD (Cardiology)"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">
                    Medical Registration No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="registrationNumber"
                    required
                    value={profile.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    placeholder="MCI-12345"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="consultationFee">
                    Consultation Fee (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="consultationFee"
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={profile.consultationFee}
                    onChange={(e) => handleInputChange('consultationFee', e.target.value)}
                    placeholder="500"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* About Section */}
            <div className="space-y-2">
              <Label htmlFor="about">
                About / Professional Bio <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="about"
                required
                rows={6}
                value={profile.about}
                onChange={(e) => handleInputChange('about', e.target.value)}
                placeholder="Write a brief description about your practice, areas of expertise, approach to patient care, and any special interests or achievements..."
                className="resize-none"
              />
              <p className="text-xs text-slate-500">
                {profile.about.length} characters • Minimum 50 characters recommended
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700" 
                disabled={state.isLoading}
              >
                {state.isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {state.profileComplete ? 'Update Profile' : 'Complete Profile'}
                  </>
                )}
              </Button>

              {state.profileComplete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={state.isLoading}
                  className="h-12 px-8 text-base font-semibold"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
