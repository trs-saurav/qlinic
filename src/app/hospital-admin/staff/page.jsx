'use client'

import { useEffect, useState } from 'react'
import { useHospitalAdmin } from '@/context/HospitalAdminContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Search,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Stethoscope,
  Users,
  AlertCircle,
  Edit2,
  Trash2,
  Send,
  UserCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function StaffPage() {
  const {
    doctors,
    doctorsLoading,
    pendingDoctorRequests,
    staff,
    staffLoading,
    fetchDoctors,
    fetchStaff,
    approveDoctorRequest,
  } = useHospitalAdmin()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  // Staff form state
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    salary: '',
  })

  useEffect(() => {
    fetchDoctors()
    fetchStaff()
  }, [])

  // Search for doctors
  const handleSearchDoctors = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query')
      return
    }

    try {
      setSearching(true)
      const res = await fetch(`/api/search/doctors?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()

      if (res.ok) {
        setSearchResults(data.doctors || [])
        if (data.doctors.length === 0) {
          toast.error('No doctors found')
        }
      } else {
        toast.error('Failed to search doctors')
      }
    } catch (err) {
      console.error('Search error:', err)
      toast.error('Failed to search doctors')
    } finally {
      setSearching(false)
    }
  }

  // Send invite to doctor
  const handleInviteDoctor = async (doctorId) => {
    try {
      const res = await fetch('/api/hospital/doctors/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Invitation sent successfully')
        setSearchResults([])
        setSearchQuery('')
        setInviteDialogOpen(false)
      } else {
        toast.error(data.error || 'Failed to send invitation')
      }
    } catch (err) {
      console.error('Invite error:', err)
      toast.error('Failed to send invitation')
    }
  }

  // Approve doctor request
  const handleApproveRequest = async (affiliationId) => {
    const result = await approveDoctorRequest(affiliationId)
    if (result.success) {
      fetchDoctors()
    }
  }

  // Reject doctor request
  const handleRejectRequest = async (affiliationId) => {
    try {
      const res = await fetch('/api/hospital/doctors/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliationId }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Request rejected')
        fetchDoctors()
      } else {
        toast.error(data.error || 'Failed to reject request')
      }
    } catch (err) {
      console.error('Reject error:', err)
      toast.error('Failed to reject request')
    }
  }

  // Add staff member
  const handleAddStaff = async (e) => {
    e.preventDefault()

    try {
      const res = await fetch('/api/hospital/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Staff member added successfully')
        setAddStaffDialogOpen(false)
        setStaffForm({
          name: '',
          email: '',
          phone: '',
          role: '',
          department: '',
          salary: '',
        })
        fetchStaff()
      } else {
        toast.error(data.error || 'Failed to add staff member')
      }
    } catch (err) {
      console.error('Add staff error:', err)
      toast.error('Failed to add staff member')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Staff Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage doctors, nurses, and hospital staff
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Search className="w-4 h-4" />
                Find Doctors
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Search & Invite Doctors</DialogTitle>
                <DialogDescription>
                  Search for doctors by name, specialization, or location
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search doctors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchDoctors()}
                  />
                  <Button onClick={handleSearchDoctors} disabled={searching}>
                    {searching ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((doctor) => (
                      <div
                        key={doctor._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={doctor.profileImage} />
                            <AvatarFallback>
                              {doctor.firstName?.[0]}
                              {doctor.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {doctor.doctorProfile?.specialization || 'General'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {doctor.doctorProfile?.experience || 0} yrs exp
                              </Badge>
                              {doctor.doctorProfile?.isVerified && (
                                <Badge variant="success" className="text-xs">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleInviteDoctor(doctor._id)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Invite
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={addStaffDialogOpen} onOpenChange={setAddStaffDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
                <DialogDescription>
                  Add nurses, technicians, or administrative staff
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={staffForm.name}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={staffForm.email}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={staffForm.phone}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={staffForm.role}
                    onValueChange={(value) =>
                      setStaffForm({ ...staffForm, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="lab_assistant">Lab Assistant</SelectItem>
                      <SelectItem value="radiologist">Radiologist</SelectItem>
                      <SelectItem value="cleaner">Cleaner</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="admin">Admin Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={staffForm.department}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, department: e.target.value })
                    }
                    placeholder="e.g., Emergency, ICU, OPD"
                  />
                </div>

                <div>
                  <Label htmlFor="salary">Monthly Salary (₹)</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={staffForm.salary}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, salary: e.target.value })
                    }
                    placeholder="25000"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAddStaffDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Add Staff
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pending Requests Alert */}
      {pendingDoctorRequests?.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {pendingDoctorRequests.length} Pending Doctor Request
                {pendingDoctorRequests.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Review and approve doctor affiliation requests
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="doctors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="doctors" className="gap-2">
            <Stethoscope className="w-4 h-4" />
            Doctors ({doctors?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="w-4 h-4" />
            Requests ({pendingDoctorRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2">
            <Users className="w-4 h-4" />
            Staff ({staff?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Doctors Tab */}
        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              {doctorsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : doctors?.length > 0 ? (
                <div className="space-y-3">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={doctor.profileImage} />
                          <AvatarFallback>
                            {doctor.firstName?.[0]}
                            {doctor.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {doctor.doctorProfile?.specialization || 'General Medicine'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {doctor.email && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {doctor.email}
                              </span>
                            )}
                            {doctor.phone && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {doctor.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            doctor.doctorProfile?.isAvailable
                              ? 'success'
                              : 'secondary'
                          }
                        >
                          {doctor.doctorProfile?.isAvailable
                            ? 'Available'
                            : 'Unavailable'}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Stethoscope className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-600">
                    No doctors yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Search and invite doctors to join your hospital
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Doctor Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingDoctorRequests?.length > 0 ? (
                <div className="space-y-3">
                  {pendingDoctorRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.doctorId?.profileImage} />
                          <AvatarFallback>
                            {request.doctorId?.firstName?.[0]}
                            {request.doctorId?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">
                            Dr. {request.doctorId?.firstName}{' '}
                            {request.doctorId?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.doctorId?.doctorProfile?.specialization ||
                              'General Medicine'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested on{' '}
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleRejectRequest(request._id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleApproveRequest(request._id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserCheck className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-600">
                    No pending requests
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All doctor requests have been processed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hospital Staff</CardTitle>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : staff?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Department
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Contact
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Salary
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {staff.map((member) => (
                        <tr key={member._id} className="hover:bg-accent">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {member.name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{member.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="capitalize">
                              {member.role?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {member.department || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <p>{member.phone}</p>
                              {member.email && (
                                <p className="text-muted-foreground">
                                  {member.email}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            ₹{member.salary?.toLocaleString() || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-600">
                    No staff members yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add nurses, technicians, and other staff members
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
