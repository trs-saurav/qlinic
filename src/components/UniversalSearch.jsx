// src/components/UniversalSearch.jsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, MapPin, Stethoscope, Hospital, Star, 
  Navigation, X, Loader2, TrendingUp
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function UniversalSearch({ variant = 'default' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ doctors: [], hospitals: [] })
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [searchType, setSearchType] = useState('all')
  const searchRef = useRef(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get user location
  const getUserLocation = () => {
    setLocationLoading(true)
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
        toast.success('Location detected')
        setLocationLoading(false)
        
        // Trigger search with location
        if (query) {
          handleSearch(query, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        }
      },
      (error) => {
        console.error('Location error:', error)
        toast.error('Unable to get your location')
        setLocationLoading(false)
      }
    )
  }

  // Search function
  const handleSearch = async (searchQuery, location = userLocation) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ doctors: [], hospitals: [] })
      return
    }

    setLoading(true)
    setShowResults(true)

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        limit: '10'
      })

      if (location) {
        params.append('lat', location.latitude)
        params.append('lng', location.longitude)
        params.append('radius', '20') // 20 km radius
      }

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
      } else {
        toast.error('Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        handleSearch(query)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query, searchType])

  const handleResultClick = (result) => {
    if (result.type === 'doctor') {
      router.push(`/patient/doctors/${result.id}`)
    } else if (result.type === 'hospital') {
      router.push(`/patient/hospitals/${result.id}`)
    }
    setShowResults(false)
    setQuery('')
  }

  const totalResults = results.doctors.length + results.hospitals.length

  return (
    <div ref={searchRef} className={`relative ${variant === 'hero' ? 'w-full max-w-3xl mx-auto' : 'w-full'}`}>
      {/* Search Bar */}
      <div className={`relative ${variant === 'hero' ? 'shadow-2xl' : 'shadow-lg'}`}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <Search className={`${variant === 'hero' ? 'w-6 h-6' : 'w-5 h-5'} text-slate-400`} />
        </div>
        
        <Input
          type="text"
          placeholder="Search doctors, hospitals, specializations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          className={`${
            variant === 'hero' 
              ? 'h-16 text-lg pl-14 pr-32' 
              : 'h-12 pl-12 pr-28'
          } rounded-full border-2 border-slate-200 focus:border-emerald-500`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setResults({ doctors: [], hospitals: [] })
              }}
              className="p-2 hover:bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
          
          <Button
            onClick={getUserLocation}
            disabled={locationLoading}
            variant="ghost"
            size="sm"
            className="rounded-full"
          >
            {locationLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className={`w-4 h-4 ${userLocation ? 'text-emerald-600' : 'text-slate-400'}`} />
            )}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-sm border p-2 flex gap-2 z-20">
          <button
            onClick={() => setSearchType('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'all'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setSearchType('doctors')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'doctors'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Stethoscope className="w-4 h-4 inline mr-1" />
            Doctors
          </button>
          <button
            onClick={() => setSearchType('hospitals')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'hospitals'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Hospital className="w-4 h-4 inline mr-1" />
            Hospitals
          </button>
        </div>
      )}

      {/* Results Dropdown */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-20 shadow-2xl z-30 max-h-[500px] overflow-y-auto">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : totalResults === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">No results found</p>
                <p className="text-sm text-slate-400 mt-1">Try searching with different keywords</p>
              </div>
            ) : (
              <div>
                {/* Doctors Section */}
                {results.doctors.length > 0 && (
                  <div className="border-b">
                    <div className="px-4 py-3 bg-slate-50 border-b">
                      <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        Doctors ({results.doctors.length})
                      </h3>
                    </div>
                    <div className="divide-y">
                      {results.doctors.map((doctor) => (
                        <button
                          key={doctor.id}
                          onClick={() => handleResultClick(doctor)}
                          className="w-full p-4 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12 border-2 border-emerald-500">
                              <AvatarImage src={doctor.image} />
                              <AvatarFallback>
                                {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-bold text-slate-900">{doctor.name}</p>
                              <p className="text-sm text-emerald-600">{doctor.specialization}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {doctor.rating.toFixed(1)}
                                </span>
                                <span>{doctor.experience} years exp</span>
                                {doctor.distance && (
                                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <MapPin className="w-3 h-3" />
                                    {doctor.distance} km away
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-600">₹{doctor.consultationFee}</p>
                              {doctor.availableNow && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  Available Now
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hospitals Section */}
                {results.hospitals.length > 0 && (
                  <div>
                    <div className="px-4 py-3 bg-slate-50 border-b">
                      <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                        <Hospital className="w-4 h-4" />
                        Hospitals ({results.hospitals.length})
                      </h3>
                    </div>
                    <div className="divide-y">
                      {results.hospitals.map((hospital) => (
                        <button
                          key={hospital.id}
                          onClick={() => handleResultClick(hospital)}
                          className="w-full p-4 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                              {hospital.image ? (
                                <img src={hospital.image} alt={hospital.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Hospital className="w-8 h-8 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-slate-900">{hospital.name}</p>
                              <p className="text-sm text-slate-600">{hospital.city}, {hospital.state}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {hospital.rating.toFixed(1)} ({hospital.totalReviews} reviews)
                                </span>
                                {hospital.distance && (
                                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <MapPin className="w-3 h-3" />
                                    {hospital.distance} km away
                                  </span>
                                )}
                              </div>
                              {hospital.specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {hospital.specialties.slice(0, 3).map((spec, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {spec}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
