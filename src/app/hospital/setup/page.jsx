'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Phone, MapPin, Loader2, AlertCircle, CheckCircle2, Navigation, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { indianStates, getCitiesByState } from '@/lib/indianStates'

export default function HospitalSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [errors, setErrors] = useState({})
  
  // State/City dropdowns
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false)
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [stateSearch, setStateSearch] = useState('')
  const [citySearch, setCitySearch] = useState('')
  
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
    latitude: '',
    longitude: '',
  })

  useEffect(() => {
    checkSetupStatus()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.state-dropdown-container')) {
        setStateDropdownOpen(false)
      }
      if (!e.target.closest('.city-dropdown-container')) {
        setCityDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkSetupStatus = async () => {
    try {
      const res = await fetch('/api/hospital/setup')
      const data = await res.json()

      if (res.ok && data.hasHospital) {
        toast.success('Hospital already set up!')
        router.push('/hospital')
        return
      }
    } catch (error) {
      console.error('Status check error:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        }))
        toast.success('📍 Location captured successfully!')
        setGettingLocation(false)
      },
      (error) => {
        console.error('Location error:', error)
        toast.error('Could not get your location. Please enter manually.')
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Hospital name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Hospital name must be at least 3 characters'
    }

    const cleanPhone = formData.phone.replace(/\D/g, '')
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode.replace(/\D/g, ''))) {
      newErrors.pincode = 'Pincode must be 6 digits'
    }

    if (formData.latitude && (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Invalid latitude (-90 to 90)'
    }

    if (formData.longitude && (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Invalid longitude (-180 to 180)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        registrationNumber: formData.registrationNumber.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        street: formData.street.trim(),
        pincode: formData.pincode.trim(),
        description: formData.description.trim(),
      }

      // Add coordinates if both are provided
      if (formData.latitude && formData.longitude) {
        payload.coordinates = {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        }
      }

      console.log('📤 Submitting payload:', payload)

      const res = await fetch('/api/hospital/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Hospital created successfully!', {
          duration: 4000,
          icon: '🏥',
        })
        
        setTimeout(() => {
          router.push(data.redirect || '/hospital')
          router.refresh()
        }, 500)
      } else {
        console.error('❌ API Error:', data)
        if (res.status === 409) {
          toast.error('A hospital with this information already exists')
        } else if (res.status === 400 && data.fields) {
          const serverErrors = {}
          data.fields.forEach(field => {
            serverErrors[field] = data.details
          })
          setErrors(serverErrors)
          toast.error(data.details || 'Validation failed')
        } else if (res.status === 404) {
          toast.error('Admin profile not found. Please sign up again.')
          setTimeout(() => router.push('/sign-up'), 2000)
        } else {
          toast.error(data.error || 'Failed to create hospital')
        }
        setLoading(false)
      }
    } catch (err) {
      console.error('Setup error:', err)
      toast.error('Network error. Please check your connection.')
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleStateSelect = (stateName) => {
    handleChange('state', stateName)
    handleChange('city', '')
    setStateDropdownOpen(false)
    setStateSearch('')
  }

  const handleCitySelect = (cityName) => {
    handleChange('city', cityName)
    setCityDropdownOpen(false)
    setCitySearch('')
  }

  const filteredStates = indianStates.filter(state => 
    state.name.toLowerCase().includes(stateSearch.toLowerCase())
  )
  
  const availableCities = formData.state ? getCitiesByState(formData.state) : []
  const filteredCities = availableCities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  )

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400 text-lg">Checking setup status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-5 shadow-lg">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-3">
            Welcome to Qlinic
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Let's set up your hospital profile to start managing appointments and patient care
          </p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
            <CardTitle className="text-3xl">Hospital Information</CardTitle>
            <CardDescription className="text-base">
              Fill in your hospital details. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Basic Information */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Basic Information
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Label htmlFor="name" className="text-base">
                      Hospital Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g., City General Hospital"
                      className={`h-11 text-base ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                      disabled={loading}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="type" className="text-base">
                      Hospital Type <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      className="w-full h-11 px-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="Private">Private Hospital</option>
                      <option value="Government">Government Hospital</option>
                      <option value="Trust">Trust Hospital</option>
                      <option value="Corporate">Corporate Hospital</option>
                      <option value="Multi-Specialty">Multi-Specialty Hospital</option>
                      <option value="Super-Specialty">Super-Specialty Hospital</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="registrationNumber" className="text-base">
                      Registration Number
                    </Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => handleChange('registrationNumber', e.target.value)}
                      placeholder="e.g., MH-12345678"
                      className="h-11 text-base"
                      disabled={loading}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Medical Council/Health Department registration
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description" className="text-base">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Tell patients about your hospital's services, facilities, and specialties..."
                      rows={4}
                      className="text-base resize-none"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="phone" className="text-base">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="9876543210"
                      className={`h-11 text-base ${errors.phone ? 'border-red-500' : ''}`}
                      maxLength={10}
                      disabled={loading}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-base">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="contact@hospital.com"
                      className={`h-11 text-base ${errors.email ? 'border-red-500' : ''}`}
                      disabled={loading}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Address & Location
                  </h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="street" className="text-base">
                      Street Address
                    </Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleChange('street', e.target.value)}
                      placeholder="123 Main Street, Near City Center"
                      className="h-11 text-base"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* State Dropdown */}
                    <div className="relative state-dropdown-container">
                      <Label htmlFor="state" className="text-base">
                        State <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="state"
                          type="text"
                          value={stateDropdownOpen ? stateSearch : formData.state}
                          onChange={(e) => {
                            setStateSearch(e.target.value)
                            setStateDropdownOpen(true)
                          }}
                          onFocus={() => setStateDropdownOpen(true)}
                          placeholder="Search or select state"
                          className={`h-11 text-base pr-10 ${errors.state ? 'border-red-500' : ''}`}
                          disabled={loading}
                          autoComplete="off"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      {errors.state && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.state}
                        </p>
                      )}
                      
                      {stateDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                          {filteredStates.length > 0 ? (
                            filteredStates.map((state) => (
                              <button
                                key={state.name}
                                type="button"
                                onClick={() => handleStateSelect(state.name)}
                                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 text-base transition-colors"
                              >
                                {state.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-slate-500 text-sm">No states found</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* City Dropdown */}
                    <div className="relative city-dropdown-container">
                      <Label htmlFor="city" className="text-base">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="city"
                          type="text"
                          value={cityDropdownOpen ? citySearch : formData.city}
                          onChange={(e) => {
                            setCitySearch(e.target.value)
                            setCityDropdownOpen(true)
                          }}
                          onFocus={() => {
                            if (formData.state) setCityDropdownOpen(true)
                          }}
                          placeholder={formData.state ? "Search or select city" : "Select state first"}
                          className={`h-11 text-base pr-10 ${errors.city ? 'border-red-500' : ''}`}
                          disabled={loading || !formData.state}
                          autoComplete="off"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      {errors.city && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.city}
                        </p>
                      )}
                      
                      {cityDropdownOpen && formData.state && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                          {filteredCities.length > 0 ? (
                            filteredCities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => handleCitySelect(city)}
                                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 text-base transition-colors"
                              >
                                {city}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-slate-500 text-sm">No cities found</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="pincode" className="text-base">
                        Pincode
                      </Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) => handleChange('pincode', e.target.value)}
                        placeholder="800001"
                        maxLength={6}
                        className={`h-11 text-base ${errors.pincode ? 'border-red-500' : ''}`}
                        disabled={loading}
                      />
                      {errors.pincode && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.pincode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* GPS Coordinates */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label className="text-base font-medium">GPS Coordinates (Optional)</Label>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Help patients find you on maps
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation || loading}
                        className="h-10"
                      >
                        {gettingLocation ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Getting...
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4 mr-2" />
                            Auto-detect
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude" className="text-sm">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          value={formData.latitude}
                          onChange={(e) => handleChange('latitude', e.target.value)}
                          placeholder="25.5941"
                          className={`h-10 ${errors.latitude ? 'border-red-500' : ''}`}
                          disabled={loading}
                        />
                        {errors.latitude && (
                          <p className="text-xs text-red-600 mt-1">{errors.latitude}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="longitude" className="text-sm">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) => handleChange('longitude', e.target.value)}
                          placeholder="85.1376"
                          className={`h-10 ${errors.longitude ? 'border-red-500' : ''}`}
                          disabled={loading}
                        />
                        {errors.longitude && (
                          <p className="text-xs text-red-600 mt-1">{errors.longitude}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-lg font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Your Hospital Profile...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Create Hospital Profile
                    </>
                  )}
                </Button>
                
                <p className="text-sm text-slate-500 text-center mt-4">
                  By creating a hospital profile, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
          Need help? Contact support at{' '}
          <a href="mailto:support@qlinic.com" className="text-blue-600 hover:underline font-medium">
            support@qlinic.com
          </a>
        </p>
      </div>
    </div>
  )
}
