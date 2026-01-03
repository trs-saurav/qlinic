'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { 
  User, MapPin, Save, Loader2, Camera
} from 'lucide-react'

// ✅ 1. Import the Context Hook
import { useUser } from '@/context/UserContext'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

import { indianStates, getCitiesByState } from '@/lib/indianStates'

export default function UserProfilePage() {
  // ✅ 2. Destructure data & methods from Context
  const { user, loading: contextLoading, updateProfile } = useUser()
  
  const [isUploading, setIsUploading] = useState(false)
  const [availableCities, setAvailableCities] = useState([])
  const [previewImage, setPreviewImage] = useState('')

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      profileImage: '',
      address: {
        street: '',
        state: '',
        city: '',
        pincode: ''
      }
    }
  })

  // Watch fields
  const selectedState = watch('address.state')
  const firstName = watch('firstName')
  const lastName = watch('lastName')

  // Update cities when state changes
  useEffect(() => {
    if (selectedState) {
      setAvailableCities(getCitiesByState(selectedState))
    } else {
      setAvailableCities([])
    }
  }, [selectedState])

  // ✅ 3. Populate Form from Context Data (Not Fetch)
  useEffect(() => {
    if (user) {
      console.log('Populating form with user data:', user) // Debug log
      
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        profileImage: user.profileImage || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.patientProfile?.gender || '',
        bloodGroup: user.patientProfile?.bloodGroup || '',
        address: {
            street: user.patientProfile?.address?.street || '',
            state: user.patientProfile?.address?.state || '',
            city: user.patientProfile?.address?.city || '',
            pincode: user.patientProfile?.address?.pincode || ''
        }
      })
      
      setPreviewImage(user.profileImage || '')
      
      // Handle dependent dropdown (City)
      if (user.patientProfile?.address?.state) {
        setAvailableCities(getCitiesByState(user.patientProfile.address.state))
      }
    }
  }, [user, reset])

  // Image Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large (max 5MB)")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) 

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      
      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      const imageUrl = data.secure_url
      
      setValue('profileImage', imageUrl)
      setPreviewImage(imageUrl)
      toast.success("Image uploaded")
    } catch (error) {
      console.error("Upload Error:", error)
      toast.error("Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  // ✅ 4. Submit using Context Method
  const onSubmit = async (data) => {
    // Call context function instead of manual fetch
    const result = await updateProfile(data)
    
    // Result handling is done inside updateProfile (toast success/error)
    if (!result.success) {
        console.error(result.error)
    }
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Profile</h2>
          <p className="text-sm text-slate-500">Manage your personal information</p>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={isUploading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Profile Photo Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group shrink-0">
                <Avatar className="w-24 h-24 border-4 border-slate-100 dark:border-slate-800 shadow-md">
                  <AvatarImage src={previewImage} objectFit="cover" />
                  <AvatarFallback className="text-2xl bg-blue-100 text-blue-700 font-bold">
                    {firstName?.[0]}{lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="image-upload" 
                  className={`absolute bottom-0 right-0 p-2 rounded-full text-white shadow-lg cursor-pointer transition-colors ${
                    isUploading ? 'bg-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </label>
                <input 
                  id="image-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload} 
                  disabled={isUploading}
                />
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="font-semibold text-lg">{firstName} {lastName}</h3>
                <p className="text-sm text-slate-500">{watch('email')}</p>
                <p className="text-xs text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full inline-block">
                  Patient Account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
           <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold pb-2 border-b border-slate-100 dark:border-slate-800">
                <User className="w-4 h-4 text-blue-500" /> Personal Details
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>First Name <span className="text-red-500">*</span></Label>
                  <Input {...register('firstName', { required: true })} placeholder="John" />
                  {errors.firstName && <span className="text-xs text-red-500">Required</span>}
                </div>
                
                <div className="space-y-2">
                  <Label>Last Name <span className="text-slate-400 text-xs">(Optional)</span></Label>
                  <Input {...register('lastName')} placeholder="Doe" />
                </div>
                
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input {...register('email')} disabled className="bg-slate-50 dark:bg-slate-900/50 text-slate-500" />
                </div>
                
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input {...register('phoneNumber')} placeholder="+91 98765 43210" />
                </div>
                
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" {...register('dateOfBirth')} />
                </div>
                
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                   <Controller
                    name="bloodGroup"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                            <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
           </CardContent>
        </Card>

        {/* Address */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
           <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold pb-2 border-b border-slate-100 dark:border-slate-800">
                <MapPin className="w-4 h-4 text-blue-500" /> Address
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label>Street Address</Label>
                  <Input {...register('address.street')} placeholder="123 Main St, Apt 4B" />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Controller
                    name="address.state"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        onValueChange={(val) => {
                            field.onChange(val);
                            setValue('address.city', ''); 
                        }} 
                        value={field.value || ''}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {indianStates.map((state) => (
                            <SelectItem key={state.name} value={state.name}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Controller
                    name="address.city"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedState}>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedState ? "Select City" : "Select State First"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input {...register('address.pincode')} placeholder="800001" maxLength={6} />
                </div>
              </div>
           </CardContent>
        </Card>
      </form>
    </div>
  )
}
