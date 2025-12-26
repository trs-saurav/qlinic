import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ComingSoon({ title, description }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <Badge variant="secondary">Coming soon</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {description || 'This section will be available in an upcoming update.'}
        </p>
      </CardContent>
    </Card>
  )
}
