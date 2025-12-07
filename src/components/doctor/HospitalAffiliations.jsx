// src/components/doctor/HospitalAffiliations.jsx
'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building2, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  MapPin,
  Search,
  IndianRupee
} from 'lucide-react'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function HospitalAffiliations({ doctorId }) {
  const [affiliations, setAffiliations] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [newRequest, setNewRequest] = useState({
    hospitalId: '',
    consultationFee: '',
    availableDays: [],
    notes: ''
  })

  useEffect(() => {
    fetchAffiliations()
  }, [])

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchHospitals()
    } else {
      setHospitals([])
    }
  }, [searchQuery])

  const fetchAffiliations = async () => {
    try {
      const response = await fetch('/api/doctor/affiliations')
      const data = await response.json()
      
      if (data.affiliations) {
        setAffiliations(data.affiliations)
      }
    } catch (error) {
      console.error('Error fetching affiliations:', error)
    }
  }

  const searchHospitals = async () => {
    try {
      const response = await fetch(`/api/hospitals/search?q=${searchQuery}`)
      const data = await response.json()
      
      if (data.hospitals) {
        setHospitals(data.hospitals)
      }
    } catch (error) {
      console.error('Error searching hospitals:', error)
    }
  }

  const toggleDay = (day) => {
    setNewRequest(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }))
  }

  const handleSubmitRequest = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const loadingToast = toast.loading('Sending request...')

    try {
      const response = await fetch('/api/doctor/affiliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Request sent successfully', { id: loadingToast })
        setIsDialogOpen(false)
        setNewRequest({
          hospitalId: '',
          consultationFee: '',
          availableDays: [],
          notes: ''
        })
        setSearchQuery('')
        fetchAffiliations()
      } else {
        toast.error(data.error || 'Failed to send request', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error sending request:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRespondToRequest = async (affiliationId, status) => {
    const loadingToast = toast.loading(`${status === 'APPROVED' ? 'Accepting' : 'Rejecting'} request...`)

    try {
      const response = await fetch(`/api/doctor/affiliations/${affiliationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          status === 'APPROVED' ? '✅ Request accepted!' : '❌ Request rejected',
          { id: loadingToast }
        )
        fetchAffiliations()
      } else {
        toast.error('Failed to update request', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error updating request:', error)
      toast.error('Something went wrong', { id: loadingToast })
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return null
    }
  }

  const activeAffiliations = affiliations.filter(a => a.status === 'APPROVED')
  const pendingRequests = affiliations.filter(a => a.status === 'PENDING')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hospital Affiliations</h2>
          <p className="text-slate-500 mt-1">Manage your hospital connections</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Request Affiliation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Hospital Affiliation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitRequest} className="space-y-6">
              {/* Hospital Search */}
              <div className="space-y-3">
                <Label>Search Hospital <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search by hospital name or city..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {hospitals.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {hospitals.map(hospital => (
                      <div
                        key={hospital._id}
                        onClick={() => {
                          setNewRequest({ ...newRequest, hospitalId: hospital._id })
                          setSearchQuery(hospital.name)
                          setHospitals([])
                        }}
                        className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                          newRequest.hospitalId === hospital._id ? 'bg-primary/5' : ''
                        }`}
                      >
                        <h4 className="font-semibold text-slate-900">{hospital.name}</h4>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {hospital.city}, {hospital.state}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consultation Fee */}
              <div className="space-y-2">
                <Label htmlFor="fee">Your Consultation Fee (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    value={newRequest.consultationFee}
                    onChange={e => setNewRequest({ ...newRequest, consultationFee: e.target.value })}
                    placeholder="500"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Available Days */}
              <div className="space-y-3">
                <Label>Available Days at this Hospital</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DAYS_OF_WEEK.map(day => (
                    <label
                      key={day}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        newRequest.availableDays.includes(day)
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newRequest.availableDays.includes(day)}
                        onChange={() => toggleDay(day)}
                        className="hidden"
                      />
                      {newRequest.availableDays.includes(day) && (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      {day.substring(0, 3)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <textarea
                  id="notes"
                  rows={3}
                  value={newRequest.notes}
                  onChange={e => setNewRequest({ ...newRequest, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Any additional information for the hospital..."
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                disabled={isLoading || !newRequest.hospitalId}
              >
                {isLoading ? 'Sending...' : 'Send Request'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Affiliations</p>
                <p className="text-3xl font-bold text-green-600">{activeAffiliations.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Hospital Invitations */}
      {pendingRequests.some(a => a.requestType === 'HOSPITAL_TO_DOCTOR') && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Pending Hospital Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests
                .filter(a => a.requestType === 'HOSPITAL_TO_DOCTOR')
                .map(affiliation => (
                  <div key={affiliation._id} className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900">{affiliation.hospitalId?.name}</h4>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {affiliation.hospitalId?.city}
                        </p>
                        {affiliation.notes && (
                          <p className="text-sm text-slate-600 mt-2 italic">"{affiliation.notes}"</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleRespondToRequest(affiliation._id, 'APPROVED')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRespondToRequest(affiliation._id, 'REJECTED')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Affiliations */}
      <Card>
        <CardHeader>
          <CardTitle>All Affiliations</CardTitle>
        </CardHeader>
        <CardContent>
          {affiliations.length > 0 ? (
            <div className="space-y-3">
              {affiliations.map(affiliation => (
                <div
                  key={affiliation._id}
                  className="p-4 border rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {affiliation.hospitalId?.name}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {affiliation.hospitalId?.city}, {affiliation.hospitalId?.state}
                          </p>
                        </div>
                        {getStatusBadge(affiliation.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        {affiliation.consultationFee && (
                          <div>
                            <p className="text-slate-500">Consultation Fee</p>
                            <p className="font-semibold">₹{affiliation.consultationFee}</p>
                          </div>
                        )}
                        {affiliation.availableDays && affiliation.availableDays.length > 0 && (
                          <div>
                            <p className="text-slate-500">Available Days</p>
                            <p className="font-semibold">
                              {affiliation.availableDays.map(d => d.substring(0, 3)).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                        <span>
                          Request Type: {affiliation.requestType === 'DOCTOR_TO_HOSPITAL' ? 'You → Hospital' : 'Hospital → You'}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(affiliation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No hospital affiliations yet</p>
              <p className="text-sm mt-1">Request affiliation to start working with hospitals</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
