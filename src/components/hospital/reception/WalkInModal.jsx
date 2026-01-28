'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UserPlus, User, Stethoscope, AlertCircle, Loader2, Phone, Mail, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WalkInModal({ isOpen, onClose, doctors, onSuccess, defaultDoctorId }) {
  
  // Initialize form
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '', 
    age: '', gender: 'male', doctorId: defaultDoctorId || '', isEmergency: false
  })
  
  const [loading, setLoading] = useState(false)

  // Update doctor if default changes
  useEffect(() => {
    if (defaultDoctorId) {
      setFormData(prev => ({ ...prev, doctorId: defaultDoctorId }))
    }
  }, [defaultDoctorId])

  const selectedDoctor = doctors.find(d => d._id === formData.doctorId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const toastId = toast.loading('Registering patient & generating token...')

    try {
      const res = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            email: formData.email,
            age: formData.age,
            gender: formData.gender
          },
          doctorId: formData.doctorId,
          isEmergency: formData.isEmergency,
          appointmentType: 'WALK_IN'
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Success Message
        toast.success((
           <div className="space-y-1">
             <p className="font-bold flex items-center gap-2">
               <CheckCircle className="w-4 h-4 text-green-500" /> Token #{data.appointment?.tokenNumber} Generated
             </p>
             {data.generatedCredentials && (
               <div className="text-xs bg-slate-100 p-2 rounded mt-1 border border-slate-200">
                 <p className="font-semibold text-slate-700">Account Created:</p>
                 <p>Pass: <span className="font-mono bg-white px-1 rounded border">{data.generatedCredentials.password}</span></p>
               </div>
             )}
           </div>
        ), { id: toastId, duration: 8000 })

        onSuccess()
        onClose()
        // Reset form but keep doctor selected if provided by parent
        setFormData({ 
            firstName: '', lastName: '', phone: '', email: '', 
            age: '', gender: 'male', doctorId: defaultDoctorId || '', isEmergency: false 
        })
      } else {
        toast.error(data.error || 'Failed to generate token', { id: toastId })
      }
    } catch (error) {
      toast.error('Network error. Check connection.', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden sm:rounded-xl bg-slate-50">
        
        {/* Header Section */}
        <DialogHeader className="p-6 pb-4 bg-white border-b border-slate-200">
          <DialogTitle className="text-xl flex items-center gap-2 text-slate-900">
            <UserPlus className="w-5 h-5 text-blue-600" /> 
            New Walk-In Registration
          </DialogTitle>
          <DialogDescription>
            Register a new patient and assign them to the live queue immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row h-full">
            
            {/* LEFT: Doctor Selection & Summary */}
            <div className="w-full md:w-1/3 bg-slate-50 p-6 border-r border-slate-200 flex flex-col gap-6">
                
                {/* Doctor Select */}
                <div className="space-y-3">
                    <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Assign Doctor</Label>
                    <Select value={formData.doctorId} onValueChange={v => setFormData({...formData, doctorId: v})}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select Doctor" />
                        </SelectTrigger>
                        <SelectContent>
                            {doctors.map(doc => (
                                <SelectItem key={doc._id} value={doc._id}>
                                    Dr. {doc.firstName} {doc.lastName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Selected Doctor Card */}
                {selectedDoctor ? (
                    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                             <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                {selectedDoctor.firstName[0]}{selectedDoctor.lastName[0]}
                             </div>
                             <div>
                                <p className="font-bold text-sm text-slate-900">Dr. {selectedDoctor.firstName}</p>
                                <p className="text-xs text-slate-500">{selectedDoctor.specialization || 'General'}</p>
                             </div>
                        </div>
                        <div className="space-y-2 text-xs">
                             <div className="flex justify-between text-slate-500">
                                <span>Consultation Fee</span>
                                <span className="font-semibold text-slate-900">₹{selectedDoctor.consultationFee || 500}</span>
                             </div>
                             <div className="flex justify-between text-slate-500">
                                <span>Queue Type</span>
                                <Badge variant="secondary" className="text-[10px] h-5 bg-green-100 text-green-700 hover:bg-green-100 border-0">Walk-In</Badge>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                        <Stethoscope className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Select a doctor to view details</p>
                    </div>
                )}
            </div>

            {/* RIGHT: Patient Form */}
            <div className="flex-1 bg-white p-6">
                <form id="walkin-form" onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Patient Details */}
                    <div className="space-y-4">
                        <Label className="text-slate-900 font-semibold flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" /> Patient Details
                        </Label>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">First Name *</Label>
                                <Input required placeholder="Ex: John" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Last Name *</Label>
                                <Input required placeholder="Ex: Doe" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Phone Number *</Label>
                                <div className="relative">
                                    <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                                    <Input required type="tel" className="pl-9" placeholder="9876543210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Email (Optional)</Label>
                                <div className="relative">
                                    <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                                    <Input type="email" className="pl-9" placeholder="john@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Age *</Label>
                                <Input required type="number" placeholder="25" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-xs text-slate-500">Gender *</Label>
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
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 my-2" />

                    {/* Emergency Toggle */}
                    <div 
                        onClick={() => setFormData(prev => ({ ...prev, isEmergency: !prev.isEmergency }))}
                        className={`
                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none
                            ${formData.isEmergency 
                                ? 'bg-red-50 border-red-200 ring-1 ring-red-200' 
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'}
                        `}
                    >
                        <div className={`
                            w-5 h-5 rounded flex items-center justify-center border transition-colors
                            ${formData.isEmergency ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-300'}
                        `}>
                            {formData.isEmergency && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-semibold ${formData.isEmergency ? 'text-red-700' : 'text-slate-700'}`}>
                                Emergency Case
                            </p>
                            <p className="text-xs text-slate-500">
                                This will flag the patient and prioritize them in the queue.
                            </p>
                        </div>
                        <AlertCircle className={`w-5 h-5 ${formData.isEmergency ? 'text-red-500' : 'text-slate-300'}`} />
                    </div>

                </form>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                Cancel
            </Button>
            <Button 
                form="walkin-form" 
                type="submit" 
                disabled={loading || !formData.doctorId}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...
                    </>
                ) : (
                    'Generate Token'
                )}
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
