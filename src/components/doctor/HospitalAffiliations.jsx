// src/components/doctor/HospitalAffiliations.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'
import { 
  Hospital, CheckCircle, XCircle, Clock, 
  MapPin, Phone, Mail, Loader2, AlertCircle 
} from 'lucide-react'

export default function HospitalAffiliations() {
  const [affiliations, setAffiliations] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchAffiliations()
  }, [])

  const fetchAffiliations = async () => {
    try {
      const response = await fetch('/api/doctor/affiliations')
      const data = await response.json()

      if (data.success) {
        setAffiliations(data.affiliations || [])
        setPendingRequests(data.pendingRequests || [])
      }
    } catch (error) {
      console.error('Error fetching affiliations:', error)
      toast.error('Failed to load affiliations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequest = async (requestId, action) => {
    setProcessingId(requestId)
    const loadingToast = toast.loading(`${action === 'accept' ? 'Accepting' : 'Rejecting'} request...`)

    try {
      const response = await fetch(`/api/doctor/affiliations/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'accept' ? 'accepted' : 'rejected' })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          `✅ Request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
          { id: loadingToast }
        )
        fetchAffiliations()
      } else {
        toast.error(data.error || 'Failed to process request', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error processing request:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setProcessingId(null)
    }
  }

  const handleRemoveAffiliation = async (affiliationId) => {
    if (!confirm('Are you sure you want to remove this affiliation?')) return

    const loadingToast = toast.loading('Removing affiliation...')

    try {
      const response = await fetch(`/api/doctor/affiliations/${affiliationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Affiliation removed successfully', { id: loadingToast })
        fetchAffiliations()
      } else {
        toast.error('Failed to remove affiliation', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error removing affiliation:', error)
      toast.error('Something went wrong', { id: loadingToast })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="pending" className="space-y-6">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="pending" className="relative">
          Pending Requests
          {pendingRequests.length > 0 && (
            <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
              {pendingRequests.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="active">Active Affiliations</TabsTrigger>
      </TabsList>

      {/* Pending Requests */}
      <TabsContent value="pending" className="space-y-4">
        {pendingRequests.length > 0 ? (
          pendingRequests.map((request) => (
            <Card key={request._id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Hospital className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        {request.hospitalId?.name || 'Hospital Name'}
                      </h3>
                      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {request.hospitalId?.address || 'Address not available'}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {request.hospitalId?.phone || 'Phone not available'}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {request.hospitalId?.email || 'Email not available'}
                        </p>
                      </div>
                      <Badge variant="outline" className="mt-3 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Review
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 lg:flex-col">
                    <Button
                      onClick={() => handleRequest(request._id, 'accept')}
                      disabled={processingId === request._id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      {processingId === request._id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRequest(request._id, 'reject')}
                      disabled={processingId === request._id}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800 font-semibold"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                No pending requests
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                Hospital affiliation requests will appear here
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Active Affiliations */}
      <TabsContent value="active" className="space-y-4">
        {affiliations.length > 0 ? (
          affiliations.map((affiliation) => (
            <Card key={affiliation._id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Hospital className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        {affiliation.hospitalId?.name || 'Hospital Name'}
                      </h3>
                      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {affiliation.hospitalId?.address || 'Address not available'}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {affiliation.hospitalId?.phone || 'Phone not available'}
                        </p>
                      </div>
                      <Badge className="mt-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleRemoveAffiliation(affiliation._id)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800 font-semibold"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <Hospital className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                No active affiliations
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                Accept hospital requests to start working
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}
