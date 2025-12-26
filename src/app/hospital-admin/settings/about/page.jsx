import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">About Qlinic</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Show version, environment, uptime, release notes, etc.
        </p>
      </CardContent>
    </Card>
  )
}
