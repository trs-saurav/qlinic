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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import HospitalSearchDialog from '@/components/search/HospitalSearchDialog'
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
  FileText,
  Hash,
  Copy,
  Check,
  Stethoscope,
  UserMinus,
  AlertTriangle
} from 'lucide-react'

function StatusBadge({ status }) {
  const variants = {
    APPROVED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300', icon: CheckCircle2 },
    PENDING: { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300', icon: Clock },
    REJECTED: { bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300', icon: XCircle },
    REVOKED: { bg: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300', icon: AlertCircle },
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

function AffiliationCard({ affiliation, onApprove, onReject, onCancel, onDeaffiliate, onViewDetails }) {
  const hospital = affiliation.hospitalId
  const [isExpanded, setIsExpanded] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [deaffiliateDialogOpen, setDeaffiliateDialogOpen] = useState(false)
  const [idCopied, setIdCopied] = useState(false)

  const copyHospitalId = async () => {
    if (!hospital?.shortId && !hospital?._id) return

    try {
      const id = hospital?.shortId || hospital._id.toString().slice(-8).toUpperCase()
      await navigator.clipboard.writeText(id)
      setIdCopied(true)
      toast.success('Hospital ID copied')
      setTimeout(() => setIdCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy ID')
    }
  }

  const handleCancelRequest = () => {
    setCancelDialogOpen(false)
    onCancel(affiliation._id)
  }

  const handleRejectInvitation = () => {
    setRejectDialogOpen(false)
    onReject(affiliation._id)
  }

  const handleDeaffiliate = () => {
    setDeaffiliateDialogOpen(false)
    onDeaffiliate(affiliation._id)
  }

  return (
    <>
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
              <div className="flex items-center gap-2 flex-wrap">
                <RequestTypeIndicator type={affiliation.requestType} />

                {/* Hospital ID Badge */}
                {(hospital?.shortId || hospital?._id) && (
                  <Badge variant="outline" className="gap-1 font-mono text-xs">
                    <Hash className="h-3 w-3" />
                    {hospital.shortId || hospital._id.toString().slice(-8).toUpperCase()}
                    <button
                      onClick={copyHospitalId}
                      className="ml-1 p-0.5 hover:bg-muted rounded"
                    >
                      {idCopied ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Hospital Info */}
          <div className="grid gap-3 text-sm">
            {hospital?.address && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  {typeof hospital.address === 'string' 
                    ? hospital.address 
                    : [
                        hospital.address.street,
                        hospital.address.landmark,
                        hospital.address.city,
                        hospital.address.state,
                        hospital.address.pincode,
                        hospital.address.country
                      ].filter(Boolean).join(', ')
                  }
                </span>
              </div>
            )}

            {hospital?.contactDetails?.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{hospital.contactDetails.phone}</span>
              </div>
            )}

            {hospital?.contactDetails?.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{hospital.contactDetails.email}</span>
              </div>
            )}

            {affiliation.consultationFee && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Consultation Fee:</span>
                <span className="text-muted-foreground">₹{affiliation.consultationFee.toLocaleString()}</span>
              </div>
            )}

            {affiliation.notes && (
              <div className="flex items-start gap-2 text-muted-foreground bg-muted/50 p-3 rounded-md">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-xs text-foreground mb-1">
                    {affiliation.requestType === 'HOSPITAL_TO_DOCTOR' ? 'Invitation Message:' : 'Your Message:'}
                  </p>
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
                  <span>
                    {affiliation.requestType === 'HOSPITAL_TO_DOCTOR' ? 'Invited' : 'Requested'}: {' '}
                    {new Date(affiliation.createdAt).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {affiliation.respondedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Responded: {new Date(affiliation.respondedAt).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                )}

                {affiliation.consultationRoomNumber && (
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    <span className="font-semibold text-foreground">Consultation Room:</span>
                    <span>{affiliation.consultationRoomNumber}</span>
                  </div>
                )}

                {affiliation.rejectionReason && affiliation.status === 'REJECTED' && (
                  <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950 p-3 rounded-md">
                    <XCircle className="h-4 w-4 mt-0.5 text-rose-600" />
                    <div>
                      <p className="font-semibold text-xs text-rose-900 dark:text-rose-300 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-rose-700 dark:text-rose-400">{affiliation.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {hospital?.type && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-semibold text-foreground">Type:</span>
                    <Badge variant="secondary">{hospital.type}</Badge>
                  </div>
                )}

                {hospital?.specialties && hospital.specialties.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Stethoscope className="h-4 w-4 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Specialties:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {hospital.specialties.slice(0, 5).map((spec, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {hospital.specialties.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{hospital.specialties.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {affiliation.status === 'PENDING' && affiliation.requestType === 'HOSPITAL_TO_DOCTOR' && (
              <>
                <Button 
                  onClick={() => onApprove(affiliation._id)} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept Invitation
                </Button>
                <Button 
                  onClick={() => setRejectDialogOpen(true)} 
                  variant="outline" 
                  className="flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  size="sm"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}

            {affiliation.status === 'PENDING' && affiliation.requestType === 'DOCTOR_TO_HOSPITAL' && (
              <Button 
                onClick={() => setCancelDialogOpen(true)} 
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Request
              </Button>
            )}

            {affiliation.status === 'APPROVED' && (
              <>
                <Button asChild variant="default" size="sm" className="flex-1">
                  <Link href={`/doctor/schedule?affiliation=${affiliation._id}`}>
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Manage Schedule
                  </Link>
                </Button>

                <Button 
                  onClick={() => setDeaffiliateDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Leave Hospital
                </Button>
              </>
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

      {/* Cancel Request Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Affiliation Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your affiliation request to <strong>{hospital?.name}</strong>? 
              You can send a new request later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelRequest} className="bg-red-600 hover:bg-red-700">
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Invitation Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the invitation from <strong>{hospital?.name}</strong>? 
              This action cannot be undone, but the hospital can send you another invitation later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectInvitation} className="bg-red-600 hover:bg-red-700">
              Reject Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deaffiliate Confirmation Dialog */}
      <AlertDialog open={deaffiliateDialogOpen} onOpenChange={setDeaffiliateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Leave {hospital?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to end your affiliation with <strong>{hospital?.name}</strong>?
              </p>
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3 space-y-1 text-xs">
                <p className="font-semibold text-amber-900 dark:text-amber-300">⚠️ This will:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-400">
                  <li>Cancel all your upcoming appointments at this hospital</li>
                  <li>Remove your schedule from this hospital</li>
                  <li>Remove you from the hospital's doctor list</li>
                  <li>Notify patients with upcoming appointments</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You can request affiliation again later, but you'll need hospital approval.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay Affiliated</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeaffiliate} className="bg-red-600 hover:bg-red-700">
              Yes, Leave Hospital
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function DoctorAffiliationsPage() {
  const { affiliations, affiliationsLoading, fetchAffiliations } = useDoctor()

  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [hospitalId, setHospitalId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  async function handleRequestFromSearch(hospitalId, notes) {
    const res = await fetch('/api/doctor/affiliations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId, notes }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Failed to request affiliation')

    fetchAffiliations()
  }

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

      toast.success('🎉 Affiliation accepted! You can now manage your schedule.')
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

  async function handleDeaffiliate(affiliationId) {
    try {
      const res = await fetch('/api/doctor/affiliations/deaffiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliationId }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data?.error || 'Failed to leave hospital')

      toast.success(`Successfully left hospital. ${data.cancelledAppointments || 0} appointments cancelled.`)
      fetchAffiliations()
    } catch (e) {
      toast.error('Failed to leave hospital')
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
          <Button variant="outline" onClick={() => setSearchDialogOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            Find Hospitals
          </Button>

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
                    placeholder="Enter 8-digit hospital ID"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get the hospital ID from the hospital admin. It's an 8-character code.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Message to Hospital (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Introduce yourself and explain why you'd like to join this hospital..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    A brief introduction can help the hospital admin approve your request faster.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitRequest} disabled={submitting || !hospitalId.trim()}>
                  {submitting ? 'Sending...' : 'Send Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Hospital Search Dialog */}
      <HospitalSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onRequest={handleRequestFromSearch}
      />

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
                        : status === 'APPROVED'
                        ? 'Request affiliation with hospitals to start accepting patients.'
                        : `You don't have any ${status.toLowerCase()} affiliations.`
                      }
                    </p>
                    {(status === 'PENDING' || status === 'APPROVED') && (
                      <Button className="mt-4" onClick={() => setSearchDialogOpen(true)}>
                        <Search className="h-4 w-4 mr-2" />
                        Find Hospitals
                      </Button>
                    )}
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
                    onDeaffiliate={handleDeaffiliate}
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
