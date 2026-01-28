'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Stethoscope, AlertCircle, Loader2, Phone, Mail, CheckCircle, Search, ArrowRight, UserCheck, Calendar as CalendarIcon, Clock, CreditCard, Banknote, Wallet } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function WalkInModal({ isOpen, onClose, doctors, onSuccess, defaultDoctorId, hospitalId }) { // Added hospitalId prop
  
  // --- Form State ---
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '', 
    age: '', gender: 'male', doctorId: defaultDoctorId || '', isEmergency: false,
    paymentStatus: 'pending', // 'paid' | 'pending'
    paymentMethod: 'cash'     // 'cash' | 'upi' | 'card'
  })
  
  // --- Booking State ---
  const [activeTab, setActiveTab] = useState('new') // 'new' | 'existing'
  const [bookingType, setBookingType] = useState('immediate') // 'immediate' | 'future'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // --- Search State ---
  const [searchPhone, setSearchPhone] = useState('')
  const [foundPatient, setFoundPatient] = useState(null)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)

  // Update doctor if default changes
  useEffect(() => {
    if (defaultDoctorId) {
      setFormData(prev => ({ ...prev, doctorId: defaultDoctorId }))
    }
  }, [defaultDoctorId])

  const selectedDoctor = useMemo(() => 
    doctors.find(d => d._id === formData.doctorId), 
  [doctors, formData.doctorId])

  // --- Fetch Slots when Date/Doctor Changes ---
  useEffect(() => {
    if (bookingType === 'future' && formData.doctorId && selectedDate) {
      fetchSlots()
    } else {
        setAvailableSlots([])
    }
  }, [bookingType, formData.doctorId, selectedDate])

  const fetchSlots = async () => {
    setLoadingSlots(true)
    try {
      // ✅ UPDATED: Call the unified appointment service API
      const queryParams = new URLSearchParams({
        doctorId: formData.doctorId,
        date: selectedDate,
        hospitalId: hospitalId || '' // Pass hospitalId if available
      });

      const res = await fetch(`/api/appointment/available-slots?${queryParams}`)
      const data = await res.json()
      
      if (res.ok && data.success) {
        // The patient API returns objects like { time: "09:00", displayTime: "09:00 AM" }
        // We extract just the time string for internal logic
        const times = (data.availableSlots || []).map(s => s.time) 
        setAvailableSlots(times)
      } else {
         setAvailableSlots([])
      }
    } catch (error) {
      console.error("Failed to fetch slots", error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSearchPatient = async () => {
    if (!searchPhone || searchPhone.length < 10) {
      toast.error('Enter a valid phone number')
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/hospital/patients/search?phone=${searchPhone}`)
      const data = await res.json()
      if (res.ok && data.patient) {
        setFoundPatient(data.patient)
        setFormData(prev => ({
          ...prev,
          firstName: data.patient.firstName,
          lastName: data.patient.lastName,
          phone: data.patient.phoneNumber,
          email: data.patient.email || '',
          gender: data.patient.gender || 'male',
        }))
      } else {
        setFoundPatient(null)
        toast.error('Patient not found. Please register new.')
        setActiveTab('new')
        setFormData(prev => ({...prev, phone: searchPhone}))
      }
    } catch (error) {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    if(e) e.preventDefault()
    
    // Validation
    if (!formData.doctorId) return toast.error('Please select a doctor')
    if (bookingType === 'future' && !selectedSlot) return toast.error('Please select a time slot')

    setLoading(true)
    const toastId = toast.loading('Processing booking...')

    try {
      const payload = {
        doctorId: formData.doctorId,
        isEmergency: formData.isEmergency,
        appointmentType: bookingType === 'future' ? 'SCHEDULED' : 'WALK_IN',
        date: selectedDate,
        timeSlot: bookingType === 'future' ? selectedSlot : null,
        paymentStatus: formData.paymentStatus, // Add payment info
        paymentMethod: formData.paymentStatus === 'paid' ? formData.paymentMethod : null,
        patientData: foundPatient ? null : { 
           firstName: formData.firstName,
           lastName: formData.lastName,
           phone: formData.phone,
           email: formData.email,
           age: formData.age,
           gender: formData.gender
        },
        patientId: foundPatient?._id
      }

      const res = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success((
           <div className="space-y-1">
             <p className="font-bold flex items-center gap-2">
               <CheckCircle className="w-4 h-4 text-green-500" /> 
               {bookingType === 'future' ? 'Appointment Scheduled' : `Token #${data.appointment?.tokenNumber}`}
             </p>
             {formData.paymentStatus === 'paid' && (
                 <p className="text-xs bg-green-50 text-green-700 px-1 rounded inline-block">
                    Payment Received ({formData.paymentMethod})
                 </p>
             )}
           </div>
        ), { id: toastId, duration: 5000 })

        onSuccess()
        handleClose()
      } else {
        toast.error(data.error || 'Failed to book', { id: toastId })
      }
    } catch (error) {
      toast.error('Network error', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setFormData({ 
       firstName: '', lastName: '', phone: '', email: '', 
       age: '', gender: 'male', doctorId: defaultDoctorId || '', isEmergency: false,
       paymentStatus: 'pending', paymentMethod: 'cash'
    })
    setFoundPatient(null)
    setSearchPhone('')
    setActiveTab('new')
    setBookingType('immediate')
    setSelectedSlot(null)
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
  }

  // Helper component for Payment Section to reuse in both tabs
  const PaymentSection = () => (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
            <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold">Payment Details</span>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Fee</p>
                <p className="text-lg font-bold text-blue-600">₹{selectedDoctor?.consultationFee || 500}</p>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label className="text-xs">Payment Status</Label>
                <Select 
                    value={formData.paymentStatus} 
                    onValueChange={v => setFormData({...formData, paymentStatus: v})}
                >
                    <SelectTrigger className="h-9 bg-white dark:bg-black">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">
                            <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-orange-400"></span> Pending
                            </span>
                        </SelectItem>
                        <SelectItem value="paid">
                            <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500"></span> Paid
                            </span>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {formData.paymentStatus === 'paid' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                    <Label className="text-xs">Payment Method</Label>
                    <Select 
                        value={formData.paymentMethod} 
                        onValueChange={v => setFormData({...formData, paymentMethod: v})}
                    >
                        <SelectTrigger className="h-9 bg-white dark:bg-black">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cash">
                                <span className="flex items-center gap-2"><Banknote className="w-3 h-3"/> Cash</span>
                            </SelectItem>
                            <SelectItem value="upi">
                                <span className="flex items-center gap-2"><Phone className="w-3 h-3"/> UPI</span>
                            </SelectItem>
                            <SelectItem value="card">
                                <span className="flex items-center gap-2"><CreditCard className="w-3 h-3"/> Card</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full h-full sm:h-[90vh] sm:max-w-4xl p-0 gap-0 sm:rounded-xl bg-background flex flex-col overflow-hidden">
        
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 bg-muted/30 border-b border-border shrink-0">
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-xl flex items-center gap-2 text-foreground">
              <UserPlus className="w-5 h-5 text-blue-600" /> 
              Patient Registration & Booking
            </DialogTitle>
            <DialogDescription>
              Register walk-in patients or schedule future appointments.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            
            {/* LEFT: Booking Context */}
            <div className="w-full md:w-[340px] bg-muted/10 border-b md:border-b-0 md:border-r border-border flex flex-col shrink-0 overflow-y-auto">
                <div className="p-4 sm:p-5 space-y-6">
                    
                    {/* 1. Select Doctor */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1. Select Doctor</Label>
                        <Select value={formData.doctorId} onValueChange={v => setFormData({...formData, doctorId: v})}>
                            <SelectTrigger className="bg-background w-full">
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

                        {selectedDoctor && (
                             <div className="flex items-center gap-3 p-3 bg-background border rounded-lg shadow-sm">
                                <Avatar className="h-10 w-10 border border-slate-100">
                                    <AvatarImage src={selectedDoctor.profileImage} />
                                    <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-xs">
                                        {selectedDoctor.firstName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden">
                                    <p className="font-semibold text-sm truncate">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{selectedDoctor.specialization}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-border" />

                    {/* 2. Booking Type */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2. Booking Type</Label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                            <button
                                type="button"
                                onClick={() => { setBookingType('immediate'); setSelectedDate(format(new Date(), 'yyyy-MM-dd')); }}
                                className={`text-xs font-medium py-2 rounded-md transition-all ${bookingType === 'immediate' ? 'bg-white shadow-sm text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Immediate
                            </button>
                            <button
                                type="button"
                                onClick={() => setBookingType('future')}
                                className={`text-xs font-medium py-2 rounded-md transition-all ${bookingType === 'future' ? 'bg-white shadow-sm text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Future
                            </button>
                        </div>
                    </div>

                    {/* 3. Date & Slot Selection */}
                    {bookingType === 'future' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                             <div className="space-y-2">
                                <Label className="text-xs font-medium">Select Date</Label>
                                <Input 
                                    type="date" 
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-background"
                                />
                             </div>

                             <div className="space-y-2">
                                <Label className="text-xs font-medium flex justify-between">
                                    <span>Available Slots</span>
                                    {loadingSlots && <Loader2 className="w-3 h-3 animate-spin" />}
                                </Label>
                                {availableSlots.length > 0 ? (
                                    <ScrollArea className="h-[120px] rounded-md border bg-background p-2">
                                        <div className="grid grid-cols-3 gap-2">
                                            {availableSlots.map((slot) => (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`
                                                        text-xs py-1.5 px-1 rounded border transition-all
                                                        ${selectedSlot === slot 
                                                            ? 'bg-blue-600 text-white border-blue-600' 
                                                            : 'hover:bg-accent border-transparent bg-slate-50 text-slate-700'}
                                                    `}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <div className="h-[100px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/30 text-xs text-muted-foreground">
                                        {selectedDoctor ? (loadingSlots ? 'Loading...' : 'No slots available') : 'Select doctor first'}
                                    </div>
                                )}
                             </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-green-800 text-xs flex gap-2">
                            <Clock className="w-4 h-4 shrink-0" />
                            <div>
                                <p className="font-semibold">Live Queue Booking</p>
                                <p className="opacity-80 mt-1">Patient will be added to the end of today's queue.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Patient Details & Payment */}
            <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
                    <div className="px-4 sm:px-6 pt-4 border-b border-border bg-background z-10">
                        <TabsList className="grid w-full grid-cols-2 max-w-[300px] mb-4">
                            <TabsTrigger value="new">New Patient</TabsTrigger>
                            <TabsTrigger value="existing">Existing</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-4 sm:p-6 pb-24 space-y-6"> 
                            {/* TAB: EXISTING */}
                            <TabsContent value="existing" className="mt-0 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Search Phone Number" 
                                            value={searchPhone}
                                            onChange={(e) => setSearchPhone(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
                                            type="tel"
                                            className="max-w-xs"
                                        />
                                        <Button onClick={handleSearchPatient} disabled={searching} variant="secondary">
                                            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        </Button>
                                    </div>

                                    {foundPatient && (
                                        <div className="bg-slate-50 border rounded-xl p-4 flex gap-4">
                                            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                                {foundPatient.firstName[0]}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900">{foundPatient.firstName} {foundPatient.lastName}</h4>
                                                <p className="text-sm text-slate-600">{foundPatient.phoneNumber}</p>
                                                <div className="flex gap-2 mt-2 text-xs">
                                                    <span className="bg-white border px-2 py-0.5 rounded capitalize">{foundPatient.gender}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => setFoundPatient(null)} className="h-6 w-6">
                                                <ArrowRight className="w-4 h-4 rotate-180" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {foundPatient && (
                                    <>
                                        <div className="h-px bg-border" />
                                        <PaymentSection />
                                    </>
                                )}
                            </TabsContent>

                            {/* TAB: NEW */}
                            <TabsContent value="new" className="mt-0 space-y-6">
                                <form id="walkin-form" onSubmit={handleSubmit} className="space-y-5 max-w-lg">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">First Name *</Label>
                                            <Input required placeholder="Ex: John" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Last Name *</Label>
                                            <Input required placeholder="Ex: Doe" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                         <div className="space-y-1.5">
                                            <Label className="text-xs">Phone Number *</Label>
                                            <Input required type="tel" placeholder="9876543210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Email</Label>
                                            <Input type="email" placeholder="Optional" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Age *</Label>
                                            <Input required type="number" placeholder="25" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <Label className="text-xs">Gender *</Label>
                                            <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="h-px bg-border my-2" />
                                    
                                    <PaymentSection />
                                    
                                    {/* Emergency Toggle */}
                                    <div 
                                        onClick={() => setFormData(prev => ({ ...prev, isEmergency: !prev.isEmergency }))}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.isEmergency ? 'bg-red-50 border-red-200' : 'bg-muted/30 border-transparent hover:bg-muted'}`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.isEmergency ? 'bg-red-500 border-red-500 text-white' : 'bg-background border-input'}`}>
                                            {formData.isEmergency && <CheckCircle className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-semibold ${formData.isEmergency ? 'text-red-700' : ''}`}>Emergency Case</p>
                                        </div>
                                        <AlertCircle className={`w-5 h-5 ${formData.isEmergency ? 'text-red-500' : 'text-slate-300'}`} />
                                    </div>
                                </form>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>

                {/* Footer - Sticky at bottom of right panel */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border flex items-center justify-between gap-3 z-20">
                    <div className="hidden sm:block text-xs text-muted-foreground">
                        {bookingType === 'future' 
                            ? selectedSlot ? `Booking for ${format(new Date(selectedDate), 'MMM dd')} @ ${selectedSlot}` : 'Select a time slot'
                            : 'Adding to Live Queue'
                        }
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={handleClose} disabled={loading} className="flex-1 sm:flex-none">
                            Cancel
                        </Button>
                        <Button 
                            onClick={activeTab === 'existing' ? handleSubmit : undefined}
                            form={activeTab === 'new' ? "walkin-form" : undefined}
                            type={activeTab === 'new' ? "submit" : "button"}
                            disabled={loading || !formData.doctorId || (bookingType === 'future' && !selectedSlot) || (activeTab === 'existing' && !foundPatient)}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none min-w-[140px]"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                            ) : (
                                <>{bookingType === 'future' ? 'Schedule Appointment' : 'Generate Token'} <ArrowRight className="w-4 h-4 ml-2" /></>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
