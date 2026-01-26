'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Stethoscope, Pill, FileText, CheckCircle, Printer, 
  History, CalendarPlus, ChevronRight, User
} from 'lucide-react'
import VitalsForm from './sub-components/VitalsForm' // Extracted vitals form
import PrescriptionManager from './sub-components/PrescriptionManager' // Extracted Rx manager

export default function ActivePatientConsole({ currentPatient, onComplete, onNextPatient, hasWaitingPatients }) {
  const [activeTab, setActiveTab] = useState('clinical')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [vitals, setVitals] = useState({})
  const [medicines, setMedicines] = useState([])
  const [followUp, setFollowUp] = useState('')

  // Reset form when patient changes
  useEffect(() => {
    if (currentPatient) {
        console.log('🔄 ActivePatientConsole: Patient changed to:', currentPatient._id);
        console.log('📋 Patient vitals data from props:', currentPatient.vitals);
        console.log('📋 Current vitals state before update:', vitals);
        
        setDiagnosis(currentPatient.diagnosis || '')
        setNotes(currentPatient.notes || '')
        
        // Initialize vitals from the appointment data - ensure we have a proper vitals object
        const defaultVitals = {
          temperature: '',
          weight: '',
          bpSystolic: '',
          bpDiastolic: '',
          spo2: '',
          heartRate: ''
        };
        
        // Get vitals from appointment, ensuring it's a proper object
        const appointmentVitals = currentPatient.vitals && typeof currentPatient.vitals === 'object' 
          ? currentPatient.vitals 
          : {};
        
        // Merge default vitals with existing vitals from the appointment
        const mergedVitals = {
          ...defaultVitals,
          ...appointmentVitals
        };
        
        console.log('🌡️ Appointment vitals:', appointmentVitals);
        console.log('🌡️ Merged vitals:', mergedVitals);
        console.log('🌡️ Setting vitals state to:', mergedVitals);
        
        setVitals(mergedVitals);
        
        setMedicines(currentPatient.prescription || [])
        setFollowUp(currentPatient.nextVisit?.date || '')
    } else {
      // Reset all fields when no patient is selected
      console.log('🔄 ActivePatientConsole: No patient selected, resetting form');
      setDiagnosis('')
      setNotes('')
      setVitals({
        temperature: '',
        weight: '',
        bpSystolic: '',
        bpDiastolic: '',
        spo2: '',
        heartRate: ''
      })
      setMedicines([])
      setFollowUp('')
    }
  }, [currentPatient])

  if (!currentPatient) {
    return (
      <Card className="h-full flex flex-col items-center justify-center border-dashed bg-secondary">
        <div className="bg-background p-6 rounded-full shadow-sm mb-4">
           <User className="w-12 h-12 text-foreground/40" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">No Patient Selected</h3>
        <p className="text-foreground/60 mb-6">Select a patient from the queue or call the next one.</p>
        <Button size="lg" disabled={!hasWaitingPatients} onClick={onNextPatient} className="bg-blue-600 hover:bg-blue-700">
           {hasWaitingPatients ? 'Call Next Patient' : 'Queue Empty'} <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>
    )
  }

  const handleFinish = () => {
      // Package all data
      const consultationData = {
          vitals,
          diagnosis,
          notes,
          prescription: medicines,
          nextVisit: followUp ? { date: followUp } : null
      }
      
      console.log('🔍 handleFinish called with consultation data:', consultationData);
      
      onComplete(consultationData)
  }

  return (
    <Card className="h-full flex flex-col border-t-4 border-t-blue-600 shadow-md bg-background">
      {/* 1. Header with Patient Info & Actions */}
      <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between bg-background">
         <div className="flex items-center gap-4">
             <Avatar className="h-14 w-14 border-2 border-border">
                <AvatarImage src={currentPatient.patientId?.profilePicture} />
                <AvatarFallback className="bg-secondary text-foreground font-bold text-lg">
                  {currentPatient.patientId?.firstName?.[0]}
                </AvatarFallback>
             </Avatar>
             <div>
                <div className="flex items-center gap-2">
                   <h2 className="text-2xl font-bold text-foreground">
                     {currentPatient.patientId?.firstName} {currentPatient.patientId?.lastName}
                   </h2>
                   <Badge className="bg-secondary text-foreground hover:bg-secondary/80 border-0">Token #{currentPatient.tokenNumber}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-foreground/70 mt-1">
                   <span>{currentPatient.patientId?.gender || 'N/A'}, {currentPatient.patientId?.age || '?'} yrs</span>
                   <span className="w-1 h-1 bg-border rounded-full"></span>
                   <span>+91 {currentPatient.patientId?.phoneNumber}</span>
                </div>
             </div>
         </div>
         
         <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden lg:flex gap-2">
               <History className="w-4 h-4" /> Past Visits
            </Button>
            <div className="text-right px-4 py-1 bg-slate-50 rounded-lg border border-slate-100">
               <p className="text-[10px] uppercase font-bold text-slate-400">Timer</p>
               <p className="text-xl font-mono font-bold text-slate-700">12:45</p>
            </div>
         </div>
      </CardHeader>

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 border-b bg-slate-50/50">
               <TabsList className="bg-transparent h-12 w-full justify-start gap-6">
                  <TabsTrigger value="clinical" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-0 pb-3 font-semibold text-foreground/70 data-[state=active]:text-foreground">
                     <Stethoscope className="w-4 h-4 mr-2" /> Clinical Notes
                  </TabsTrigger>
                  <TabsTrigger value="prescription" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-0 pb-3 font-semibold text-foreground/70 data-[state=active]:text-foreground">
                     <Pill className="w-4 h-4 mr-2" /> Prescription
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-0 pb-3 font-semibold text-foreground/70 data-[state=active]:text-foreground">
                     <FileText className="w-4 h-4 mr-2" /> Documents & Labs
                  </TabsTrigger>
               </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-background">
                           
               <TabsContent value="clinical" className="mt-0 space-y-6">
                  {/* Quick Vitals */}
                  <VitalsForm vitals={vitals} onChange={setVitals} />

                  <div className="grid gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Diagnosis</label>
                        <Input 
                           placeholder="Primary Diagnosis (e.g. Viral Fever)" 
                           value={diagnosis}
                           onChange={e => setDiagnosis(e.target.value)}
                           className="text-lg font-medium"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Clinical Notes / Symptoms</label>
                        <Textarea 
                           placeholder="Patient complains of..." 
                           className="min-h-[150px] resize-none"
                           value={notes}
                           onChange={e => setNotes(e.target.value)}
                        />
                     </div>
                  </div>
               </TabsContent>

               <TabsContent value="prescription" className="mt-0 h-full flex flex-col">
                   <PrescriptionManager medicines={medicines} setMedicines={setMedicines} />
                   
                   <div className="mt-6 pt-6 border-t">
                      <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                         <CalendarPlus className="w-4 h-4" /> Follow Up
                      </label>
                      <div className="flex gap-3">
                         <Button variant="outline" size="sm" onClick={() => setFollowUp(new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0])}>3 Days</Button>
                         <Button variant="outline" size="sm" onClick={() => setFollowUp(new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0])}>7 Days</Button>
                         <Input 
                            type="date" 
                            className="w-40" 
                            value={followUp} 
                            onChange={e => setFollowUp(e.target.value)} 
                         />
                      </div>
                   </div>
               </TabsContent>

               <TabsContent value="documents">
                   <div className="flex flex-col items-center justify-center h-64 text-foreground/50 border-2 border-dashed border-border rounded-xl">
                      <FileText className="w-10 h-10 mb-2 opacity-50" />
                      <p>No documents uploaded yet</p>
                      <Button variant="link">Upload Report</Button>
                   </div>
               </TabsContent>
            </div>
         </Tabs>
      </div>

      {/* 3. Action Footer */}
      <CardFooter className="bg-background border-t p-4 flex justify-between items-center z-10">
         <Button variant="ghost" className="text-foreground/70 gap-2">
            <Printer className="w-4 h-4" /> Print Rx
         </Button>
         <div className="flex gap-3">
            <Button variant="outline" className="border-border">Save Draft</Button>
            <Button className="bg-green-600 hover:bg-green-700 w-48 gap-2" onClick={handleFinish}>
               <CheckCircle className="w-4 h-4" /> Complete Visit
            </Button>
         </div>
      </CardFooter>
    </Card>
  )
}