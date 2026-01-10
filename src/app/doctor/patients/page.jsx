'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Phone, Mail, MapPin, FileText } from 'lucide-react'

// Mock Data (Replace with API call to /api/doctor/patients)
const MOCK_PATIENTS = [
  { id: 1, name: "Rahul Kumar", age: 28, gender: "Male", phone: "9876543210", city: "Patna", lastVisit: "2024-01-08" },
  { id: 2, name: "Priya Singh", age: 34, gender: "Female", phone: "9123456789", city: "Delhi", lastVisit: "2024-01-05" },
]

export default function PatientDirectory() {
  const [query, setQuery] = useState('')

  // Filter logic would normally happen on backend for large datasets
  const filtered = MOCK_PATIENTS.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) || 
    p.phone.includes(query)
  )

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Patients</h1>
          <p className="text-slate-500 mt-1">Directory of all patients you have treated.</p>
        </div>
        <Button variant="outline">Export Data</Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or phone number..." 
              className="pl-10 h-10"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(patient => (
          <Card key={patient.id} className="hover:border-blue-300 transition-colors cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage />
                  <AvatarFallback className="bg-slate-100 font-bold text-slate-700">
                    {patient.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-slate-900 truncate group-hover:text-blue-600">
                    {patient.name}
                  </h3>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <span>{patient.gender}, {patient.age}y</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {patient.phone}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {patient.city}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t mt-3">
                   <FileText className="h-3.5 w-3.5 text-slate-400" />
                   <span className="text-xs">Last Visit: {patient.lastVisit}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
