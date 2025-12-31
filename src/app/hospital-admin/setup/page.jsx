'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Phone, MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HospitalSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    type: 'Private',
    registrationNumber: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    street: '',
    pincode: '',
    description: '',
  })

  // ✅ Client-side validation
  const validateForm = () => {
    const newErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Hospital name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Hospital name must be at least 3 characters'
    }

    // Phone validation
    const cleanPhone = formData.phone.replace(/\D/g, '')
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number'
    }

    // Email validation (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address'
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    // State validation
    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    // Pincode validation (optional but if provided should be valid)
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode.replace(/\D/g, ''))) {
      newErrors.pincode = 'Pincode must be 6 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // ✅ Validate before submission
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/hospital/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Hospital created successfully!')
        
        // ✅ Use window.location for reliable redirect after data mutation
        setTimeout(() => {
          window.location.href = data.redirect || '/hospital-admin'
        }, 500)
      } else {
        // ✅ Handle server-side validation errors
        if (data.fields && data.details) {
          toast.error(data.details)
        } else {
          toast.error(data.error || 'Failed to create hospital')
        }
        setLoading(false)
      }
    } catch (err) {
      console.error('Setup error:', err)
      toast.error('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  // Indian states for dropdown
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to Qlinic
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Let's set up your hospital profile to get started
          </p>
        </div>

        {/* Setup Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Hospital Information</CardTitle>
            <CardDescription>
              Enter your hospital details below. You can update these later in settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Basic Information
                </h3>
                
                <div>
                  <Label htmlFor="name">
                    Hospital Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="City General Hospital"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">
                    Hospital Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Government">Government Hospital</SelectItem>
                      <SelectItem value="Private">Private Hospital</SelectItem>
                      <SelectItem value="Trust">Trust Hospital</SelectItem>
                      <SelectItem value="Corporate">Corporate Hospital</SelectItem>
                      <SelectItem value="Multi-Specialty">Multi-Specialty Hospital</SelectItem>
                      <SelectItem value="Super-Specialty">Super-Specialty Hospital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => handleChange('registrationNumber', e.target.value)}
                    placeholder="e.g., MH-12345678"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Medical Council/Health Department registration number
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Tell patients about your hospital's services, facilities, and specialties..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="9876543210"
                      className={errors.phone ? 'border-red-500' : ''}
                      maxLength={10}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="contact@hospital.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address
                </h3>

                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleChange('street', e.target.value)}
                    placeholder="123 Main Street, Near City Center"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Patna"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => handleChange('state', value)}
                    >
                      <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.state}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    placeholder="800001"
                    maxLength={6}
                    className={errors.pincode ? 'border-red-500' : ''}
                  />
                  {errors.pincode && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.pincode}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Hospital...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Create Hospital Profile
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-slate-500 text-center">
                By creating a hospital profile, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Need help? Contact support at{' '}
          <a href="mailto:support@qlinic.com" className="text-blue-600 hover:underline">
            support@qlinic.com
          </a>
        </p>
      </div>
    </div>
  )
}
