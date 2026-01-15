'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, Pill } from 'lucide-react'

export default function PrescriptionManager({ medicines, setMedicines }) {
  // Local state for the "Add New" form row
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: '1-0-1',
    duration: '5 Days',
    instructions: 'After Food'
  })

  const addMedicine = () => {
    if (!newMed.name) return
    setMedicines([...medicines, { ...newMed, id: Date.now() }]) // Add unique ID for React keys
    setNewMed({ ...newMed, name: '', dosage: '' }) // Reset Name/Dosage only, keep defaults
  }

  const removeMedicine = (id) => {
    setMedicines(medicines.filter(m => m.id !== id))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addMedicine()
  }

  return (
    <div className="flex flex-col h-full">
      {/* 1. Add Medicine Form */}
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
         <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4" /> Add Medication
         </h4>
         <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-12 md:col-span-4">
               <label className="text-xs font-semibold text-slate-500 mb-1 block">Medicine Name</label>
               <Input 
                 placeholder="e.g. Paracetamol 500mg" 
                 value={newMed.name}
                 onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                 onKeyDown={handleKeyPress}
                 className="bg-white"
                 autoFocus
               />
            </div>
            <div className="col-span-6 md:col-span-2">
               <label className="text-xs font-semibold text-slate-500 mb-1 block">Frequency</label>
               <Select value={newMed.frequency} onValueChange={(val) => setNewMed({...newMed, frequency: val})}>
                  <SelectTrigger className="bg-white h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="1-0-1">1-0-1</SelectItem>
                     <SelectItem value="1-0-0">1-0-0</SelectItem>
                     <SelectItem value="0-0-1">0-0-1</SelectItem>
                     <SelectItem value="1-1-1">1-1-1</SelectItem>
                     <SelectItem value="SOS">SOS</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="col-span-6 md:col-span-2">
               <label className="text-xs font-semibold text-slate-500 mb-1 block">Duration</label>
               <Input 
                 placeholder="5 Days" 
                 value={newMed.duration}
                 onChange={(e) => setNewMed({...newMed, duration: e.target.value})}
                 onKeyDown={handleKeyPress}
                 className="bg-white"
               />
            </div>
            <div className="col-span-12 md:col-span-3">
               <label className="text-xs font-semibold text-slate-500 mb-1 block">Instructions</label>
               <Input 
                 placeholder="After food" 
                 value={newMed.instructions}
                 onChange={(e) => setNewMed({...newMed, instructions: e.target.value})}
                 onKeyDown={handleKeyPress}
                 className="bg-white"
               />
            </div>
            <div className="col-span-12 md:col-span-1">
               <Button onClick={addMedicine} size="icon" className="w-full bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="w-5 h-5" />
               </Button>
            </div>
         </div>
      </div>

      {/* 2. Medicine List Table */}
      <div className="flex-1 border rounded-xl overflow-hidden bg-white">
         <Table>
            <TableHeader className="bg-slate-50">
               <TableRow>
                  <TableHead className="w-[40%]">Medicine</TableHead>
                  <TableHead>Freq</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Instr.</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {medicines.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                        No medicines added yet.
                     </TableCell>
                  </TableRow>
               ) : (
                  medicines.map((med) => (
                     <TableRow key={med.id}>
                        <TableCell className="font-medium text-slate-900">{med.name}</TableCell>
                        <TableCell>{med.frequency}</TableCell>
                        <TableCell>{med.duration}</TableCell>
                        <TableCell className="text-slate-500 text-xs">{med.instructions}</TableCell>
                        <TableCell>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeMedicine(med.id)}>
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </TableCell>
                     </TableRow>
                  ))
               )}
            </TableBody>
         </Table>
      </div>
    </div>
  )
}
