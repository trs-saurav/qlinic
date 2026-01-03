// src/components/patient/DoctorCard.jsx
'use client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Stethoscope, 
  Calendar,
  Award,
  Clock,
  Star,
  MapPin
} from 'lucide-react'

export default function DoctorCard({ doctor, onBookAppointment }) {
  const experience = doctor.doctorProfile?.yearsOfExperience || 0

  return (
    <div className="p-4 border-2 border-slate-100 rounded-lg hover:border-primary hover:shadow-lg transition-all">
      <div className="flex items-start gap-4">
        {/* Doctor Avatar */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {doctor.firstName[0]}{doctor.lastName[0]}
        </div>

        {/* Doctor Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 truncate">
            Dr. {doctor.firstName} {doctor.lastName}
          </h4>
          <p className="text-sm text-primary font-medium">
            {doctor.doctorProfile?.specialization}
          </p>
          
          {/* Experience & Availability */}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            {experience > 0 && (
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                {experience}+ yrs
              </span>
            )}
            {doctor.doctorProfile?.consultationFee && (
              <span className="font-semibold text-slate-700">
                ₹{doctor.doctorProfile.consultationFee}
              </span>
            )}
          </div>

          {/* Availability Badge */}
          <div className="mt-2">
            {doctor.doctorProfile?.isAvailable ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                Available
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                Not Available
              </Badge>
            )}
          </div>

          {/* Book Button */}
          <Button 
            size="sm" 
            className="w-full mt-3"
            onClick={onBookAppointment}
            disabled={!doctor.doctorProfile?.isAvailable}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  )
}
