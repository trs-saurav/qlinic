'use client'

import React, { useMemo, useState } from 'react'
import { useDoctor } from '@/context/DoctorContextProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { 
  Building2, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Search,
  Plus,
  Phone,
  Mail,
  User,
  CalendarClock,
  FileText
} from 'lucide-react'

function StatusBadge({ status }) {
  const variants = {
    APPROVED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    PENDING: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    REJECTED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
    REVOKED: { bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle },
  }
  
  const variant = variants[status] || variants.PENDING
  const Icon = variant.icon

  return (
    <Badge variant="outline" className={`${variant.bg} border font-semibold gap-1.5`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </Badge>
  )
}

function RequestTypeIndicator({ type }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {type === 'HOSPITAL_TO_DOCTOR' ? '📨 Invitation Received' : '📤 Request Sent'}
    </Badge>
  )
}

function AffiliationCard({ affiliation, onApprove, onReject, onCancel, onViewDetails }) {
  const hospital = affiliation.hospitalId
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {hospital?.name || 'Hospital Name Unavailable'}
              </CardTitle>
              <StatusBadge status={affiliation.status} />
            </div>
            <RequestTypeIndicator type={affiliation.requestType} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hospital Info */}
        {/* Hospital Info */}
<div className="grid gap-3 text-sm">
  {hospital?.city && (
    <div className="flex items-center gap-2 text-muted-foreground">
      <MapPin className="h-4 w-4" />
      <span>{hospital.city}{hospital?.state ? `, ${hospital.state}` : ''}</span>
    </div>
  )}
  
  {hospital?.address && (
    <div className="flex items-start gap-2 text-muted-foreground">
      <Building2 className="h-4 w-4 mt-0.5" />
      <span className="text-sm">
        {typeof hospital.address === 'string' 
          ? hospital.address 
          : [
              hospital.address.street,
              hospital.address.city,
              hospital.address.state,
              hospital.address.country,
              hospital.address.pincode
            ].filter(Boolean).join(', ')
        }
      </span>
    </div>
  )}

  {affiliation.consultationFee && (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="font-semibold">Consultation Fee:</span>
      <span>₹{affiliation.consultationFee}</span>
    </div>
  )}

  {affiliation.notes && (
    <div className="flex items-start gap-2 text-muted-foreground bg-muted/50 p-3 rounded-md">
      <FileText className="h-4 w-4 mt-0.5" />
      <div>
        <p className="font-semibold text-xs text-foreground mb-1">Notes:</p>
        <p className="text-sm">{affiliation.notes}</p>
      </div>
    </div>
  )}
</div>

        {/* Expanded Details */}
        {isExpanded && (
          <>
            <Separator />
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Requested: {new Date(affiliation.createdAt).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}</span>
              </div>
              
              {affiliation.respondedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Responded: {new Date(affiliation.respondedAt).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}</span>
                </div>
              )}

              {affiliation.consultationRoomNumber && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Room:</span>
                  <span>{affiliation.consultationRoomNumber}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {affiliation.status === 'PENDING' && affiliation.requestType === 'HOSPITAL_TO_DOCTOR' && (
            <>
              <Button 
                onClick={() => onApprove(affiliation._id)} 
                className="flex-1"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button 
                onClick={() => onReject(affiliation._id)} 
                variant="destructive" 
                className="flex-1"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}

          {affiliation.status === 'PENDING' && affiliation.requestType === 'DOCTOR_TO_HOSPITAL' && (
            <Button 
              onClick={() => onCancel(affiliation._id)} 
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Request
            </Button>
          )}

          {affiliation.status === 'APPROVED' && (
            <Button asChild variant="default" size="sm">
              <Link href={`/doctor/schedule?affiliation=${affiliation._id}`}>
                <CalendarClock className="h-4 w-4 mr-2" />
                Manage Schedule
              </Link>
            </Button>
          )}

          <Button 
            onClick={() => setIsExpanded(!isExpanded)} 
            variant="outline"
            size="sm"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DoctorAffiliationsPage() {
  const { affiliations, affiliationsLoading, fetchAffiliations } = useDoctor()

  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [hospitalId, setHospitalId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const grouped = useMemo(() => {
    const g = { APPROVED: [], PENDING: [], REJECTED: [], REVOKED: [] }
    for (const a of affiliations || []) {
      if (a.status && g[a.status]) {
        g[a.status].push(a)
      }
    }
    return g
  }, [affiliations])

  const stats = useMemo(() => ({
    total: affiliations?.length || 0,
    pending: grouped.PENDING?.length || 0,
    approved: grouped.APPROVED?.length || 0,
    rejected: grouped.REJECTED?.length || 0,
  }), [affiliations, grouped])

  async function submitRequest() {
    if (!hospitalId.trim()) return toast.error('Hospital ID is required')
    setSubmitting(true)
    try {
      const res = await fetch('/api/doctor/affiliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId: hospitalId.trim(), notes }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data?.error || 'Failed to request affiliation')

      toast.success('Affiliation request sent successfully')
      setRequestDialogOpen(false)
      setHospitalId('')
      setNotes('')
      fetchAffiliations()
    } catch (e) {
      toast.error('Failed to request affiliation')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove(affiliationId) {
    try {
      const res = await fetch(`/api/doctor/affiliations/${affiliationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data?.error || 'Failed to accept invitation')
      
      toast.success('Affiliation accepted successfully')
      fetchAffiliations()
    } catch (e) {
      toast.error('Failed to accept invitation')
    }
  }

  async function handleReject(affiliationId) {
    try {
      const res = await fetch(`/api/doctor/affiliations/${affiliationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data?.error || 'Failed to reject invitation')
      
      toast.success('Invitation rejected')
      fetchAffiliations()
    } catch (e) {
      toast.error('Failed to reject invitation')
    }
  }

  async function handleCancel(affiliationId) {
    try {
      const res = await fetch(`/api/doctor/affiliations/${affiliationId}`, { 
        method: 'DELETE' 
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data?.error || 'Failed to cancel request')
      
      toast.success('Request cancelled successfully')
      fetchAffiliations()
    } catch (e) {
      toast.error('Failed to cancel request')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospital Affiliations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your hospital partnerships and invitations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Find Hospitals
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Search Hospitals</DialogTitle>
                <DialogDescription>
                  Search for hospitals to send affiliation requests
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Search by name, city, or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Hospital search feature coming soon. For now, use "Request Affiliation" with Hospital ID.
                  </AlertDescription>
                </Alert>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request Affiliation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Request Hospital Affiliation</DialogTitle>
                <DialogDescription>
                  Send a request to join a hospital's network
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="hospitalId">Hospital ID *</Label>
                  <Input
                    id="hospitalId"
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    placeholder="Enter hospital ID"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get the hospital ID from the hospital admin or use the search feature
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional information or message..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitRequest} disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Affiliations</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Pending
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approved
            </CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" />
              Rejected
            </CardDescription>
            <CardTitle className="text-3xl text-rose-600">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="PENDING" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="PENDING" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="APPROVED" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approved ({stats.approved})
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({stats.rejected})
          </TabsTrigger>
          <TabsTrigger value="REVOKED" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Revoked ({grouped.REVOKED?.length || 0})
          </TabsTrigger>
        </TabsList>

        {['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {affiliationsLoading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground mt-4">Loading affiliations...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (grouped[status] || []).length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No {status.toLowerCase()} affiliations</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {status === 'PENDING' 
                        ? 'You have no pending invitations or requests at the moment.'
                        : `You don't have any ${status.toLowerCase()} affiliations.`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {grouped[status].map((affiliation) => (
                  <AffiliationCard
                    key={affiliation._id}
                    affiliation={affiliation}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
