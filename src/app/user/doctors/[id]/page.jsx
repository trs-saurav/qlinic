'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MapPin, Stethoscope, Star, GraduationCap, 
  Languages, Clock, Building2, Award, BookOpen, 
  Video, ShieldCheck, MessageSquare 
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Placeholder for the BookAppointmentModal
import BookAppointmentModal from '@/components/user/BookAppointmentModal' 

export default function DoctorPublicProfile() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [affiliations, setAffiliations] = useState([])

  useEffect(() => {
    async function fetchDoctor() {
      try {
        const res = await fetch(`/api/patient/doctor/${id}`);
        const data = await res.json();
        if (data.success) {
          setDoctor(data.data?.doctor ?? data.data);
          setAffiliations(data.data?.affiliations ?? []);
        } else {
          toast.error(data.message || "Doctor not found");
        }
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchDoctor();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleOpenBookingModal = (hospital) => {
    setSelectedHospital(hospital)
    setIsBookingOpen(true)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  if (loading) return <ProfileSkeleton />
  if (!doctor) return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Doctor not found</div>

  const { doctorProfile: profile } = doctor
  const hospitals = (affiliations?.length ? affiliations.map(a => a.hospital) : profile?.affiliatedHospitals) || []

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20"
    >
      
      {/* --- HEADER / HERO SECTION --- */}
      <div className="bg-gradient-to-b from-blue-50/80 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b pt-12 pb-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            variants={itemVariants}
            className="flex flex-col md:flex-row gap-8 items-center md:items-start"
          >
            
            {/* Avatar Column */}
            <div className="shrink-0 flex flex-col items-center">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 blur-2xl rounded-full opacity-50"></div>
                <Avatar className="h-36 w-36 md:h-48 md:w-48 border-4 border-white dark:border-slate-800 shadow-xl ring-1 ring-slate-100 dark:ring-slate-700 relative z-10">
                  <AvatarImage src={doctor.profileImage} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-50 to-indigo-50 text-primary">
                    {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              
              {profile?.isOnlineConsultationAvailable && (
                <motion.div variants={itemVariants} className="mt-5 w-full">
                  <Button variant="outline" className="w-full gap-2 text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-700 shadow-sm">
                    <Video className="w-4 h-4" /> 
                    Video Consult (₹{profile.videoConsultationFee})
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Info Column */}
            <div className="flex-1 w-full text-center md:text-left space-y-6 pt-2">
              <div>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-lg text-slate-600 dark:text-slate-300 font-medium">
                      <div className="p-1.5 bg-blue-100/50 dark:bg-blue-900/30 rounded-full">
                         <Stethoscope className="w-4 h-4 text-primary" />
                      </div>
                      {profile?.specialization}
                    </div>
                  </div>
                  
                  {/* Rating Badge */}
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border shadow-sm mx-auto md:mx-0 w-fit"
                  >
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <div className="flex flex-col text-left leading-none">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{profile?.rating?.toFixed(1) || "New"}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide">Rating</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 <StatItem 
                   icon={GraduationCap} 
                   label="Experience" 
                   value={`${profile?.experience || 0}+ Years`} 
                   color="text-blue-500" 
                   bgColor="bg-blue-50 dark:bg-blue-900/20"
                 />
                 <StatItem 
                   icon={ShieldCheck} 
                   label="Reg. No" 
                   value={profile?.registrationNumber || "N/A"} 
                   color="text-green-500" 
                   bgColor="bg-green-50 dark:bg-green-900/20"
                 />
                 <StatItem 
                   icon={Clock} 
                   label="Fees" 
                   value={`₹${profile?.consultationFee}`} 
                   color="text-orange-500" 
                   bgColor="bg-orange-50 dark:bg-orange-900/20"
                 />
                 <StatItem 
                   icon={Languages} 
                   label="Languages" 
                   value={profile?.languages?.slice(0, 2).join(", ") || "English"} 
                   color="text-purple-500" 
                   bgColor="bg-purple-50 dark:bg-purple-900/20"
                 />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- MAIN CONTENT TABS --- */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8">
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex justify-center md:justify-start mb-8">
            <TabsList className="grid grid-cols-3 w-full md:w-[450px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="locations">Clinics</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            
            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" /> About Doctor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                      {profile?.about || `Dr. ${doctor.lastName} is a dedicated ${profile?.specialization} with over ${profile?.experience} years of experience. Committed to providing excellent patient care and known for a compassionate approach.`}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Expertise Section */}
                  <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" /> Areas of Expertise
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {profile?.expertise?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.expertise.map((item, index) => (
                            <motion.div key={index} whileHover={{ scale: 1.05 }}>
                              <Badge variant="secondary" className="px-3 py-1 font-normal bg-white border shadow-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {item}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No specific expertise listed.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Education Section */}
                  <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" /> Education & Training
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {profile?.qualifications?.length ? (
                          <ul className="space-y-2">
                            {profile.qualifications.map((q, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                {q}
                              </li>
                            ))}
                          </ul>
                      ) : (
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-start gap-2 mb-2">
                                <span className="font-medium text-slate-900 dark:text-white">Medical Degree</span>
                                <span className="block text-xs text-slate-500">Verified</span>
                            </div>
                          </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>

            {/* TAB 2: LOCATIONS */}
            <TabsContent value="locations">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {hospitals.length === 0 ? (
                  <Card className="bg-slate-50 border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                      <Building2 className="w-12 h-12 mb-3 opacity-20" />
                      <p className="font-medium">No hospital affiliations listed yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {hospitals.map((hospital, idx) => (
                      <motion.div 
                        key={hospital._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="group overflow-hidden border-l-4 border-l-transparent hover:border-l-primary hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                          <CardContent className="p-0 flex flex-col h-full">
                            <div className="flex flex-col sm:flex-row h-full">
                              
                              {/* Hospital Image - Wrapped in Link */}
                              <Link 
                                href={`/user/hospitals/${hospital._id}`}
                                className="sm:w-36 h-40 sm:h-auto bg-slate-100 relative shrink-0 overflow-hidden cursor-pointer block"
                              >
                                  {hospital.logo ? (
                                    <img 
                                      src={hospital.logo} 
                                      alt={hospital.name} 
                                      className="w-full h-full rounded-full  group-hover:scale-105 transition-transform duration-500" 
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Building2 className="w-10 h-10" />
                                    </div>
                                  )}
                              </Link>

                              <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start mb-1">
                                    {/* Hospital Name - Wrapped in Link */}
                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                                      <Link href={`/user/hospitals/${hospital._id}`} className="hover:underline">
                                        {hospital.name}
                                      </Link>
                                    </h3>
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0 ml-2">Clinic</Badge>
                                  </div>
                                  
                                  <div className="space-y-2 mt-3">
                                    <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
                                      <span className="line-clamp-2 leading-tight">
                                        {hospital.address ? `${hospital.address.street}, ${hospital.address.city}` : "Address not available"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <Clock className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                                        <span>Mon - Sat, 10:00 AM - 7:00 PM</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                  <div className="text-xs font-medium text-slate-500">
                                      <span className="text-slate-900 font-bold text-sm">₹{profile?.consultationFee}</span> / Visit
                                  </div>
                                  <Button onClick={() => handleOpenBookingModal(hospital)} size="sm" className="shadow-sm hover:shadow-md">
                                    Book Now
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* TAB 3: REVIEWS */}
            <TabsContent value="reviews">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 transition={{ duration: 0.3 }}
              >
                <Card className="bg-slate-50/50 border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <motion.div 
                      initial={{ rotate: -10 }}
                      animate={{ rotate: 10 }}
                      transition={{ repeat: Infinity, repeatType: "mirror", duration: 2 }}
                      className="bg-white p-4 rounded-full shadow-sm mb-4"
                    >
                      <MessageSquare className="w-10 h-10 text-primary/60" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Patient Reviews Coming Soon
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                      We are currently verifying patient feedback to ensure authentic and helpful reviews. Check back later!
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

          </AnimatePresence>
        </Tabs>
      </div>

      {isBookingOpen && (
        <BookAppointmentModal 
          doctor={doctor} 
          hospital={selectedHospital}
          isOpen={isBookingOpen} 
          onClose={() => setIsBookingOpen(false)} 
        />
      )}

    </motion.div>
  )
}

// Stats Component
function StatItem({ icon: Icon, label, value, color, bgColor }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="flex flex-col md:flex-row items-center md:items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
    >
       <div className={`p-2 rounded-lg ${bgColor}`}>
         <Icon className={`w-4 h-4 ${color}`} />
       </div>
       <div className="text-center md:text-left">
         <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">{label}</p>
         <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[100px]">{value}</p>
       </div>
    </motion.div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <Skeleton className="h-40 w-40 rounded-full" />
        <div className="space-y-4 flex-1 w-full text-center md:text-left">
          <Skeleton className="h-8 w-3/4 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-1/2 mx-auto md:mx-0" />
          <div className="grid grid-cols-4 gap-4 mt-4">
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-[300px]" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
