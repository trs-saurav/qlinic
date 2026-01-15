'use client'
import { Badge } from '@/components/ui/badge'
import { Calendar, UserX, CheckCheck, Archive } from 'lucide-react'

export default function AppointmentHistoryList({ history }) {
  
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400">
        <Archive className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No recent history</p>
      </div>
    )
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'COMPLETED':
        return { 
          color: 'bg-green-50 text-green-700 border-green-200', 
          icon: <CheckCheck className="w-3 h-3" />,
          label: 'Completed'
        }
      case 'CANCELLED':
        return { 
          color: 'bg-red-50 text-red-700 border-red-200', 
          icon: <UserX className="w-3 h-3" />,
          label: 'Cancelled'
        }
      case 'SKIPPED':
        return { 
          color: 'bg-orange-50 text-orange-700 border-orange-200', 
          icon: <Calendar className="w-3 h-3" />,
          label: 'Skipped'
        }
      default:
        return { 
          color: 'bg-slate-50 text-slate-700 border-slate-200', 
          icon: null,
          label: status
        }
    }
  }

  return (
    <div className="space-y-2">
      {history.map((apt) => {
        const config = getStatusConfig(apt.status)
        
        return (
          <div 
            key={apt._id}
            className="group p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm transition-all"
          >
            <div className="flex justify-between items-start mb-2">
               <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                     {apt.patientId?.firstName} {apt.patientId?.lastName}
                  </h4>
                  <p className="text-xs text-slate-500">
                     {new Date(apt.updatedAt || apt.scheduledTime).toLocaleDateString()} at {new Date(apt.scheduledTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </p>
               </div>
               <Badge variant="outline" className={`text-[10px] px-2 py-0.5 h-6 gap-1 ${config.color} border`}>
                  {config.icon} {config.label}
               </Badge>
            </div>
            
            {/* Show diagnosis if completed, or cancel reason if cancelled */}
            {apt.status === 'COMPLETED' && apt.diagnosis && (
               <div className="bg-slate-50 px-2 py-1.5 rounded text-xs text-slate-600 truncate">
                  <span className="font-semibold">Dx:</span> {apt.diagnosis}
               </div>
            )}

            {apt.status === 'CANCELLED' && apt.cancelReason && (
               <div className="bg-red-50 px-2 py-1.5 rounded text-xs text-red-600 truncate">
                  Reason: {apt.cancelReason}
               </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
