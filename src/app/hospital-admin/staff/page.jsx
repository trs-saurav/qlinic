// src/app/hospital/staff/page.jsx
'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Staff & Payroll</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage doctors and staff members</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Performance & Payroll</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Payout</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No staff members added yet
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
