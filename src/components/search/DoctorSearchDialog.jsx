'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, User, Stethoscope, Mail, Loader2, UserPlus } from 'lucide-react'
import { debounce } from 'lodash'
import toast from 'react-hot-toast'

export default function DoctorSearchDialog({ open, onOpenChange, onInvite }) {
  const [query, setQuery] = useState('')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(null)

  const searchDoctors = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setDoctors([])
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/search/doctors?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        if (res.ok) {
          setDoctors(data.doctors || [])
        } else {
          toast.error('Failed to search doctors')
        }
      } catch (error) {
        console.error('Search error:', error)
        toast.error('Search failed')
      } finally {
        setLoading(false)
      }
    }, 500),
    []
  )

  useEffect(() => {
    searchDoctors(query)
  }, [query, searchDoctors])

  async function handleInvite(doctor) {
    setInviting(doctor._id)
    try {
      await onInvite(doctor._id)
      toast.success(`Invitation sent to Dr. ${doctor.firstName} ${doctor.lastName}`)
    } catch (error) {
      toast.error('Failed to send invitation')
    } finally {
      setInviting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Doctors</DialogTitle>
          <DialogDescription>
            Search by name, email, specialization, or Doctor ID
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search doctors (e.g., 'ABC12345', 'Cardiology', 'Dr. Smith')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {query ? 'No doctors found' : 'Start typing to search doctors'}
            </div>
          ) : (
            doctors.map((doctor) => (
              <Card key={doctor._id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {doctor.profileImage ? (
                      <img
                        src={doctor.profileImage}
                        alt={`${doctor.firstName} ${doctor.lastName}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            ID: {doctor.shortId}
                          </Badge>
                          {doctor.doctorProfile?.specialization && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Stethoscope className="h-3 w-3" />
                              {doctor.doctorProfile.specialization}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleInvite(doctor)}
                        disabled={inviting === doctor._id}
                        size="sm"
                      >
                        {inviting === doctor._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Mail className="h-3.5 w-3.5" />
                      {doctor.email}
                    </div>

                    {doctor.doctorProfile?.experience && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {doctor.doctorProfile.experience} years experience
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
