// src/components/patient/FamilyMembers.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'
import { 
  Users, UserPlus, Edit, Trash2, Heart, Phone, Calendar, AlertCircle 
} from 'lucide-react'

export default function FamilyMembers() {
  const [familyMembers, setFamilyMembers] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    relationship: 'Self',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: null,
    phoneNumber: '',
    email: '',
    address: '',
    emergencyContact: '',
    allergies: '',
    currentMedications: '',
    medicalHistory: ''
  })

  useEffect(() => {
    fetchFamilyMembers()
  }, [])

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/patient/family')
      const data = await response.json()

      if (data.familyMembers) {
        setFamilyMembers(data.familyMembers)
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
      toast.error('Failed to load family members')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'First name is required'
    if (!formData.lastName.trim()) return 'Last name is required'
    if (!formData.relationship) return 'Relationship is required'
    if (!formData.gender) return 'Gender is required'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }
    
    const loadingToast = toast.loading(editingMember ? 'Updating...' : 'Adding member...')

    try {
      setIsSubmitting(true)
      const url = editingMember 
        ? `/api/patient/family/${editingMember._id}` 
        : '/api/patient/family'
      
      const method = editingMember ? 'PATCH' : 'POST'

      const processedData = {
        ...formData,
        bloodGroup: formData.bloodGroup === '' ? null : formData.bloodGroup,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        currentMedications: formData.currentMedications ? formData.currentMedications.split(',').map(s => s.trim()).filter(Boolean) : [],
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map(s => s.trim()).filter(Boolean) : []
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          editingMember ? '✅ Member updated successfully' : '✅ Member added successfully',
          { id: loadingToast }
        )
        setIsAddModalOpen(false)
        setEditingMember(null)
        resetForm()
        fetchFamilyMembers()
      } else {
        toast.error(data.error || 'Operation failed', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error saving family member:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      relationship: member.relationship || 'Self',
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
      gender: member.gender || 'male',
      bloodGroup: member.bloodGroup || '',
      phoneNumber: member.phoneNumber || '',
      email: member.email || '',
      address: member.address || '',
      emergencyContact: member.emergencyContact || '',
      allergies: Array.isArray(member.allergies) ? member.allergies.join(', ') : '',
      currentMedications: Array.isArray(member.currentMedications) ? member.currentMedications.join(', ') : '',
      medicalHistory: Array.isArray(member.medicalHistory) ? member.medicalHistory.join(', ') : ''
    })
    setIsAddModalOpen(true)
  }

  const handleDelete = async (memberId) => {
    if (!confirm('Are you sure you want to remove this family member?')) return

    const loadingToast = toast.loading('Removing member...')

    try {
      const response = await fetch(`/api/patient/family/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Member removed successfully', { id: loadingToast })
        fetchFamilyMembers()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to remove member', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error deleting family member:', error)
      toast.error('Something went wrong', { id: loadingToast })
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      relationship: 'Self',
      dateOfBirth: '',
      gender: 'male',
      bloodGroup: null,
      phoneNumber: '',
      email: '',
      address: '',
      emergencyContact: '',
      allergies: '',
      currentMedications: '',
      medicalHistory: ''
    })
    setEditingMember(null)
  }

  const getRelationshipColor = (relationship) => {
    const colors = {
      'Self': 'bg-blue-100 text-blue-700',
      'Spouse': 'bg-pink-100 text-pink-700',
      'Child': 'bg-purple-100 text-purple-700',
      'Parent': 'bg-green-100 text-green-700',
      'Sibling': 'bg-yellow-100 text-yellow-700',
      'Grandparent': 'bg-orange-100 text-orange-700',
      'Other': 'bg-slate-100 text-slate-700'
    }
    return colors[relationship] || colors['Other']
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (isLoading && familyMembers.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Family Members</h2>
          <p className="text-slate-500 mt-1">Manage health records for your family</p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={(open) => {
          setIsAddModalOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <UserPlus className="w-5 h-5" />
              Add Family Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Edit Family Member' : 'Add Family Member'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship">Relationship <span className="text-red-500">*</span></Label>
                    <Select value={formData.relationship} onValueChange={v => setFormData({...formData, relationship: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Self">Self</SelectItem>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Grandparent">Grandparent</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                    <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select value={formData.bloodGroup || ''} onValueChange={v => setFormData({...formData, bloodGroup: v || null})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* ✅ FIXED: Removed empty value="" SelectItem */}
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="Street, City, State, Pincode"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="emergency">Emergency Contact</Label>
                    <Input
                      id="emergency"
                      type="tel"
                      value={formData.emergencyContact}
                      onChange={e => setFormData({...formData, emergencyContact: e.target.value})}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Medical Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="allergies">Allergies (comma separated)</Label>
                    <Input
                      id="allergies"
                      value={formData.allergies}
                      onChange={e => setFormData({...formData, allergies: e.target.value})}
                      placeholder="Penicillin, Peanuts, Dust"
                    />
                  </div>
                  <div>
                    <Label htmlFor="medications">Current Medications (comma separated)</Label>
                    <Input
                      id="medications"
                      value={formData.currentMedications}
                      onChange={e => setFormData({...formData, currentMedications: e.target.value})}
                      placeholder="Aspirin, Insulin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="history">Medical History (comma separated)</Label>
                    <Input
                      id="history"
                      value={formData.medicalHistory}
                      onChange={e => setFormData({...formData, medicalHistory: e.target.value})}
                      placeholder="Diabetes, Hypertension"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingMember ? 'Update Member' : 'Add Member'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Family Members Grid */}
      {familyMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyMembers.map((member) => {
            const age = calculateAge(member.dateOfBirth)
            return (
              <Card key={member._id} className="hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Avatar & Name */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {member.firstName} {member.lastName}
                          </h3>
                          <Badge className={getRelationshipColor(member.relationship)}>
                            {member.relationship}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-2 text-sm">
                      {age && (
                        <p className="text-slate-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {age} years old
                        </p>
                      )}
                      <p className="text-slate-600 capitalize">
                        Gender: {member.gender || 'Not specified'}
                      </p>
                      {member.bloodGroup && (
                        <p className="text-slate-600 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          Blood Group: <span className="font-semibold">{member.bloodGroup}</span>
                        </p>
                      )}
                      {member.phoneNumber && (
                        <p className="text-slate-600 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {member.phoneNumber}
                        </p>
                      )}
                    </div>

                    {/* Medical Info */}
                    {(member.allergies?.length > 0 || member.currentMedications?.length > 0) && (
                      <div className="pt-3 border-t space-y-2">
                        {member.allergies?.length > 0 && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-slate-600">
                              <span className="font-semibold">Allergies:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.allergies.slice(0, 3).map((allergy, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-[10px] bg-amber-50 text-amber-700">
                                    {allergy}
                                  </Badge>
                                ))}
                                {member.allergies.length > 3 && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    +{member.allergies.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEdit(member)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(member._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-slate-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No family members added yet</p>
              <p className="text-sm mt-2">Add yourself and your family members to book appointments</p>
              <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Your First Member
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
