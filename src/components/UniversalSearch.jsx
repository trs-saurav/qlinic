'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Search, MapPin, Stethoscope, Hospital, Star, 
  Navigation, X, Loader2, CheckCircle,
  ArrowRight, Sparkles, Building2, Clock,
  Award, TrendingUp, Phone, Mail
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function UniversalSearch({ 
  variant = 'default',
  autoFocus = false,
  showNearbyOnOpen = true 
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ doctors: [], hospitals: [] })
  const [nearbyResults, setNearbyResults] = useState({ doctors: [], hospitals: [] })
  const [loading, setLoading] = useState(false)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [searchType, setSearchType] = useState('all')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const searchRef = useRef(null)
  const debounceRef = useRef(null)
  const abortControllerRef = useRef(null)
  const router = useRouter()

  // Load saved location on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation')
    if (savedLocation) {
      try {
        const loc = JSON.parse(savedLocation)
        setUserLocation(loc)
      } catch (err) {
        console.error('Failed to parse saved location:', err)
      }
    }
  }, [])

  // Fetch nearby results when component mounts or location changes
  useEffect(() => {
    if (userLocation && showNearbyOnOpen) {
      fetchNearbyResults()
    }
  }, [userLocation, showNearbyOnOpen])

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
        setSelectedIndex(-1)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowResults(false)
        setQuery('')
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // Get user location
  const getUserLocation = useCallback(() => {
    setLocationLoading(true)
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported', { icon: '📍' })
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Reverse geocode to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const city = data.address?.city || data.address?.town || 'Your Location'
          const state = data.address?.state || ''
          const name = `${city}${state ? ', ' + state : ''}`

          const location = {
            latitude,
            longitude,
            name,
            timestamp: new Date().toISOString()
          }

          setUserLocation(location)
          localStorage.setItem('userLocation', JSON.stringify(location))
          toast.success(`Location set to ${name}`, { icon: '📍' })
          
          // Fetch nearby results immediately
          if (showNearbyOnOpen) {
            fetchNearbyResults(location)
          }
        } catch (err) {
          console.error('Geocoding error:', err)
          const location = {
            latitude,
            longitude,
            name: 'Your Location',
            timestamp: new Date().toISOString()
          }
          setUserLocation(location)
          localStorage.setItem('userLocation', JSON.stringify(location))
          toast.success('Location detected', { icon: '✅' })
        }
        
        setLocationLoading(false)
      },
      (error) => {
        console.error('Location error:', error)
        toast.error('Unable to get location', { icon: '❌' })
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }, [showNearbyOnOpen])

  // Fetch nearby doctors and hospitals
  const fetchNearbyResults = async (location = userLocation) => {
    if (!location) return

    setNearbyLoading(true)

    try {
      const params = new URLSearchParams({
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
        radius: '10', // 10 km radius
        limit: '6'
      })

      const response = await fetch(`/api/search/nearby?${params}`)
      const data = await response.json()

      if (data.success) {
        setNearbyResults(data.results)
      } else {
        console.error('Nearby search failed:', data.error)
      }
    } catch (error) {
      console.error('Nearby search error:', error)
    } finally {
      setNearbyLoading(false)
    }
  }

  // Search function with debounce
  const handleSearch = useCallback(async (searchQuery, location = userLocation) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ doctors: [], hospitals: [] })
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setLoading(true)

    try {
      abortControllerRef.current = new AbortController()

      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        limit: '10'
      })

      if (location) {
        params.append('lat', location.latitude.toString())
        params.append('lng', location.longitude.toString())
        params.append('radius', '20')
      }

      const response = await fetch(`/api/search?${params}`, {
        signal: abortControllerRef.current.signal
      })
      
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
      } else {
        console.error('Search failed:', data.error)
        setResults({ doctors: [], hospitals: [] })
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error)
        setResults({ doctors: [], hospitals: [] })
      }
    } finally {
      setLoading(false)
    }
  }, [searchType, userLocation])

  // Debounced search effect
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ doctors: [], hospitals: [] })
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(query)
    }, 400)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, handleSearch])

  const handleResultClick = (result) => {
    if (result.type === 'doctor') {
      router.push(`/patient/doctors/${result.id}`)
    } else if (result.type === 'hospital') {
      router.push(`/patient/hospitals/${result.id}`)
    }
    setShowResults(false)
    setQuery('')
    setSelectedIndex(-1)
  }

  const handleClear = () => {
    setQuery('')
    setResults({ doctors: [], hospitals: [] })
    setSelectedIndex(-1)
  }

  const handleFocus = () => {
    setShowResults(true)
    
    // Auto-detect location on first focus if not set
    if (!userLocation && showNearbyOnOpen) {
      getUserLocation()
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const allResults = [
      ...results.doctors.map(d => ({ ...d, type: 'doctor' })),
      ...results.hospitals.map(h => ({ ...h, type: 'hospital' }))
    ]

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < allResults.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : allResults.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && allResults[selectedIndex]) {
        handleResultClick(allResults[selectedIndex])
      } else if (query) {
        router.push(`/search?q=${encodeURIComponent(query)}`)
        setShowResults(false)
        setQuery('')
      }
    }
  }

  const showingNearby = showResults && !query && nearbyResults && 
    (nearbyResults.doctors.length > 0 || nearbyResults.hospitals.length > 0)
  const showingSearch = showResults && query && 
    (results.doctors.length > 0 || results.hospitals.length > 0)
  const totalResults = results.doctors.length + results.hospitals.length
  const totalNearby = nearbyResults.doctors.length + nearbyResults.hospitals.length

  return (
    <div ref={searchRef} className={`relative ${variant === 'hero' ? 'w-full max-w-4xl mx-auto' : 'w-full'}`}>
      {/* Search Bar */}
      <motion.div 
        className={`relative ${variant === 'hero' ? 'shadow-2xl' : 'shadow-lg'}`}
        initial={false}
        animate={{ 
          scale: showResults ? 1.02 : 1 
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 z-10">
          {loading ? (
            <Loader2 className={`${variant === 'hero' ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'} text-blue-600 animate-spin`} />
          ) : (
            <Search className={`${variant === 'hero' ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'} text-slate-400`} />
          )}
        </div>
        
        <Input
          type="text"
          placeholder="Search doctors, hospitals, specializations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          className={`${
            variant === 'hero' 
              ? 'h-14 sm:h-16 text-sm sm:text-lg pl-12 sm:pl-14 pr-24 sm:pr-32' 
              : 'h-11 sm:h-12 text-sm pl-11 sm:pl-12 pr-24 sm:pr-28'
          } rounded-full border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all backdrop-blur-xl bg-white/90 dark:bg-slate-900/90`}
          autoComplete="off"
          spellCheck={false}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={handleClear}
                className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              </motion.button>
            )}
          </AnimatePresence>
          
          <Button
            onClick={getUserLocation}
            disabled={locationLoading}
            variant="ghost"
            size="sm"
            className="rounded-full h-8 sm:h-9 w-8 sm:w-9 p-0"
            title={userLocation ? `Location: ${userLocation.name}` : 'Enable location'}
          >
            {locationLoading ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Navigation className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                userLocation 
                  ? 'text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400' 
                  : 'text-slate-400'
              }`} />
            )}
          </Button>
        </div>
      </motion.div>

      {/* Filter Tabs - Only show when searching */}
      <AnimatePresence>
        {showResults && query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-2 flex gap-2 z-20 overflow-x-auto scrollbar-hide"
          >
            <FilterButton
              active={searchType === 'all'}
              onClick={() => setSearchType('all')}
              icon={Sparkles}
              label="All"
            />
            <FilterButton
              active={searchType === 'doctors'}
              onClick={() => setSearchType('doctors')}
              icon={Stethoscope}
              label="Doctors"
            />
            <FilterButton
              active={searchType === 'hospitals'}
              onClick={() => setSearchType('hospitals')}
              icon={Hospital}
              label="Hospitals"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute top-full left-0 right-0 ${query ? 'mt-20' : 'mt-2'} z-30`}
          >
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 max-h-[70vh] sm:max-h-[600px] overflow-hidden backdrop-blur-xl bg-white/95 dark:bg-slate-900/95">
              <CardContent className="p-0">
                
                {/* Nearby Results (shown when no query) */}
                {showingNearby && (
                  <div className="max-h-[70vh] sm:max-h-[600px] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 border-b border-slate-200 dark:border-slate-800 z-10 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            Nearby Healthcare
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                            {userLocation ? `Near ${userLocation.name}` : 'Enable location for nearby results'}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-0">
                          {totalNearby} found
                        </Badge>
                      </div>
                    </div>

                    {nearbyLoading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-blue-600 dark:text-blue-400 mb-3" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">Finding nearby...</p>
                      </div>
                    ) : (
                      <>
                        {/* Nearby Hospitals */}
                        {nearbyResults.hospitals.length > 0 && (
                          <div>
                            <div className="px-4 sm:px-6 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900">
                              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                                <Hospital className="w-4 h-4" />
                                Nearby Hospitals ({nearbyResults.hospitals.length})
                              </h4>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {nearbyResults.hospitals.map((hospital, index) => (
                                <HospitalResultCard
                                  key={hospital.id}
                                  hospital={hospital}
                                  onClick={() => handleResultClick(hospital)}
                                  index={index}
                                  showDistance
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Nearby Doctors */}
                        {nearbyResults.doctors.length > 0 && (
                          <div>
                            {nearbyResults.hospitals.length > 0 && <Separator className="my-2" />}
                            <div className="px-4 sm:px-6 py-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900">
                              <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" />
                                Nearby Doctors ({nearbyResults.doctors.length})
                              </h4>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {nearbyResults.doctors.map((doctor, index) => (
                                <DoctorResultCard
                                  key={doctor.id}
                                  doctor={doctor}
                                  onClick={() => handleResultClick(doctor)}
                                  index={index}
                                  showDistance
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No nearby results */}
                        {totalNearby === 0 && !userLocation && (
                          <div className="text-center py-16 px-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Navigation className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                              Enable Location
                            </p>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
                              Allow location access to see nearby doctors and hospitals
                            </p>
                            <Button onClick={getUserLocation} disabled={locationLoading} className="rounded-full">
                              {locationLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Detecting...
                                </>
                              ) : (
                                <>
                                  <Navigation className="w-4 h-4 mr-2" />
                                  Enable Location
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Search Results */}
                {showingSearch && (
                  <div className="max-h-[70vh] sm:max-h-[600px] overflow-y-auto">
                    {/* Doctors Section */}
                    {results.doctors.length > 0 && (
                      <div>
                        <div className="sticky top-0 px-4 sm:px-6 py-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900 z-10 backdrop-blur-sm">
                          <h3 className="font-bold text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4" />
                            Doctors ({results.doctors.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {results.doctors.map((doctor, index) => (
                            <DoctorResultCard
                              key={doctor.id}
                              doctor={doctor}
                              onClick={() => handleResultClick(doctor)}
                              index={index}
                              selected={selectedIndex === index}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Separator */}
                    {results.doctors.length > 0 && results.hospitals.length > 0 && (
                      <Separator className="my-2" />
                    )}

                    {/* Hospitals Section */}
                    {results.hospitals.length > 0 && (
                      <div>
                        <div className="sticky top-0 px-4 sm:px-6 py-3 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900 z-10 backdrop-blur-sm">
                          <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                            <Hospital className="w-4 h-4" />
                            Hospitals ({results.hospitals.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {results.hospitals.map((hospital, index) => {
                            const hospitalIndex = index + results.doctors.length
                            return (
                              <HospitalResultCard
                                key={hospital.id}
                                hospital={hospital}
                                onClick={() => handleResultClick(hospital)}
                                index={index}
                                selected={selectedIndex === hospitalIndex}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No results */}
                {query && !loading && totalResults === 0 && (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Search className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                      No results found for &quot;{query}&quot;
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Try different keywords or check spelling
                    </p>
                    
                    {/* Quick suggestions */}
                    <div className="mt-6">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1 justify-center">
                        <TrendingUp className="w-3 h-3" />
                        Try searching for:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {['Cardiology', 'Orthopedic', 'Pediatrics', 'Dermatology', 'General Physician'].map((term) => (
                          <Badge 
                            key={term}
                            variant="outline" 
                            className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-500 transition-colors" 
                            onClick={() => setQuery(term)}
                          >
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-blue-600 dark:text-blue-400 mb-3" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Searching...</p>
                  </div>
                )}

              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Filter Button Component
function FilterButton({ active, onClick, icon: Icon, label }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>{label}</span>
    </motion.button>
  )
}

// Doctor Result Card
function DoctorResultCard({ doctor, onClick, index, selected = false, showDistance = false }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full p-3 sm:p-4 text-left group transition-colors ${
        selected ? 'bg-blue-50 dark:bg-blue-950/20' : ''
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-blue-500 flex-shrink-0 ring-2 ring-blue-100 dark:ring-blue-900">
          <AvatarImage 
            src={doctor.profileImage || doctor.image} 
            alt={doctor.name}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-base sm:text-lg">
            {doctor.firstName?.[0]}{doctor.lastName?.[0] || doctor.name?.[0]}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                Dr. {doctor.firstName} {doctor.lastName || doctor.name}
              </h4>
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium line-clamp-1 mt-0.5">
                {doctor.specialization || 'General Physician'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
            {doctor.rating > 0 && (
              <span className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-yellow-700 dark:text-yellow-300">{doctor.rating.toFixed(1)}</span>
              </span>
            )}
            {doctor.experience > 0 && (
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3 text-blue-500" />
                {doctor.experience} yrs
              </span>
            )}
            {(showDistance && doctor.distance) && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full">
                <MapPin className="w-3 h-3" />
                {doctor.distance.toFixed(1)} km
              </span>
            )}
          </div>

          {/* Location/Hospital */}
          {doctor.hospitalName && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 line-clamp-1">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              {doctor.hospitalName}
            </p>
          )}

          {/* Bottom Row */}
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-2">
              {doctor.availableNow && (
                <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs px-2 py-0.5">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Available
                </Badge>
              )}
              {doctor.nextAvailable && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  <Clock className="w-3 h-3 mr-1" />
                  {doctor.nextAvailable}
                </Badge>
              )}
            </div>
            {doctor.consultationFee > 0 && (
              <p className="font-bold text-sm sm:text-base text-blue-600 dark:text-blue-400 whitespace-nowrap">
                ₹{doctor.consultationFee}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// Hospital Result Card
function HospitalResultCard({ hospital, onClick, index, selected = false, showDistance = false }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full p-3 sm:p-4 text-left group transition-colors ${
        selected ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Logo/Image */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border-2 border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900">
          {hospital.logo || hospital.image ? (
            <Image 
              src={hospital.logo || hospital.image} 
              alt={hospital.name} 
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                {hospital.name}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {hospital.city}{hospital.state && `, ${hospital.state}`}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
            {hospital.rating > 0 && (
              <span className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-yellow-700 dark:text-yellow-300">{hospital.rating.toFixed(1)}</span>
                {hospital.totalReviews > 0 && (
                  <span className="text-slate-400">({hospital.totalReviews})</span>
                )}
              </span>
            )}
            {(showDistance && hospital.distance) && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                <MapPin className="w-3 h-3" />
                {hospital.distance.toFixed(1)} km
              </span>
            )}
            {hospital.totalDoctors > 0 && (
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-blue-500" />
                {hospital.totalDoctors} doctors
              </span>
            )}
          </div>

          {/* Specialties */}
          {hospital.specialties && hospital.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2">
              {hospital.specialties.slice(0, 3).map((spec, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                >
                  {spec}
                </Badge>
              ))}
              {hospital.specialties.length > 3 && (
                <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                  +{hospital.specialties.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Contact Info */}
          {(hospital.phone || hospital.email) && (
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              {hospital.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {hospital.phone}
                </span>
              )}
              {hospital.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {hospital.email}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  )
}
