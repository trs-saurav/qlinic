// src/components/hospital/HospitalProfileCompletion.jsx
'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Building2, CheckCircle, X } from 'lucide-react'

const HOSPITAL_TYPES = ['Government', 'Private', 'Trust', 'Corporate']

const COMMON_FACILITIES = [
  'ICU', 'Emergency', 'OPD', 'Pharmacy', 'Laboratory', 'Radiology',
  'Operation Theater', 'Blood Bank', 'Ambulance', 'Cafeteria', 
  'Parking', 'Mortuary', 'Dialysis'
]

const COMMON_DEPARTMENTS = [
  'Cardiology', 'Dermatology', 'Emergency Medicine', 'Endocrinology',
  'Gastroenterology', 'General Surgery', 'Neurology', 'Obstetrics & Gynecology',
  'Oncology', 'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Urology'
]

export default function HospitalProfileCompletion({ hospital, onComplete }) {
  const isEdit = !!hospital

  const [formData, setFormData] = useState({
    name: hospital?.name || '',
    registrationNumber: hospital?.registrationNumber || '',
    type: hospital?.type || 'Private',
    street: hospital?.address?.street || '',
    city: hospital?.address?.city || '',
    state: hospital?.address?.state || '',
    pincode: hospital?.address?.pincode || '',
    phone: hospital?.contactDetails?.phone || '',
    email: hospital?.contactDetails?.email || '',
    website: hospital?.contactDetails?.website || '',
    emergencyNumber: hospital?.contactDetails?.emergencyNumber || '',
    totalBeds: hospital?.totalBeds || '',
    established: hospital?.established ? new Date(hospital.established).toISOString().split('T')[0] : '',
    isOpen24x7: hospital?.operatingHours?.isOpen24x7 || false,
    openTime: hospital?.operatingHours?.openTime || '09:00',
    closeTime: hospital?.operatingHours?.closeTime || '18:00',
  })

  const [facilities, setFacilities] = useState(hospital?.facilities || [])
  const [departments, setDepartments] = useState(hospital?.departments?.map(d => d.name) || [])
  const [isLoading, setIsLoading] = useState(false)

  const toggleFacility = (facility) => {
    setFacilities(prev => 
      prev.includes(facility) 
        ? prev.filter(f => f !== facility)
        : [...prev, facility]
    )
  }

  const toggleDepartment = (dept) => {
    setDepartments(prev => 
      prev.includes(dept) 
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const loadingToast = toast.loading(isEdit ? 'Updating hospital...' : 'Creating hospital profile...')

    try {
      const payload = {
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        type: formData.type,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India'
        },
        contactDetails: {
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          emergencyNumber: formData.emergencyNumber
        },
        totalBeds: parseInt(formData.totalBeds) || 0,
        established: formData.established ? new Date(formData.established) : null,
        operatingHours: {
          isOpen24x7: formData.isOpen24x7,
          openTime: formData.isOpen24x7 ? null : formData.openTime,
          closeTime: formData.isOpen24x7 ? null : formData.closeTime
        },
        facilities,
        departments: departments.map(name => ({ name }))
      }

      const response = await fetch('/api/hospital/profile', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(isEdit ? '✅ Hospital updated!' : '✅ Hospital profile created!', {
          id: loadingToast
        })
        onComplete()
      } else {
        toast.error(data.error || 'Failed to save hospital', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error saving hospital:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="border-orange-200 bg-orange-50 mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <div>
              <CardTitle className="text-orange-900">
                {isEdit ? 'Update Hospital Profile' : 'Complete Hospital Profile'}
              </CardTitle>
              <p className="text-sm text-orange-700 mt-1">
                {isEdit 
                  ? 'Update your hospital information' 
                  : 'Please complete your hospital profile to access the reception desk'
                }
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">
                    Hospital Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., City General Hospital"
                  />
                </div>

                <div>
                  <Label htmlFor="regNumber">
                    Registration Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="regNumber"
                    required
                    value={formData.registrationNumber}
                    onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="e.g., HRN123456"
                  />
                </div>

                <div>
                  <Label htmlFor="type">
                    Hospital Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOSPITAL_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="totalBeds">Total Beds</Label>
                  <Input
                    id="totalBeds"
                    type="number"
                    min="0"
                    value={formData.totalBeds}
                    onChange={e => setFormData({ ...formData, totalBeds: e.target.value })}
                    placeholder="e.g., 200"
                  />
                </div>

                <div>
                  <Label htmlFor="established">Established Date</Label>
                  <Input
                    id="established"
                    type="date"
                    value={formData.established}
                    onChange={e => setFormData({ ...formData, established: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="street">
                    Street Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="street"
                    required
                    value={formData.street}
                    onChange={e => setFormData({ ...formData, street: e.target.value })}
                    placeholder="e.g., 123 Main Street"
                  />
                </div>

                <div>
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Mumbai"
                  />
                </div>

                <div>
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    required
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g., Maharashtra"
                  />
                </div>

                <div>
                  <Label htmlFor="pincode">
                    Pincode <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pincode"
                    required
                    value={formData.pincode}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="e.g., 400001"
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g., +91 9876543210"
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyNumber">Emergency Number</Label>
                  <Input
                    id="emergencyNumber"
                    type="tel"
                    value={formData.emergencyNumber}
                    onChange={e => setFormData({ ...formData, emergencyNumber: e.target.value })}
                    placeholder="e.g., +91 9876543210"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., contact@hospital.com"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                    placeholder="e.g., https://hospital.com"
                  />
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Operating Hours</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isOpen24x7}
                    onChange={e => setFormData({ ...formData, isOpen24x7: e.target.checked })}
                    className="w-5 h-5 accent-primary"
                  />
                  <div>
                    <span className="font-semibold text-slate-900">Open 24/7</span>
                    <p className="text-sm text-slate-500">Hospital operates round the clock</p>
                  </div>
                </label>

                {!formData.isOpen24x7 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="openTime">Opening Time</Label>
                      <Input
                        id="openTime"
                        type="time"
                        value={formData.openTime}
                        onChange={e => setFormData({ ...formData, openTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="closeTime">Closing Time</Label>
                      <Input
                        id="closeTime"
                        type="time"
                        value={formData.closeTime}
                        onChange={e => setFormData({ ...formData, closeTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Facilities */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Facilities Available</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {COMMON_FACILITIES.map(facility => (
                  <label
                    key={facility}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      facilities.includes(facility)
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={facilities.includes(facility)}
                      onChange={() => toggleFacility(facility)}
                      className="hidden"
                    />
                    {facilities.includes(facility) && <CheckCircle className="w-4 h-4" />}
                    <span className="text-sm">{facility}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500">Selected: {facilities.length} facilities</p>
            </div>

            {/* Departments */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Departments Available</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COMMON_DEPARTMENTS.map(dept => (
                  <label
                    key={dept}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      departments.includes(dept)
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={departments.includes(dept)}
                      onChange={() => toggleDepartment(dept)}
                      className="hidden"
                    />
                    {departments.includes(dept) && <CheckCircle className="w-4 h-4" />}
                    <span className="text-sm">{dept}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500">Selected: {departments.length} departments</p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" size="lg" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEdit ? 'Update Profile' : 'Complete Profile & Continue'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
