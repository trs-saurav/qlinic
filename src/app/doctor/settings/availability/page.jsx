'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export default function DoctorAvailabilitySettingsPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Availability</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set default working hours (quick presets for your schedule).
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Start time</Label>
            <Input type="time" />
          </div>
          <div>
            <Label>End time</Label>
            <Input type="time" />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Break start</Label>
            <Input type="time" />
          </div>
          <div>
            <Label>Break end</Label>
            <Input type="time" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
        </div>
      </CardContent>
    </Card>
  )
}
