// src/components/patient/HospitalProfile.jsx
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Clock,
  Building2,
  Award,
  Bed,
  Stethoscope,
  Calendar,
  Star,
  CheckCircle
} from 'lucide-react'
import DoctorCard from './DoctorCard'
import BookAppointmentModal from './BookAppointmentModal'

export default function HospitalProfile({ hospital, onClose }) {
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHospitalDetails()
  }, [hospital._id])

  const fetchHospitalDetails = async () => {
    try {
      const response = await fetch(`/api/patient/hospitals/${hospital._id}`)
      const data = await response.json()

      if (data.doctors) {
        setDoctors(data.doctors)
      }
    } catch (error) {
      console.error('Error fetching hospital details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor)
    setIsBookingModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-4 bg-primary/10 rounded-xl">
          <Building2 className="w-12 h-12 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">{hospital.name}</h2>
          {hospital.address && (
            <p className="text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {hospital.address.street && `${hospital.address.street}, `}
              {hospital.address.city}, {hospital.address.state} - {hospital.address.pincode}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="capitalize">{hospital.type}</Badge>
            {hospital.isOpen24x7 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Open 24x7
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hospital.contactDetails?.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <a href={`tel:${hospital.contactDetails.phone}`} className="hover:text-primary">
                {hospital.contactDetails.phone}
              </a>
            </div>
          )}
          {hospital.contactDetails?.emergencyNumber && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <Phone className="w-4 h-4" />
              <a href={`tel:${hospital.contactDetails.emergencyNumber}`} className="hover:text-red-700 font-semibold">
                Emergency: {hospital.contactDetails.emergencyNumber}
              </a>
            </div>
          )}
          {hospital.contactDetails?.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <a href={`mailto:${hospital.contactDetails.email}`} className="hover:text-primary">
                {hospital.contactDetails.email}
              </a>
            </div>
          )}
          {hospital.contactDetails?.website && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Globe className="w-4 h-4 text-slate-400" />
              <a href={hospital.contactDetails.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                Visit Website
              </a>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Hospital Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {hospital.totalBeds && (
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Bed className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{hospital.totalBeds}</p>
            <p className="text-xs text-slate-500">Total Beds</p>
          </div>
        )}
        {hospital.totalDoctors && (
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Stethoscope className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{hospital.totalDoctors}</p>
            <p className="text-xs text-slate-500">Doctors</p>
          </div>
        )}
        {hospital.departments && (
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{hospital.departments.length}</p>
            <p className="text-xs text-slate-500">Departments</p>
          </div>
        )}
        {hospital.established && (
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Award className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">
              {new Date().getFullYear() - new Date(hospital.established).getFullYear()}+
            </p>
            <p className="text-xs text-slate-500">Years</p>
          </div>
        )}
      </div>

      {/* Facilities */}
      {hospital.facilities && hospital.facilities.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Facilities & Services
            </h3>
            <div className="flex flex-wrap gap-2">
              {hospital.facilities.map((facility, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  {facility}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Departments */}
      {hospital.departments && hospital.departments.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Departments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hospital.departments.map((dept, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900">{dept.name}</p>
                  {dept.headOfDepartment && (
                    <p className="text-sm text-slate-500">HOD: {dept.headOfDepartment}</p>
                  )}
                  {dept.bedCount && (
                    <p className="text-xs text-slate-400">{dept.bedCount} beds</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Accreditations */}
      {hospital.accreditations && hospital.accreditations.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Accreditations & Certifications
            </h3>
            <div className="flex flex-wrap gap-2">
              {hospital.accreditations.map((acc, idx) => (
                <Badge key={idx} variant="outline" className="text-sm">
                  <Award className="w-3 h-3 mr-1" />
                  {acc}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Available Doctors */}
      <Separator />
      <div>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          Available Doctors ({doctors.length})
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : doctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doctor) => (
              <DoctorCard 
                key={doctor._id} 
                doctor={doctor}
                onBookAppointment={() => handleBookAppointment(doctor)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Stethoscope className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No doctors available at the moment</p>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      {selectedDoctor && (
        <BookAppointmentModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false)
            setSelectedDoctor(null)
          }}
          doctor={selectedDoctor}
          hospital={hospital}
        />
      )}
    </div>
  )
}
