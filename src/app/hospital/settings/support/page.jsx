import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SupportPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Help & Support</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Add FAQs, WhatsApp/contact info, and ticket support here.
        </p>
      </CardContent>
    </Card>
  )
}
