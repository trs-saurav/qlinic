'use client'

import { useState } from 'react'
import { useUser } from '@/context/UserContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import toast from 'react-hot-toast'
import { 
  Users, UserPlus, Edit, Trash2, Heart, Phone, Calendar, AlertCircle, Loader2, User 
} from 'lucide-react'

export default function FamilyMembers() {
  const { familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useUser()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', relationship: 'Self', gender: 'male', dateOfBirth: '',
    bloodGroup: '', phoneNumber: '', email: '', address: '', emergencyContact: '',
    allergies: '', currentMedications: '', medicalHistory: ''
  })

  // --- Handlers ---

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', relationship: 'Self', gender: 'male', dateOfBirth: '',
      bloodGroup: '', phoneNumber: '', email: '', address: '', emergencyContact: '',
      allergies: '', currentMedications: '', medicalHistory: ''
    })
    setEditingId(null)
  }

  const handleEditClick = (member) => {
    setEditingId(member._id)
    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      relationship: member.relationship || 'Self',
      gender: member.gender || 'male',
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
      bloodGroup: member.bloodGroup || '',
      phoneNumber: member.phoneNumber || '',
      email: member.email || '',
      address: member.address || '',
      emergencyContact: member.emergencyContact || '',
      allergies: Array.isArray(member.allergies) ? member.allergies.join(', ') : '',
      currentMedications: Array.isArray(member.currentMedications) ? member.currentMedications.join(', ') : '',
      medicalHistory: Array.isArray(member.medicalHistory) ? member.medicalHistory.join(', ') : ''
    })
    setIsModalOpen(true)
  }

  const handleDeleteClick = async (id) => {
    if (!confirm('Are you sure you want to delete this member?')) return
    await deleteFamilyMember(id)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName) {
      toast.error('Name fields are required')
      return
    }

    setIsSubmitting(true)

    const payload = {
      ...formData,
      allergies: formData.allergies ? String(formData.allergies).split(',').map(s=>s.trim()).filter(Boolean) : [],
      currentMedications: formData.currentMedications ? String(formData.currentMedications).split(',').map(s=>s.trim()).filter(Boolean) : [],
      medicalHistory: formData.medicalHistory ? String(formData.medicalHistory).split(',').map(s=>s.trim()).filter(Boolean) : [],
      bloodGroup: formData.bloodGroup || null
    }

    let result
    if (editingId) {
      result = await updateFamilyMember(editingId, payload)
    } else {
      result = await addFamilyMember(payload)
    }

    setIsSubmitting(false)
    if (result.success) {
      setIsModalOpen(false)
      resetForm()
    }
  }

  // --- Helpers ---

  const getAge = (dob) => {
    if (!dob) return null
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  const getRelColor = (rel) => {
    const map = {
      'Self': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      'Spouse': 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200 border-pink-200 dark:border-pink-800',
      'Child': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-800',
      'Parent': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    }
    return map[rel] || 'bg-secondary text-secondary-foreground border-border'
  }

  return (
    <div className="space-y-8 p-1">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Family Members</h2>
          <p className="text-muted-foreground mt-1">Manage health profiles for your family</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-sm">
              <UserPlus className="w-5 h-5 mr-2" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Member' : 'Add New Member'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              
              {/* Personal Details Group */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name <span className="text-destructive">*</span></Label>
                    <Input required value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name <span className="text-destructive">*</span></Label>
                    <Input required value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})} placeholder="Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship <span className="text-destructive">*</span></Label>
                    <Select value={formData.relationship} onValueChange={v=>setFormData({...formData, relationship: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Self','Spouse','Child','Parent','Sibling','Grandparent','Other'].map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={v=>setFormData({...formData, gender: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={formData.dateOfBirth} onChange={e=>setFormData({...formData, dateOfBirth: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Group</Label>
                    <Select value={formData.bloodGroup} onValueChange={v=>setFormData({...formData, bloodGroup: v})}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Info Group */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Contact Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input type="tel" value={formData.phoneNumber} onChange={e=>setFormData({...formData, phoneNumber: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
                   </div>
                </div>
              </div>

              {/* Medical Group */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Medical Profile
                </h3>
                <div className="space-y-3">
                   <div className="space-y-2">
                    <Label>Allergies (comma separated)</Label>
                    <Input value={formData.allergies} onChange={e=>setFormData({...formData, allergies: e.target.value})} placeholder="Peanuts, Penicillin..." />
                   </div>
                   <div className="space-y-2">
                    <Label>Current Medications</Label>
                    <Input value={formData.currentMedications} onChange={e=>setFormData({...formData, currentMedications: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                    <Label>Medical History</Label>
                    <Input value={formData.medicalHistory} onChange={e=>setFormData({...formData, medicalHistory: e.target.value})} />
                   </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={()=>setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Member'}
                </Button>
              </div>

            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid Display */}
      {familyMembers.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">No members found</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              Add family members to simplify appointment booking and health tracking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyMembers.map((m) => (
            <Card key={m._id} className="group overflow-hidden transition-all hover:shadow-md border-border bg-card text-card-foreground">
              <CardContent className="p-0">
                
                {/* 1. Header Area with Full Width Name */}
                <div className="p-6 pb-4 flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-lg font-bold leading-tight truncate">
                        {m.firstName} {m.lastName}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2">
                        <Badge variant="outline" className={`${getRelColor(m.relationship)} border font-medium`}>
                            {m.relationship}
                        </Badge>
                        {m.gender && (
                             <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                <User className="w-3 h-3" /> {m.gender}
                             </span>
                        )}
                    </div>
                  </div>
                </div>

                {/* 2. Info Grid Section */}
                <div className="px-6 py-4 bg-muted/40 border-t border-b grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                   {/* Age */}
                   <div className="col-span-1">
                      <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">Age</span>
                      <span className="font-medium flex items-center gap-1.5">
                         <Calendar className="w-3.5 h-3.5 opacity-70" />
                         {m.dateOfBirth ? `${getAge(m.dateOfBirth)} years` : '-'}
                      </span>
                   </div>

                   {/* Blood Group */}
                   <div className="col-span-1">
                      <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">Blood</span>
                      <span className="font-medium flex items-center gap-1.5">
                         <Heart className="w-3.5 h-3.5 text-red-500" />
                         {m.bloodGroup || '-'}
                      </span>
                   </div>

                   {/* Phone */}
                   <div className="col-span-2">
                      <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">Contact</span>
                      <span className="font-medium flex items-center gap-1.5">
                         <Phone className="w-3.5 h-3.5 opacity-70" />
                         {m.phoneNumber || 'No number added'}
                      </span>
                   </div>
                </div>

                {/* 3. Alerts Section (Bottom) */}
                {m.allergies && m.allergies.length > 0 && (
                   <div className="px-6 py-3 border-b flex items-center gap-2 overflow-hidden">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div className="flex gap-1 overflow-x-auto no-scrollbar">
                          {m.allergies.slice(0,3).map((a,i) => (
                             <span key={i} className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full whitespace-nowrap border border-amber-200 dark:border-amber-800">
                                {a}
                             </span>
                          ))}
                      </div>
                   </div>
                )}

                {/* 4. Action Footer (Full Width) */}
                <div className="flex divide-x border-t">
                  <button 
                    onClick={()=>handleEditClick(m)}
                    className="flex-1 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" /> Edit Profile
                  </button>
                  <button 
                    onClick={()=>handleDeleteClick(m._id)}
                    className="flex-1 py-3 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
