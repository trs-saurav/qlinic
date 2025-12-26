'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function DoctorSecuritySettingsPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Privacy & Security</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage security and privacy preferences.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-semibold">Two-factor authentication</Label>
            <p className="text-xs text-muted-foreground">Add an extra layer of security.</p>
          </div>
          <Switch />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-semibold">Hide phone number</Label>
            <p className="text-xs text-muted-foreground">Only show phone to affiliated hospitals.</p>
          </div>
          <Switch defaultChecked />
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline">Manage sessions</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
        </div>
      </CardContent>
    </Card>
  )
}
