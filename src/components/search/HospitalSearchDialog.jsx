'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Building2, MapPin, Mail, Loader2, Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { debounce } from 'lodash'
import toast from 'react-hot-toast'

export default function HospitalSearchDialog({ open, onOpenChange, onRequest }) {
  const [query, setQuery] = useState('')
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [notes, setNotes] = useState('')
  const [requesting, setRequesting] = useState(false)

  const searchHospitals = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setHospitals([])
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/search/hospitals?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        if (res.ok) {
          setHospitals(data.hospitals || [])
        } else {
          toast.error('Failed to search hospitals')
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
    searchHospitals(query)
  }, [query, searchHospitals])

  async function handleRequest() {
    if (!selectedHospital) return
    
    setRequesting(true)
    try {
      await onRequest(selectedHospital._id, notes)
      toast.success(`Request sent to ${selectedHospital.name}`)
      setSelectedHospital(null)
      setNotes('')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to send request')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Hospitals</DialogTitle>
          <DialogDescription>
            Search by name, city, Hospital ID, or specialty
          </DialogDescription>
        </DialogHeader>

        {!selectedHospital ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hospitals (e.g., 'XYZ78901', 'AIIMS', 'Delhi')..."
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
              ) : hospitals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {query ? 'No hospitals found' : 'Start typing to search hospitals'}
                </div>
              ) : (
                hospitals.map((hospital) => (
                  <Card key={hospital._id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedHospital(hospital)}>
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{hospital.name}</h4>
                        <Badge variant="secondary" className="text-xs mt-1">
                          ID: {hospital.shortId}
                        </Badge>

                        {hospital.address?.city && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <MapPin className="h-3.5 w-3.5" />
                            {hospital.address.city}, {hospital.address.state}
                          </div>
                        )}

                        {hospital.specialties?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {hospital.specialties.slice(0, 3).map((specialty, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Card className="p-4 bg-muted/50">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{selectedHospital.name}</h4>
                  <Badge variant="secondary" className="text-xs mt-1">
                    ID: {selectedHospital.shortId}
                  </Badge>
                  {selectedHospital.address?.city && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedHospital.address.city}, {selectedHospital.address.state}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Label>Message (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a message to introduce yourself..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedHospital(null)} className="flex-1">
                Back to Search
              </Button>
              <Button onClick={handleRequest} disabled={requesting} className="flex-1">
                {requesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
