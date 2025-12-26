import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function BillingSettingsPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle className="text-2xl">Billing & Payments</CardTitle>
        <Badge variant="secondary">Coming soon</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Payment methods, invoices and subscription configuration will appear here.
        </p>
      </CardContent>
    </Card>
  )
}
