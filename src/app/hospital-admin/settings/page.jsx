// src/app/hospital/settings/page.jsx
'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Hospital Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Configure general settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Hospital Name</Label>
            <Input className="mt-1" placeholder="Enter hospital name" />
          </div>
          
          <div>
            <Label>Consultation Fee (₹)</Label>
            <Input type="number" className="mt-1" placeholder="500" />
          </div>

          <div>
            <Label>Operating Hours</Label>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <Input type="time" placeholder="Opening" />
              <Input type="time" placeholder="Closing" />
            </div>
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 mt-6">
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
