import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Stethoscope, Phone, Calendar, Pill, Activity, FileText, 
  ExternalLink, CalendarPlus, Edit 
} from 'lucide-react'

export default function AppointmentDetailsModal({ appointment, isOpen, onClose, onBookNextVisit }) {
  if (!appointment) return null

  // Helpers
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' })
  const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { timeStyle: 'short' })
  
  const getStatusConfig = (status) => {
    const configs = {
      'BOOKED': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Booked' },
      'CHECKED_IN': { bg: 'bg-green-100', text: 'text-green-700', label: 'Checked In' },
      'IN_CONSULTATION': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Consultation' },
      'COMPLETED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
      'CANCELLED': { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
      'SKIPPED': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Skipped' }
    }
    return configs[status] || configs['BOOKED']
  }

  const statusConfig = getStatusConfig(appointment.status)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Appointment Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Header */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium text-foreground">Current Status</span>
            <Badge className={`${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Doctor Info */}
          <div className="bg-secondary p-4 rounded-lg border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" /> Doctor Information
            </h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> <strong>Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}</strong></p>
              <p><span className="text-muted-foreground">Specialization:</span> {appointment.doctorId?.doctorProfile?.specialization}</p>
              {appointment.doctorId?.doctorProfile?.consultationFee && (
                <p><span className="text-muted-foreground">Fee:</span> ₹{appointment.doctorId.doctorProfile.consultationFee}</p>
              )}
            </div>
          </div>

          {/* Hospital Info */}
          <div>
            <h3 className="font-semibold mb-3">Hospital Information</h3>
            <div className="space-y-2 text-sm pl-2 border-l-2 border">
              <p className="font-medium">{appointment.hospitalId?.name}</p>
              <p className="text-muted-foreground">
                {appointment.hospitalId?.address?.street}, {appointment.hospitalId?.address?.city}
              </p>
              {appointment.hospitalId?.contactDetails?.phone && (
                <p className="flex items-center gap-2 text-primary">
                  <Phone className="w-3 h-3" /> {appointment.hospitalId.contactDetails.phone}
                </p>
              )}
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 bg-muted rounded text-center">
              <p className="text-muted-foreground text-xs uppercase">Date</p>
              <p className="font-semibold">{formatDate(appointment.scheduledTime)}</p>
            </div>
            <div className="p-3 bg-muted rounded text-center">
              <p className="text-muted-foreground text-xs uppercase">Time</p>
              <p className="font-semibold">{formatTime(appointment.scheduledTime)}</p>
            </div>
            {appointment.tokenNumber && (
              <div className="p-3 bg-muted rounded text-center">
                <p className="text-muted-foreground text-xs uppercase">Token</p>
                <p className="font-semibold text-primary">#{appointment.tokenNumber}</p>
              </div>
            )}
            <div className="p-3 bg-muted rounded text-center">
              <p className="text-muted-foreground text-xs uppercase">Type</p>
              <p className="font-semibold">{appointment.type || 'Regular'}</p>
            </div>
          </div>

          {/* Vitals Section */}
          {appointment.vitals && Object.values(appointment.vitals).some(v => v) && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" /> Vitals
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                 {appointment.vitals.temperature && <div className="p-2 bg-red-50 rounded text-center border border-red-100"><span className="block text-xs text-muted-foreground">Temp</span><span className="font-bold text-red-700">{appointment.vitals.temperature}°F</span></div>}
                 {appointment.vitals.weight && <div className="p-2 bg-blue-50 rounded text-center border border-blue-100"><span className="block text-xs text-muted-foreground">Weight</span><span className="font-bold text-blue-700">{appointment.vitals.weight}kg</span></div>}
                 {appointment.vitals.bpSystolic && <div className="p-2 bg-purple-50 rounded text-center border border-purple-100"><span className="block text-xs text-muted-foreground">BP</span><span className="font-bold text-purple-700">{appointment.vitals.bpSystolic}/{appointment.vitals.bpDiastolic}</span></div>}
                 {appointment.vitals.spo2 && <div className="p-2 bg-green-50 rounded text-center border border-green-100"><span className="block text-xs text-muted-foreground">SpO2</span><span className="font-bold text-green-700">{appointment.vitals.spo2}%</span></div>}
              </div>
            </div>
          )}

          {/* Diagnosis & Prescription */}
          {(appointment.diagnosis || (appointment.prescription && appointment.prescription.length > 0)) && (
            <div className="space-y-4">
              {appointment.diagnosis && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                   <h4 className="font-semibold text-yellow-900 mb-1">Diagnosis</h4>
                   <p className="text-yellow-800">{appointment.diagnosis}</p>
                </div>
              )}
              
              {appointment.prescription && appointment.prescription.length > 0 && (
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4" /> Prescription
                  </h4>
                  <div className="space-y-2">
                    {appointment.prescription.map((med, i) => (
                      <div key={i} className="bg-background p-3 rounded border border-emerald-100 shadow-sm">
                        <p className="font-medium text-emerald-900">{med.name}</p>
                        <p className="text-xs text-muted-foreground">{med.dosage} • {med.frequency} • {med.duration}</p>
                        {med.instructions && <p className="text-xs text-muted-foreground italic mt-1">{med.instructions}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next Visit Card */}
          {appointment.nextVisit?.date && (
            <div 
              className="bg-linear-to-r from-purple-50 to-indigo-50 p-5 rounded-lg border-2 border-purple-200 hover:border-purple-400 cursor-pointer group"
              onClick={() => {
                const nextDate = new Date(appointment.nextVisit.date)
                onBookNextVisit({
                  parentAppointmentId: appointment._id,
                  doctorId: appointment.doctorId._id,
                  hospitalId: appointment.hospitalId._id,
                  scheduledDate: nextDate.toISOString().split('T')[0],
                  scheduledTime: nextDate.toTimeString().slice(0, 5),
                  reason: appointment.nextVisit.reason || '',
                  instructions: appointment.nextVisit.instructions || ''
                })
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-600 p-2 rounded-lg text-white"><CalendarPlus className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-purple-900">Next Visit Scheduled</h4>
                    <p className="text-sm text-purple-700 font-medium">{formatDate(appointment.nextVisit.date)}</p>
                  </div>
                </div>
                <Badge className="bg-purple-600 hover:bg-purple-700">Update</Badge>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
