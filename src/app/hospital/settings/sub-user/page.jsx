import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SubUsersPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle className="text-2xl">Sub Users</CardTitle>
        <Badge variant="secondary">Coming soon</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Add receptionist/accounts sub-logins with limited permissions.
        </p>
      </CardContent>
    </Card>
  )
}
