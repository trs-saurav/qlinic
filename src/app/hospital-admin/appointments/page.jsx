'use client'

import { useState, useEffect } from 'react'
import { useHospitalAdmin } from '@/context/HospitalAdminContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Calendar, User, Printer } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function HospitalAppointmentsPage() {
  const { appointments, fetchAppointments, fetchDoctors, doctors, loading: contextLoading, updateAppointmentStatus } = useHospitalAdmin()
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [doctorFilter, setDoctorFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAppointments(),
        fetchDoctors()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchAppointments, fetchDoctors])



  // ✅ SMART QUEUE INTEGRATION
  const handleStatusChange = async (appointmentId, newStatus) => {
    const loadingToast = toast.loading('Processing...')

    try {
      let result;
      
      // Special Logic for Check-In (Generates Token)
      if (newStatus === 'CHECKED_IN') {
        // For check-in, we need to call the check-in endpoint
        const response = await fetch('/api/appointment/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointmentId })
        });
        
        const data = await response.json();
        
        if (data.success || response.ok) {
          toast.success(
            `Checked In! Token #${data.tokenNumber || 'Assigned'}`, 
            { id: loadingToast }
          );
          fetchAppointments(); // Refresh list
        } else {
          toast.error(data.error || 'Check-in failed', { id: loadingToast });
        }
      } else {
        // Use context function for standard status updates
        result = await updateAppointmentStatus(appointmentId, newStatus);
        
        if (result.success) {
          toast.success('Status updated', { id: loadingToast });
          fetchAppointments(); // Refresh list
        } else {
          toast.error(result.error || 'Update failed', { id: loadingToast });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error', { id: loadingToast });
    }
  }

  // Filter Logic
  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter
    const matchesDoctor = doctorFilter === 'ALL' || apt.doctorId?._id === doctorFilter
    const matchesType = typeFilter === 'ALL' || apt.appointmentType === typeFilter

    if (!searchQuery) return matchesStatus && matchesDoctor && matchesType

    const query = searchQuery.toLowerCase()
    const name = `${apt.patientId?.firstName} ${apt.patientId?.lastName}`.toLowerCase()
    const phone = apt.patientId?.phoneNumber || ''
    const token = apt.tokenNumber?.toString() || ''

    return matchesStatus && matchesDoctor && matchesType && 
           (name.includes(query) || phone.includes(query) || token.includes(query))
  })

  // Helper: Status Colors
  const getStatusColor = (status) => {
    const colors = {
      BOOKED: 'bg-blue-50 text-blue-700 border-blue-200',
      CHECKED_IN: 'bg-green-100 text-green-700 border-green-200', // Green implies active queue
      IN_CONSULTATION: 'bg-purple-100 text-purple-700 border-purple-200 animate-pulse',
      COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
      CANCELLED: 'bg-red-50 text-red-700 border-red-200',
      SKIPPED: 'bg-orange-50 text-orange-700 border-orange-200'
    }
    return colors[status] || 'bg-slate-50 text-slate-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 mt-1">Manage check-ins and queue flow</p>
        </div>
        <div className="flex gap-3">
          <Link href="/hospital-admin/reception">
            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
              <User className="w-4 h-4 mr-2" /> Walk-In Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by Patient Name, Phone, or Token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="BOOKED">Booked (Pre-Arrival)</SelectItem>
                <SelectItem value="CHECKED_IN">Checked In (Queue)</SelectItem>
                <SelectItem value="IN_CONSULTATION">In Consult</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="SKIPPED">Skipped</SelectItem>
              </SelectContent>
            </Select>

            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Doctors</SelectItem>
                {doctors.map(doc => (
                  <SelectItem key={doc._id} value={doc._id}>
                    Dr. {doc.firstName} {doc.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="overflow-hidden border-t-4 border-t-emerald-600">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Token</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map(apt => (
                  <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Token Column */}
                    <td className="px-6 py-4">
                      {apt.tokenNumber ? (
                        <div className="flex items-center gap-2">
                           <span className="font-mono font-bold text-xl text-slate-800">#{apt.tokenNumber}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded">--</span>
                      )}
                    </td>

                    {/* Patient Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border bg-white">
                          <AvatarFallback className="bg-emerald-50 text-emerald-700">
                            {apt.patientId?.firstName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {apt.patientId?.firstName} {apt.patientId?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{apt.patientId?.phoneNumber}</p>
                        </div>
                      </div>
                    </td>

                    {/* Doctor Column */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">
                        {apt.doctorId?.doctorProfile?.specialization || 'General'}
                      </div>
                    </td>

                    {/* Time Column */}
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(apt.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`${getStatusColor(apt.status)} font-semibold`}>
                        {apt.status.replace('_', ' ')}
                      </Badge>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          {/* Smart Action Button Logic */}
                          {apt.status === 'BOOKED' && (
                             <Button size="sm" onClick={() => handleStatusChange(apt._id, 'CHECKED_IN')} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8">
                               Check In
                             </Button>
                          )}
                          
                          {apt.status === 'CHECKED_IN' && (
                             <Button size="sm" variant="outline" className="h-8 text-slate-500">
                               Waiting...
                             </Button>
                          )}

                          {/* Fallback Dropdown for manual corrections */}
                          <Select 
                            value={apt.status} 
                            onValueChange={(val) => handleStatusChange(apt._id, val)}
                          >
                            <SelectTrigger className="w-[32px] h-8 px-0 border-0 hover:bg-slate-100">
                               <Printer className="w-4 h-4 text-slate-400" /> {/* Just an icon for "More" actions */}
                            </SelectTrigger>
                            <SelectContent align="end">
                              <SelectItem value="CHECKED_IN">Force Check In</SelectItem>
                              <SelectItem value="CANCELLED">Cancel Appointment</SelectItem>
                              <SelectItem value="COMPLETED">Mark Completed</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p>No appointments matching filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
