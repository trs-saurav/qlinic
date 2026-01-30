'use client'

import { signIn, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { 
  Users, Stethoscope, Building2, Shield, Loader2, 
  Eye, EyeOff, Mail, Lock, Chrome, Check 
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ✅ Centralized route mapping to fix the hospital_admin -> /hospital issue
const ROLE_ROUTES = {
  user: '/user',
  doctor: '/doctor',
  hospital_admin: '/hospital', // Mapping the database role to your folder name
  admin: '/admin',
  sub_admin: '/sub-admin'
}

export default function SignInClient() {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  const roleFromUrl = searchParams.get('role') || 'user'
  const redirectTo = searchParams.get('redirect')
  const emailFromUrl = searchParams.get('email') || ''
  
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: emailFromUrl, password: '' },
  })

  const roles = {
    user: {
      label: 'Patient',
      description: 'Book appointments, access records, and manage health',
      icon: Users,
      features: ['Instant booking', 'Medical records', 'Family profiles']
    },
    doctor: {
      label: 'Doctor',
      description: 'Manage consultations, patients, and your practice',
      icon: Stethoscope,
      features: ['Consultations', 'Patient history', 'Availability']
    },
    hospital_admin: {
      label: 'Hospital Admin',
      description: 'Control operations, staff, and performance',
      icon: Building2,
      features: ['Staff management', 'Analytics', 'Operations']
    },
    admin: {
      label: 'Admin',
      description: 'System restricted to Qlinic personnel only',
      icon: Shield,
      features: ['System control', 'User management', 'Security']
    }
  }

  const currentRole = roles[roleFromUrl] || roles.user
  const IconComponent = currentRole.icon

  // ✅ REDIRECT LOGIC: Uses the centralized ROLE_ROUTES map
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = session.user.role 
      
      // Prioritize explicit redirect param, then use the role map
      const destination = redirectTo || ROLE_ROUTES[userRole] || '/user'
      
      const timer = setTimeout(() => {
        window.location.href = destination
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [status, session, redirectTo])

  const onSubmit = async (data) => {
    setLoading(true)
    const loadingToast = toast.loading('Authenticating...')
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        role: roleFromUrl,
        redirect: false 
      })

      toast.dismiss(loadingToast)
      
      if (result?.error) {
        toast.error('Invalid credentials or unauthorized role for this portal.')
        setLoading(false)
        return
      }
      
      if (result?.ok) {
        toast.success('Access Granted.')
      }
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Connection error.')
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider) => {
    if (roleFromUrl === 'admin') {
      toast.error('Admin accounts must be authorized manually.')
      return
    }

    setSocialLoading(provider);
    try {
      // ✅ Use the mapping to ensure OAuth sends users to /hospital instead of /hospital_admin
      const callbackPath = ROLE_ROUTES[roleFromUrl] || '/user';
      const absoluteCallbackUrl = `${window.location.origin}${callbackPath}`;

      document.cookie = `oauth_role_token=${roleFromUrl}; path=/; max-age=300; SameSite=Lax;`

      await signIn(provider, { 
        callbackUrl: absoluteCallbackUrl,
        redirect: true 
      });
    } catch (error) {
      toast.error('Login initiation failed.')
      setSocialLoading(null)
    }
  }

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#020617]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.1, 1], x: [0, 50, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-[100px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-5xl h-full max-h-[90vh] overflow-y-auto px-4">
        <div className="border-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
          
          <div className="grid lg:grid-cols-2 gap-0 p-6 md:p-10 items-center">
            {/* Left Info Section */}
            <div className="hidden lg:flex flex-col pr-10 border-r border-slate-200/50 dark:border-slate-700/50">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <IconComponent className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentRole.label}</h2>
                    <p className="text-sm text-slate-500">Secure Access Portal</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{currentRole.description}</p>
                <div className="space-y-3">
                  {currentRole.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={3} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700 pt-4 inline-block">Change portal role →</Link>
              </div>
            </div>

            {/* Right Form Section */}
            <div className="flex flex-col w-full lg:pl-10">
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome Back</h2>
                <p className="text-sm text-slate-500">Sign in to your {currentRole.label.toLowerCase()} account</p>
              </div>

              {roleFromUrl !== 'admin' && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {['google', 'facebook', 'apple'].map((p) => (
                    <Button key={p} variant="outline" onClick={() => handleSocialLogin(p)} disabled={loading} className="h-12 border-2 rounded-xl hover:border-blue-500 transition-all">
                      {socialLoading === p ? <Loader2 className="animate-spin" /> : 
                        p === 'google' ? <Chrome className="w-5 h-5 text-blue-600" /> : <span className="text-xs font-bold uppercase">{p}</span>}
                    </Button>
                  ))}
                </div>
              )}

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><Separator /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-slate-400">Authentication</span></div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          <Input className="pl-10 h-12 rounded-xl border-2 bg-white/50 dark:bg-slate-800/50" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel className="text-xs font-bold">Password</FormLabel>
                        <Link href="/forgot-password" size="sm" className="text-xs text-blue-600 font-bold">Forgot?</Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          <Input type={showPassword ? "text" : "password"} className="pl-10 h-12 rounded-xl border-2 bg-white/50 dark:bg-slate-800/50" {...field} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-[1.01] transition-all">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : `Log In to ${currentRole.label}`}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  New to Qlinic? <Link href={`/sign-up?role=${roleFromUrl}`} className="text-blue-600 font-bold hover:underline">Create Account</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}