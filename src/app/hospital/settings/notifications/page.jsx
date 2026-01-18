'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export default function NotificationsSettingsPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Notifications</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure email, SMS and in-app alerts.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-semibold">Email alerts</Label>
            <p className="text-xs text-muted-foreground">Receive updates via email.</p>
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

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-semibold">Push notifications</Label>
            <p className="text-xs text-muted-foreground">In-app notifications.</p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  )
}
