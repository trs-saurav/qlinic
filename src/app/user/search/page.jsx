"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { searchHospitalsWithAI } from "@/app/(public)/actions/smartSearch";
import HospitalCard from "@/components/search/HospitalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider"; 
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Filter, 
  Map as MapIcon, // 👈 RENAMED to avoid conflict with JS 'new Map()'
  SlidersHorizontal, 
  ArrowDownWideNarrow, 
  Loader2, 
  Star, 
  Search, 
  MapPin, 
  Navigation, 
  Sparkles,
  ShieldCheck,
  Clock,
  Phone,
  Calendar
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import BookAppointmentModal from "@/components/user/appointments/BookAppointmentModal";
import Image from "next/image";
import toast from "react-hot-toast";

// --- SUSPENSE WRAPPER ---
export default function SearchPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600"/>
        <p className="text-slate-500 text-sm font-medium">Loading...</p>
      </div>
    }>
      <SearchPage />
    </Suspense>
  );
}

function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // --- STATES ---
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Location
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState(searchParams.get("loc") || "Patna");
  const [locationStatus, setLocationStatus] = useState("idle");

  // Filters
  const [radius, setRadius] = useState([50]); 
  const [minRating, setMinRating] = useState(0);
  const [filterEmergency, setFilterEmergency] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);

  // Booking Modal
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [hospitalDoctors, setHospitalDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // --- EFFECTS ---

  // 1. Load Location
  useEffect(() => {
    try {
      const cached = localStorage.getItem("userLocation");
      if (cached) {
        const parsed = JSON.parse(cached);
        setUserLocation(parsed);
        if (!searchParams.get("loc")) setLocationName(parsed.city || parsed.name || "");
      }
    } catch (e) { console.error(e); }
  }, []);

  // 2. Perform Search
  const performSearch = async (overrideQuery = query, overrideLoc = locationName) => {
    setLoading(true);
    try {
      // Update URL without reload
      const newUrl = `/user/search?q=${encodeURIComponent(overrideQuery)}&loc=${encodeURIComponent(overrideLoc)}`;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);

      const res = await searchHospitalsWithAI(
        overrideQuery,
        userLocation?.latitude,
        userLocation?.longitude,
        overrideLoc
      );
      
      if (res.success) {
        setResults(res.results);
        setAnalysis(res.analysis);
      }
    } catch (error) {
      console.error("Search Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    performSearch(searchParams.get("q") || "", searchParams.get("loc") || "Patna");
  }, []);

  // --- HANDLERS ---

  const handleGPSLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || "Unknown";
          
          const newLoc = { latitude, longitude, city, name: city };
          setUserLocation(newLoc);
          setLocationName(city);
          setLocationStatus("done");
          localStorage.setItem("userLocation", JSON.stringify(newLoc));
          performSearch(query, city);
        } catch (e) { setLocationStatus("error"); }
    }, () => setLocationStatus("error"));
  };

  const handleRefineSubmit = (e) => {
    e.preventDefault();
    performSearch();
  };

  const fetchDoctors = async (hospitalId) => {
    setLoadingDoctors(true);
    try {
      const res = await fetch(`/api/patient/hospital/${hospitalId}`);
      const data = await res.json();
      if (data.success) setHospitalDoctors(data.hospital.doctors || []);
    } catch (e) { console.error(e); } 
    finally { setLoadingDoctors(false); }
  };

  const openBookingModal = async (e, hospital) => {
    e.stopPropagation();
    setSelectedHospital(hospital);
    setShowBookingModal(true);
    await fetchDoctors(hospital._id || hospital.id);
  };

  const handleShare = (e, hospital) => {
    e.stopPropagation();
    const url = `${window.location.origin}/user/hospitals/${hospital._id || hospital.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  // Client-Side Filtering
  const filteredResults = results.filter(h => {
    if (h.distance && h.distance > radius[0]) return false;
    if (minRating > 0 && (h.rating || 0) < minRating) return false;
    if (filterEmergency && !h.isEmergency) return false;
    if (filterVerified && !h.isVerified) return false;
    return true;
  }).sort((a, b) => {
     if(a.distance && b.distance) return a.distance - b.distance;
     return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      
      {/* 1. TOP BAR */}
      <div className="sticky top-[64px] z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            
            <form onSubmit={handleRefineSubmit} className="flex gap-2 w-full md:max-w-3xl">
               <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input 
                    value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search hospitals..." 
                    className="pl-9 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-950 transition-all"
                  />
               </div>
               
               <div className="relative w-[35%] md:w-48 group flex">
                  <Input 
                    value={locationName} onChange={(e) => setLocationName(e.target.value)}
                    placeholder="City..." 
                    className="pl-9 rounded-r-none bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-950 transition-all"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Button type="button" onClick={handleGPSLocation} variant="outline" size="icon" className="rounded-l-none border-l-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">
                     {locationStatus === 'detecting' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Navigation className="w-4 h-4 text-blue-600"/>}
                  </Button>
               </div>

               <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                 {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Search"}
               </Button>
            </form>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter Results</SheetTitle>
                  <SheetDescription>Narrow down your search</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                   <FilterControls 
                      radius={radius} setRadius={setRadius}
                      minRating={minRating} setMinRating={setMinRating}
                      filterEmergency={filterEmergency} setFilterEmergency={setFilterEmergency}
                      filterVerified={filterVerified} setFilterVerified={setFilterVerified}
                   />
                   <Button className="w-full" onClick={() => document.querySelector('[data-state="open"]')?.click()}>Show Results</Button>
                </div>
              </SheetContent>
            </Sheet>

          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR (Desktop Filters) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
             <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-32">
                <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white font-bold text-lg">
                   <Filter className="w-5 h-5" /> Filters
                </div>
                <FilterControls 
                    radius={radius} setRadius={setRadius}
                    minRating={minRating} setMinRating={setMinRating}
                    filterEmergency={filterEmergency} setFilterEmergency={setFilterEmergency}
                    filterVerified={filterVerified} setFilterVerified={setFilterVerified}
                />
             </div>
          </div>

          {/* RIGHT CONTENT (Results) */}
          <div className="lg:col-span-9 space-y-6">
            
            <div className="flex items-center justify-between">
               <p className="text-sm text-slate-500">
                 Found <span className="font-bold text-slate-900 dark:text-white">{filteredResults.length}</span> hospitals near <span className="font-medium text-blue-600">{locationName}</span>
               </p>
               <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-slate-600">
                 <ArrowDownWideNarrow className="w-4 h-4" /> Sort by: Nearest
               </Button>
            </div>


            {/* RESULTS LIST */}
            <div className="space-y-4">
              {loading ? (
                 [1,2,3].map(i => (
                   <div key={i} className="h-56 w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                 ))
              ) : filteredResults.length > 0 ? (
                 filteredResults.map(hospital => (
                    <HospitalResultCard 
                       key={hospital._id || hospital.id} 
                       hospital={hospital}
                       onBook={(e) => openBookingModal(e, hospital)}
                       onViewProfile={() => router.push(`/user/hospitals/${hospital._id || hospital.id}`)}
                    />
                 ))
              ) : (
                 <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No hospitals found</h3>
                    <p className="text-slate-500 mt-2 max-w-xs mx-auto">Adjust your filters or try searching for a different keyword.</p>
                    <Button variant="link" className="mt-4 text-blue-600" onClick={() => window.location.reload()}>Clear Filters</Button>
                 </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {showBookingModal && selectedHospital && (
        <BookAppointmentModal
          isOpen={showBookingModal}
          onClose={() => { setShowBookingModal(false); setSelectedHospital(null); setHospitalDoctors([]); }}
          hospitalId={selectedHospital._id || selectedHospital.id}
          hospitalName={selectedHospital.name}
          doctors={hospitalDoctors}
          loadingDoctors={loadingDoctors}
          userLocation={userLocation}
        />
      )}

    </div>
  );
}

// --- SUB-COMPONENTS ---

function FilterControls({ radius, setRadius, minRating, setMinRating, filterEmergency, setFilterEmergency, filterVerified, setFilterVerified }) {
  // Use a local state for the slider to prevent stuttering, commit changes on release
  const [localRadius, setLocalRadius] = useState(radius);

  return (
    <div className="space-y-8">
       {/* Radius */}
       <div>
          <div className="flex justify-between mb-3">
             <span className="text-sm font-medium">Distance</span>
             <Badge variant="secondary">{localRadius} km</Badge>
          </div>
          <Slider 
            defaultValue={radius} 
            max={100} 
            step={5} 
            onValueChange={setLocalRadius} // Update visual number immediately
            onValueCommit={setRadius} // Update actual filter ONLY when drag stops
            className="py-2" 
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
             <span>0km</span>
             <span>100km</span>
          </div>
       </div>

       {/* Rating */}
       <div>
          <h4 className="text-sm font-medium mb-3">Minimum Rating</h4>
          <div className="space-y-2">
             {[4, 3, 2, 0].map(r => (
                <label key={r} className="flex items-center gap-3 cursor-pointer group">
                   <input type="radio" name="rating_filter" className="w-4 h-4 text-blue-600 accent-blue-600" checked={minRating === r} onChange={() => setMinRating(r)} />
                   <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                      {r === 0 ? "Any Rating" : <>{r}+ <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Stars</>}
                   </span>
                </label>
             ))}
          </div>
       </div>

       {/* Toggles */}
       <div>
          <h4 className="text-sm font-medium mb-3">Hospital Type</h4>
          <div className="space-y-3">
             <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-600 dark:text-slate-300">Verified Only</span>
                <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={filterVerified} onChange={(e) => setFilterVerified(e.target.checked)} />
             </label>
             <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-600 dark:text-slate-300">Emergency 24/7</span>
                <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={filterEmergency} onChange={(e) => setFilterEmergency(e.target.checked)} />
             </label>
          </div>
       </div>
    </div>
  )
}

function HospitalResultCard({ hospital, onBook, onViewProfile }) {
  const phone = hospital?.contactDetails?.phone || hospital.phone;

  // Function to handle sharing
  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/user/hospitals/${hospital._id || hospital.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: hospital.name,
        text: `Check out ${hospital.name} on Qlinic`,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row gap-5">
       
       {/* Image */}
       <div 
         onClick={onViewProfile}
         className="relative w-full sm:w-48 h-40 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 cursor-pointer"
       >
          {hospital.logo ? (
             <Image src={hospital.logo} alt={hospital.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
             <div className="flex items-center justify-center h-full text-slate-300"><MapPin className="w-12 h-12"/></div>
          )}
          {hospital.isEmergency && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">EMERGENCY</span>}
          {hospital.rating > 0 && (
             <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1 text-xs font-bold shadow-sm">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {hospital.rating}
             </div>
          )}
       </div>

       {/* Details */}
       <div className="flex-1 flex flex-col justify-between">
          <div>
             <div className="flex justify-between items-start">
                <h3 onClick={onViewProfile} className="text-lg font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2">
                   {hospital.name}
                   {hospital.isVerified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                </h3>
                {/* Share Button (Added) */}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 -mt-1 -mr-2" onClick={handleShare}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share-2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
                </Button>
             </div>
             
             <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" /> 
                {hospital.address?.street ? `${hospital.address.street}, ` : ''}{hospital.address?.city || hospital.city}
                {hospital.distance && <span className="text-blue-600 font-medium ml-2">• {hospital.distance.toFixed(1)} km away</span>}
             </p>

             <div className="flex flex-wrap gap-2 mt-3">
                {hospital.specialties?.slice(0,4).map((s,i) => (
                   <span key={i} className="text-[11px] font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">{s}</span>
                ))}
                {hospital.specialties?.length > 4 && <span className="text-xs text-slate-400 self-center">+{hospital.specialties.length - 4} more</span>}
             </div>
          </div>

          {/* Actions */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
             <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full"><Clock className="w-3 h-3"/> Open Now</span>
             </div>
             <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    if(phone) window.location.href=`tel:${phone}`;
                    else toast.error("Phone number not available");
                  }}
                >
                   <Phone className="w-4 h-4 mr-2" /> Call
                </Button>
                <Button className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white" onClick={onBook}>
                   <Calendar className="w-4 h-4 mr-2" /> Book Visit
                </Button>
             </div>
          </div>
       </div>
    </div>
  )
}