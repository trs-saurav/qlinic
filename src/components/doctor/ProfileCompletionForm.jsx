// src/components/doctor/ProfileCompletionForm.jsx
'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle } from 'lucide-react'

const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 
  'General Practice', 'Neurology', 'Obstetrics & Gynecology', 'Oncology',
  'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 
  'Pulmonology', 'Radiology', 'Surgery', 'Urology', 'Other'
]

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ProfileCompletionForm({ profile, onComplete, isEdit = false }) {
  const [formData, setFormData] = useState({
    specialization: profile?.doctorProfile?.specialization || '',
    qualification: profile?.doctorProfile?.qualification || '',
    experience: profile?.doctorProfile?.experience || '',
    licenseNumber: profile?.doctorProfile?.licenseNumber || '',
    consultationFee: profile?.doctorProfile?.consultationFee || '',
    availableDays: profile?.doctorProfile?.availableDays || []
  })
  const [isLoading, setIsLoading] = useState(false)

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const loadingToast = toast.loading(isEdit ? 'Updating profile...' : 'Completing profile...')

    try {
      const response = await fetch('/api/doctor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(isEdit ? '✅ Profile updated successfully' : '✅ Profile completed!', {
          id: loadingToast
        })
        onComplete()
      } else {
        toast.error('Failed to update profile', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specialization */}
        <div className="space-y-2">
          <Label htmlFor="specialization">
            Specialization <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.specialization} 
            onValueChange={v => setFormData({ ...formData, specialization: v })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select specialization" />
            </SelectTrigger>
            <SelectContent>
              {SPECIALIZATIONS.map(spec => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Qualification */}
        <div className="space-y-2">
          <Label htmlFor="qualification">
            Qualification <span className="text-red-500">*</span>
          </Label>
          <Input
            id="qualification"
            required
            value={formData.qualification}
            onChange={e => setFormData({ ...formData, qualification: e.target.value })}
            placeholder="e.g., MBBS, MD"
          />
        </div>

        {/* License Number */}
        <div className="space-y-2">
          <Label htmlFor="licenseNumber">
            Medical License Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="licenseNumber"
            required
            value={formData.licenseNumber}
            onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
            placeholder="e.g., MCI-12345"
          />
        </div>

        {/* Experience */}
        <div className="space-y-2">
          <Label htmlFor="experience">
            Years of Experience <span className="text-red-500">*</span>
          </Label>
          <Input
            id="experience"
            type="number"
            required
            min="0"
            max="60"
            value={formData.experience}
            onChange={e => setFormData({ ...formData, experience: e.target.value })}
            placeholder="e.g., 10"
          />
        </div>

        {/* Consultation Fee */}
        <div className="space-y-2">
          <Label htmlFor="consultationFee">
            Consultation Fee (₹) <span className="text-slate-400">(Optional)</span>
          </Label>
          <Input
            id="consultationFee"
            type="number"
            min="0"
            value={formData.consultationFee}
            onChange={e => setFormData({ ...formData, consultationFee: e.target.value })}
            placeholder="e.g., 500"
          />
        </div>
      </div>

      {/* Available Days */}
      <div className="space-y-3">
        <Label>Available Days <span className="text-slate-400">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DAYS_OF_WEEK.map(day => (
            <label
              key={day}
              className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                formData.availableDays.includes(day)
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.availableDays.includes(day)}
                onChange={() => toggleDay(day)}
                className="hidden"
              />
              {formData.availableDays.includes(day) && (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {day.substring(0, 3)}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" size="lg" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update Profile' : 'Complete Profile & Continue'}
        </Button>
      </div>
    </form>
  )
}
