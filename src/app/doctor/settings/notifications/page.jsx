'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function DoctorNotificationsSettingsPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Notifications</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure appointment reminders and updates.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-semibold">Appointment reminders</Label>
            <p className="text-xs text-muted-foreground">Remind before upcoming appointments.</p>
          </div>
          <Switch defaultChecked />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-semibold">New appointment requests</Label>
            <p className="text-xs text-muted-foreground">Get notified when a hospital assigns an appointment.</p>
          </div>
          <Switch defaultChecked />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-semibold">SMS alerts</Label>
            <p className="text-xs text-muted-foreground">Receive urgent updates via SMS.</p>
          </div>
          <Switch />
        </div>

        <div className="flex justify-end">
          <Button className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
        </div>
      </CardContent>
    </Card>
  )
}
