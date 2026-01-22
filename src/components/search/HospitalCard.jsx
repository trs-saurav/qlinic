import Image from "next/image";
import { MapPin, Star, Phone, Calendar, Clock, ShieldCheck, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HospitalCard({ hospital }) {
  return (
    <div className="group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 flex flex-col sm:flex-row gap-5">
      
      {/* LEFT: Image / Logo */}
      <div className="relative shrink-0 w-full sm:w-48 h-40 bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
        {hospital.logo ? (
          <Image 
            src={hospital.logo} 
            alt={hospital.name} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-300">
            <HospitalIcon className="w-12 h-12" />
          </div>
        )}
        
        {/* Overlays */}
        {hospital.isEmergency && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
            Emergency 24/7
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-sm text-xs font-bold rounded-md shadow-sm flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          {hospital.rating || "New"}
        </div>
      </div>

      {/* RIGHT: Content */}
      <div className="flex-1 flex flex-col justify-between">
        
        {/* Top Section */}
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors flex items-center gap-2">
                {hospital.name}
                {hospital.isVerified && <ShieldCheck className="w-4 h-4 text-blue-500" aria-label="Verified" />}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" /> 
                {hospital.address?.street ? `${hospital.address.street}, ` : ''}{hospital.address?.city || hospital.city}
              </p>
            </div>
            
            {/* Distance Badge */}
            {hospital.distance && (
              <Badge variant="secondary" className="hidden sm:flex bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <Navigation className="w-3 h-3 mr-1" /> {hospital.distance.toFixed(1)} km
              </Badge>
            )}
          </div>

          {/* Specialties Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {hospital.specialties?.slice(0, 4).map((spec, i) => (
              <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-md">
                {spec}
              </span>
            ))}
            {hospital.specialties?.length > 4 && (
              <span className="text-xs text-slate-400 py-1 px-1">+{hospital.specialties.length - 4} more</span>
            )}
          </div>
        </div>

        {/* Bottom Section: Actions */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
             <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-full dark:bg-green-900/20 dark:text-green-400">
               <Clock className="w-3.5 h-3.5" /> Open Now
             </span>
             <span className="hidden sm:inline">20+ Doctors</span>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20">
              <Phone className="w-4 h-4 mr-2" /> Call
            </Button>
            <Button className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 dark:shadow-none">
              <Calendar className="w-4 h-4 mr-2" /> Book Visit
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Simple fallback icon component
function HospitalIcon({className}) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}