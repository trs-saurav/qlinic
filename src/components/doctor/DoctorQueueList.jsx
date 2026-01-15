'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Play, SkipForward, AlertCircle } from 'lucide-react'

export default function DoctorQueueList({ queue, currentPatientId, onSkip }) {
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400">
        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No patients in queue</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {queue.map((apt) => {
        const isActive = apt._id === currentPatientId
        return (
          <div 
            key={apt._id}
            className={`
              relative p-3 rounded-xl border transition-all
              ${isActive 
                ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100' 
                : 'bg-white border-slate-100 hover:border-blue-100 hover:bg-slate-50'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1">
                 <Badge variant={isActive ? "default" : "outline"} className="h-6 min-w-[2.5rem] justify-center">
                    #{apt.tokenNumber}
                 </Badge>
                 <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {new Date(apt.scheduledTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                 </span>
              </div>
              
              <div className="flex-1 min-w-0">
                 <h4 className={`font-bold text-sm truncate ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                    {apt.patientId?.firstName} {apt.patientId?.lastName}
                 </h4>
                 <p className="text-xs text-slate-500 truncate">
                    {apt.reason || 'Regular Checkup'}
                 </p>
                 <div className="flex items-center gap-2 mt-1.5">
                    {apt.patientId?.gender && <Badge variant="secondary" className="text-[10px] px-1 h-5">{apt.patientId.gender}</Badge>}
                    {apt.patientId?.age && <Badge variant="secondary" className="text-[10px] px-1 h-5">{apt.patientId.age}y</Badge>}
                 </div>
              </div>
              
              {!isActive && (
                <div className="flex flex-col gap-1">
                   {/* Actions are handled by main controller usually, but quick skip is good here */}
                   <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-orange-500" onClick={() => onSkip(apt._id)}>
                      <SkipForward className="w-4 h-4" />
                   </Button>
                </div>
              )}
            </div>
            
            {isActive && (
               <div className="absolute right-2 top-2">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
               </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
