import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function StaffSettingsPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle className="text-2xl">Staff Management</CardTitle>
        <Badge variant="secondary">Admin only</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Manage staff roles & permissions. (You can later connect this to “Sub Users”.)
        </p>
      </CardContent>
    </Card>
  )
}
