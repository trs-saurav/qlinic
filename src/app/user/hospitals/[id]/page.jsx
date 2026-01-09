'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Avatar, AvatarFallback, AvatarImage 
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MapPin, Phone, Globe, Star, Users, 
  Clock, Building2, Activity, Bed, 
  Stethoscope, ShieldCheck, MessageSquare, 
  CheckCircle2, Mail, Navigation, Calendar,
  ImageIcon, ArrowRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import BookAppointmentModal from '@/components/user/BookAppointmentModal' 

// --- Helper: Parse time to minutes ---
const parseToMinutes = (timeStr) => {
  if (!timeStr) return -1;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)?$/i);
  if (!match) return -1;

  let [_, h, m, ampm] = match;
  let hour = parseInt(h, 10);
  let minute = parseInt(m, 10);

  if (ampm) {
    ampm = ampm.toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  }
  return hour * 60 + minute;
};

// --- Helper: Display Time Nicely ---
const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.match(/(AM|PM)/i)) return timeStr.toUpperCase();
  const [hour, minute] = timeStr.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
};

// --- ✅ FIX: Determine if a day is effectively open ---
// Returns TRUE if isOpen is true OR if valid times are provided (ignoring false flag)
const isDayActive = (daySchedule) => {
  if (!daySchedule) return false;
  // If flag is explicitly true, it's open
  if (daySchedule.isOpen) return true;
  // If flag is false, BUT we have valid start/end times, treat as open
  // This fixes the issue where Sunday defaults to isOpen:false but has '09:00' default time
  if (daySchedule.open && daySchedule.close && daySchedule.open !== '' && daySchedule.close !== '') {
    return true;
  }
  return false;
};

// --- Helper: Check if Open Now ---
const checkIfOpen = (operatingHours) => {
  if (!operatingHours) return false;
  if (operatingHours.isOpen24x7) return true;

  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[now.getDay()];
  const todaySchedule = operatingHours[currentDay];

  // Use the new lenient check
  if (!isDayActive(todaySchedule)) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = parseToMinutes(todaySchedule.open);
  const closeMinutes = parseToMinutes(todaySchedule.close);

  if (openMinutes === -1 || closeMinutes === -1) return false;
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
};

export default function HospitalPublicProfile() {
  const { id } = useParams()
  const [data, setData] = useState({ hospital: null, doctors: [] })
  const [loading, setLoading] = useState(true)
  const [isOpenNow, setIsOpenNow] = useState(false)
  
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  useEffect(() => {
    async function fetchHospital() {
      try {
        const res = await fetch(`/api/patient/hospital/${id}`);
        const result = await res.json();
        
        if (result.success) {
          setData(result.data);
          if (result.data.hospital?.operatingHours) {
            setIsOpenNow(checkIfOpen(result.data.hospital.operatingHours));
          }
        } else {
          toast.error(result.message || "Hospital not found");
        }
      } catch (error) {
        toast.error("Failed to load hospital profile");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchHospital();
  }, [id]);

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor)
    setIsBookingOpen(true)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  if (loading) return <HospitalSkeleton />
  if (!data.hospital) return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Hospital not found</div>

  const { hospital, doctors } = data;
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20"
    >
      
      {/* --- HERO SECTION --- */}
      <div className="bg-gradient-to-b from-blue-50/80 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b pt-8 pb-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Cover Photo & Logo */}
          <div className="relative mb-16 md:mb-20">
             <div className="h-48 md:h-72 w-full rounded-2xl overflow-hidden bg-slate-200 border shadow-sm group">
                {hospital.coverPhoto ? (
                  <img src={hospital.coverPhoto} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-slate-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
             </div>
             
             <div className="absolute -bottom-12 md:-bottom-16 left-6 md:left-10 z-10">
                <Avatar className="h-32 w-32 md:h-44 md:w-44 border-4 border-white dark:border-slate-950 shadow-xl bg-white rounded-full">
                  <AvatarImage src={hospital.logo || hospital.profileImage} className="object-contain p-2 rounded-full" />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary rounded-full">
                    {hospital.name?.[0]}
                  </AvatarFallback>
                </Avatar>
             </div>
          </div>

          {/* Info Header */}
          <div className="md:ml-52 flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-3 w-full">
               <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {hospital.name}
                  </h1>
                  {hospital.isVerified && (
                    <Badge variant="secondary" className="w-fit bg-blue-50 text-blue-700 border-blue-200 gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </Badge>
                  )}
               </div>
               
               <div className="flex flex-col gap-2 text-slate-600 dark:text-slate-400">
                 <div className="flex items-center gap-2 text-sm md:text-base">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      {hospital.address?.street}, {hospital.address?.city}, {hospital.address?.state} {hospital.address?.pincode}
                    </span>
                 </div>
                 {hospital.contactDetails?.website && (
                   <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-primary shrink-0" />
                      <a href={hospital.contactDetails.website} target="_blank" rel="noreferrer" className="hover:underline text-blue-600">
                        {hospital.contactDetails.website}
                      </a>
                   </div>
                 )}
               </div>
            </div>

            <div className="flex flex-col items-end gap-4 w-full md:w-auto">
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border shadow-sm cursor-default"
               >
                 <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                 <div className="flex flex-col text-left leading-none">
                   <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{hospital.rating?.toFixed(1) || "New"}</span>
                   <span className="text-[10px] text-slate-500 uppercase tracking-wide">Rating</span>
                 </div>
               </motion.div>

               <div className="flex gap-3 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none gap-2 border-slate-300 hover:bg-slate-50"
                    onClick={() => window.open(`tel:${hospital.contactDetails?.phone}`)}
                  >
                    <Phone className="w-4 h-4" /> Call Now
                  </Button>
                  <Button className="flex-1 md:flex-none gap-2">
                    <Navigation className="w-4 h-4" /> Get Directions
                  </Button>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
             <StatItem icon={Activity} label="Type" value={hospital.type} color="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-900/20" />
             <StatItem icon={Bed} label="Total Beds" value={hospital.totalBeds} color="text-green-500" bgColor="bg-green-50 dark:bg-green-900/20" />
             <StatItem icon={Users} label="Doctors" value={doctors.length} color="text-purple-500" bgColor="bg-purple-50 dark:bg-purple-900/20" />
             <StatItem 
                icon={Clock} 
                label="Status" 
                value={isOpenNow ? "Open Now" : "Closed"} 
                color={isOpenNow ? "text-green-600" : "text-red-500"} 
                bgColor={isOpenNow ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"} 
             />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-[500px] mb-8 bg-slate-100 dark:bg-slate-900 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="doctors">Doctors ({doctors.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="overview">
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.3 }}
                 className="grid grid-cols-1 md:grid-cols-3 gap-8"
               >
                  <div className="md:col-span-2 space-y-8">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-primary" /> About Hospital
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {hospital.description || "No description provided for this hospital."}
                        </p>
                      </CardContent>
                    </Card>

                    {hospital.images && hospital.images.length > 0 && (
                      <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                             <ImageIcon className="w-5 h-5 text-primary" /> Gallery
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {hospital.images.map((img, idx) => (
                                <div key={idx} className="aspect-video rounded-lg overflow-hidden border bg-slate-100 relative group cursor-pointer">
                                   <img src={img} alt={`Hospital view ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                </div>
                              ))}
                           </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Stethoscope className="w-5 h-5 text-primary" /> Specialties
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {hospital.specialties?.length > 0 ? (
                            hospital.specialties.map((spec, i) => (
                              <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm bg-white border shadow-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {spec}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-muted-foreground italic">No specialties listed.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                             <CheckCircle2 className="w-5 h-5 text-primary" /> Facilities & Amenities
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {hospital.facilities?.length > 0 ? (
                              hospital.facilities.map((facility, i) => (
                                <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                  {facility}
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground italic col-span-2">No facilities listed.</p>
                            )}
                          </div>
                        </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                      <Card>
                         <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base">Contact Information</CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-4 pt-4 text-sm">
                            <div className="flex items-center gap-3">
                               <div className="bg-primary/10 p-2 rounded-lg"><Phone className="w-4 h-4 text-primary" /></div>
                               <div>
                                  <p className="text-slate-500 text-xs uppercase tracking-wide">Phone</p>
                                  <p className="font-medium">{hospital.contactDetails?.phone}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="bg-primary/10 p-2 rounded-lg"><Mail className="w-4 h-4 text-primary" /></div>
                               <div>
                                  <p className="text-slate-500 text-xs uppercase tracking-wide">Email</p>
                                  <p className="font-medium break-all">{hospital.contactDetails?.email}</p>
                               </div>
                            </div>
                            {hospital.contactDetails?.emergencyNumber && (
                               <div className="flex items-center gap-3">
                                  <div className="bg-red-100 p-2 rounded-lg"><Activity className="w-4 h-4 text-red-600" /></div>
                                  <div>
                                     <p className="text-slate-500 text-xs uppercase tracking-wide">Emergency</p>
                                     <p className="font-medium text-red-600">{hospital.contactDetails.emergencyNumber}</p>
                                  </div>
                               </div>
                            )}
                         </CardContent>
                      </Card>

                      {/* ✅ FIX: Operating Hours ignores 'isOpen: false' if valid times are present */}
                      <Card>
                         <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
                            <CardTitle className="text-base">Operating Hours</CardTitle>
                            {!hospital.operatingHours?.isOpen24x7 && (
                               <Badge variant={isOpenNow ? "default" : "destructive"} className="text-[10px] h-5">
                                  {isOpenNow ? 'Open Now' : 'Closed'}
                               </Badge>
                            )}
                         </CardHeader>
                         <CardContent className="pt-4">
                            {hospital.operatingHours?.isOpen24x7 ? (
                               <div className="flex flex-col items-center justify-center gap-2 text-green-700 font-medium bg-green-50 p-6 rounded-lg border border-green-200 text-center">
                                  <Clock className="w-8 h-8 opacity-50" /> 
                                  <span>Open 24 Hours<br/><span className="text-xs opacity-70">All Days of Week</span></span>
                               </div>
                            ) : (
                               <div className="space-y-1">
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                                     const hours = hospital.operatingHours?.[day];
                                     const isToday = day === currentDayName;
                                     
                                     if (!hours) return null;
                                     const isActive = isDayActive(hours); // Use new active check

                                     return (
                                        <div 
                                          key={day} 
                                          className={`flex justify-between items-center py-2 px-2 rounded-md ${isToday ? 'bg-primary/5 font-semibold ring-1 ring-primary/20' : ''}`}
                                        >
                                           <span className={`text-sm ${isToday ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                             {day} {isToday && <span className="text-[10px] ml-1 bg-primary text-white px-1.5 py-0.5 rounded-full">Today</span>}
                                           </span>
                                           <span className={`text-sm ${isActive ? (isToday ? 'text-primary' : 'text-slate-600 dark:text-slate-400') : 'text-red-500 italic'}`}>
                                              {isActive ? `${formatDisplayTime(hours.open)} - ${formatDisplayTime(hours.close)}` : "Closed"}
                                           </span>
                                        </div>
                                     );
                                  })}
                               </div>
                            )}
                         </CardContent>
                      </Card>
                  </div>
               </motion.div>
            </TabsContent>

            <TabsContent value="doctors">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 transition={{ duration: 0.3 }}
                 className="flex flex-col gap-4"
              >
                {doctors.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-50/50 rounded-lg border border-dashed">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                         <Stethoscope className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="font-medium">No doctors currently listed for this hospital.</p>
                      <p className="text-sm">Please check back later.</p>
                   </div>
                ) : (
                   doctors.map((doc, idx) => (
                      <motion.div 
                        key={doc._id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                         <Card className="group hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-primary overflow-hidden">
                            <CardContent className="p-0">
                               <div className="flex flex-col md:flex-row">
                                 <div className="p-5 md:w-64 bg-slate-50/50 dark:bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-3">
                                    <Link href={`/user/doctors/${doc._id}`}>
                                      <Avatar className="h-28 w-28 rounded-full border-4 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                          <AvatarImage src={doc.profileImage} className="object-cover" />
                                          <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                                             {doc.firstName?.[0]}{doc.lastName?.[0]}
                                          </AvatarFallback>
                                      </Avatar>
                                    </Link>
                                    <div className="flex flex-col items-center">
                                       <span className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> {doc.rating || "New"}
                                       </span>
                                    </div>
                                 </div>

                                 <div className="flex-1 p-5 md:p-6 flex flex-col justify-center">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                                       <div>
                                          <Link href={`/user/doctors/${doc._id}`} className="text-xl font-bold hover:text-primary transition-colors">
                                            Dr. {doc.firstName} {doc.lastName}
                                          </Link>
                                          <p className="text-primary font-medium flex items-center gap-2 mt-1">
                                             {doc.specialization}
                                             <span className="text-slate-300">•</span>
                                             <span className="text-slate-600 dark:text-slate-400 text-sm font-normal">{doc.experience || 0}+ Years Exp</span>
                                          </p>
                                       </div>
                                       <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">
                                          Available Today
                                       </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-auto">
                                       <div>
                                          <p className="text-xs text-slate-500 uppercase font-semibold">Consultation Fee</p>
                                          <p className="font-bold text-lg text-slate-900">₹{doc.consultationFee}</p>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="p-5 md:w-64 flex flex-col justify-center gap-3 bg-slate-50/30 dark:bg-slate-900/30 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800">
                                     <Button onClick={() => handleBookAppointment(doc)} className="w-full gap-2 shadow-sm bg-primary hover:bg-primary/90">
                                          <Calendar className="w-4 h-4" /> Book Appointment
                                     </Button>
                                     <Link href={`/user/doctors/${doc._id}`} className="w-full">
                                       <Button variant="outline" className="w-full gap-2 hover:bg-white hover:text-primary border-slate-200">
                                          View Profile <ArrowRight className="w-4 h-4" />
                                       </Button>
                                     </Link>
                                 </div>
                               </div>
                            </CardContent>
                         </Card>
                      </motion.div>
                   ))
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="reviews">
               <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="bg-slate-50/50 border-dashed border-2">
                     <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <MessageSquare className="w-12 h-12 text-primary/30 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Patient Reviews Coming Soon</h3>
                     </CardContent>
                  </Card>
               </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {isBookingOpen && (
        <BookAppointmentModal 
          doctor={selectedDoctor} 
          hospital={hospital}
          isOpen={isBookingOpen} 
          onClose={() => setIsBookingOpen(false)} 
        />
      )}

    </motion.div>
  )
}

function StatItem({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
       <div className={`p-2 rounded-lg ${bgColor}`}>
         <Icon className={`w-4 h-4 ${color}`} />
       </div>
       <div className="text-center md:text-left">
         <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">{label}</p>
         <p className="font-bold text-sm text-slate-900 dark:text-slate-100 capitalize truncate max-w-[120px]">{value}</p>
       </div>
    </div>
  )
}

function HospitalSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="space-y-4 flex-1">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
         <Skeleton className="h-20 w-full" />
         <Skeleton className="h-20 w-full" />
         <Skeleton className="h-20 w-full" />
         <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
