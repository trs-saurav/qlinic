// src/app/hospital/feedback/page.jsx
'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Patient Feedback</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">View ratings and reviews</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Rating</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold text-yellow-500 mb-2">4.8</div>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-slate-500">Based on 0 reviews</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-center py-8">No reviews yet</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
