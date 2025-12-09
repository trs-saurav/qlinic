// src/app/hospital/reports/page.jsx
'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Reports & Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Generate and export reports</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Patient Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
            <p className="text-slate-400">Chart will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
