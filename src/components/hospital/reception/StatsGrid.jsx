'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Activity, Users, CheckCircle2 } from 'lucide-react'

export default function StatsGrid({ stats }) {
  const cards = [
    { label: 'Waiting Queue', value: stats.waiting, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'In Consultation', value: stats.inConsult, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Visits', value: stats.total, icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <Card key={idx} className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </div>
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
