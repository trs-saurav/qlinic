// src/app/user/appointments/components/AppointmentCard.jsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, Stethoscope, User, CheckCircle, XCircle } from 'lucide-react'

export default function AppointmentCard({ 
  appointment, 
  activeTab, 
  familyMemberFilter, // FIXED: Prop received here
  onViewDetails, 
  onCancel, 
  onComplete,
  onReschedule 
}) {
  
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })
  
  const formatTime = (date) => new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  })

  return (
    <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary/50">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          
          {/* Main Info */}
          <div className="flex-1 space-y-2">
             {/* Family Member Tag */}
             {familyMemberFilter !== 'self' && appointment.patientId && (
                <Badge variant="secondary" className="mb-2">
                  <User className="w-3 h-3 mr-1" />
                  {appointment.patientId.firstName} {appointment.patientId.lastName}
                </Badge>
              )}

            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {appointment.hospitalId?.name}
                </p>
              </div>
              
              <div className="text-right">
                <div className="bg-muted px-3 py-1 rounded-lg">
                  <p className="font-bold text-foreground">{formatTime(appointment.scheduledTime)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(appointment.scheduledTime)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
               <Badge variant="outline" className={getStatusColor(appointment.status)}>
                 {appointment.status.replace('_', ' ')}
               </Badge>
               {appointment.type === 'EMERGENCY' && <Badge variant="destructive">Emergency</Badge>}
            </div>
          </div>

          {/* Action Buttons (Switch Logic) */}
          <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4 mt-4 md:mt-0">
            <Button size="sm" variant="outline" onClick={onViewDetails}>
              Details
            </Button>

            {/* ONGOING ACTIONS */}
            {activeTab === 'ongoing' && (
              <>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onComplete}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Complete
                </Button>
                <Button size="sm" variant="destructive" onClick={onCancel}>
                  Cancel
                </Button>
              </>
            )}

            {/* UPCOMING ACTIONS */}
            {activeTab === 'upcoming' && (
              <>
                <Button size="sm" variant="outline" className="text-blue-600" onClick={() => onReschedule(appointment)}>
                  Reschedule
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={onCancel}>
                  Cancel
                </Button>
              </>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  )
}

function getStatusColor(status) {
  const map = {
    'BOOKED': 'text-blue-600 bg-blue-50',
    'COMPLETED': 'text-green-600 bg-green-50',
    'CANCELLED': 'text-red-600 bg-red-50',
    'IN_CONSULTATION': 'text-yellow-600 bg-yellow-50',
    'CHECKED_IN': 'text-purple-600 bg-purple-50'
  }
  return map[status] || 'text-slate-600'
}
