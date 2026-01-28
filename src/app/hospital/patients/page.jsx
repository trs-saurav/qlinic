// src/app/hospital/patients/page.jsx
'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Patient Database</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">View all registered patients</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Patients</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input placeholder="Search by name or phone..." className="pl-10 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Age/Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Visits</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Last Visit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No patients found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
