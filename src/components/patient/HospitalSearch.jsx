// src/components/patient/HospitalSearch.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  MapPin, 
  Phone, 
  Clock,
  Star,
  Building2,
  Stethoscope,
  ChevronRight,
  Filter,
  X
} from 'lucide-react'
import HospitalProfile from './HospitalProfile'

export default function HospitalSearch() {
  const [hospitals, setHospitals] = useState([])
  const [filteredHospitals, setFilteredHospitals] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchHospitals()
  }, [])

  useEffect(() => {
    filterHospitals()
  }, [searchQuery, cityFilter, typeFilter, hospitals])

  const fetchHospitals = async () => {
    try {
      const response = await fetch('/api/patient/hospitals')
      const data = await response.json()

      if (data.hospitals) {
        setHospitals(data.hospitals)
        setFilteredHospitals(data.hospitals)
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterHospitals = () => {
    let filtered = [...hospitals]

    if (searchQuery) {
      filtered = filtered.filter(h => 
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address?.city?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (cityFilter) {
      filtered = filtered.filter(h => 
        h.address?.city?.toLowerCase().includes(cityFilter.toLowerCase())
      )
    }

    if (typeFilter && typeFilter !== 'ALL') {
      filtered = filtered.filter(h => h.type === typeFilter)
    }

    setFilteredHospitals(filtered)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCityFilter('')
    setTypeFilter('ALL')
  }

  const cities = [...new Set(hospitals.map(h => h.address?.city).filter(Boolean))]

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Find Hospitals</h2>
        <p className="text-slate-500 mt-1">Search and book appointments at top hospitals</p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by hospital name or city..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {(cityFilter || typeFilter !== 'ALL') && (
                  <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-[10px]">
                    {[cityFilter, typeFilter !== 'ALL' && 'Type'].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">Filters</h4>
                  {(cityFilter || typeFilter !== 'ALL') && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">City</label>
                    <Select value={cityFilter} onValueChange={setCityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Cities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Cities</SelectItem>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Hospital Type</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="Trust">Trust</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {(searchQuery || cityFilter || typeFilter !== 'ALL') && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-500">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {cityFilter && (
                  <Badge variant="secondary" className="gap-1">
                    City: {cityFilter}
                    <button onClick={() => setCityFilter('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {typeFilter !== 'ALL' && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {typeFilter}
                    <button onClick={() => setTypeFilter('ALL')}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Found <span className="font-semibold">{filteredHospitals.length}</span> hospitals
        </p>
      </div>

      {/* Hospitals Grid */}
      {filteredHospitals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((hospital) => (
            <Card 
              key={hospital._id}
              className="hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => setSelectedHospital(hospital)}
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Hospital Logo/Icon */}
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {hospital.type}
                    </Badge>
                  </div>

                  {/* Hospital Name */}
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">
                      {hospital.name}
                    </h3>
                    {hospital.address && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {hospital.address.city}, {hospital.address.state}
                      </p>
                    )}
                  </div>

                  {/* Quick Info */}
                  <div className="space-y-2">
                    {hospital.contactDetails?.phone && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {hospital.contactDetails.phone}
                      </p>
                    )}
                    {hospital.totalBeds && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {hospital.totalBeds} Beds
                      </p>
                    )}
                  </div>

                  {/* Facilities */}
                  {hospital.facilities && hospital.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hospital.facilities.slice(0, 3).map((facility, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {facility}
                        </Badge>
                      ))}
                      {hospital.facilities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{hospital.facilities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* View Details Button */}
                  <Button className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                    View Details & Book
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-slate-400">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No hospitals found</p>
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
              {(searchQuery || cityFilter || typeFilter !== 'ALL') && (
                <Button variant="link" onClick={clearFilters} className="mt-3">
                  Clear all filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hospital Profile Modal */}
      {selectedHospital && (
        <Dialog open={!!selectedHospital} onOpenChange={() => setSelectedHospital(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <HospitalProfile 
              hospital={selectedHospital} 
              onClose={() => setSelectedHospital(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
