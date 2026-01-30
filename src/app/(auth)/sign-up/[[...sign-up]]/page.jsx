'use client'

import React, { useState } from 'react'
import { signIn, getCsrfToken } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Stethoscope, Building2, Loader2, Eye, EyeOff, ArrowLeft,
  Calendar, FileText, UserPlus, Hospital, ClipboardList, BarChart3, ChevronRight, Chrome
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'

const signUpSchema = z.object({
  firstName: z.string().min(2, 'Min 2 chars'),
  lastName: z.string().min(2, 'Min 2 chars'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars')
    .regex(/[A-Z]/, '1 Uppercase')
    .regex(/[a-z]/, '1 Lowercase')
    .regex(/[0-9]/, '1 Number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const roles = [
  {
    value: 'user',
    label: 'Patient',
    description: 'Book appointments & manage health',
    icon: Users,
    features: [{ icon: Calendar, text: 'Instant booking' }, { icon: FileText, text: 'Digital records' }, { icon: UserPlus, text: 'Family profiles' }]
  },
  {
    value: 'doctor',
    label: 'Doctor',
    description: 'Manage consultations & care',
    icon: Stethoscope,
    features: [{ icon: ClipboardList, text: 'Smart scheduling' }, { icon: FileText, text: 'Patient history' }, { icon: Hospital, text: 'Multi-hospital' }]
  },
  {
    value: 'hospital_admin',
    label: 'Hospital',
    description: 'Manage operations & staff',
    icon: Building2,
    features: [{ icon: Users, text: 'Staff management' }, { icon: Calendar, text: 'Oversight' }, { icon: BarChart3, text: 'Analytics' }]
  },
]

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    const loadingToast = toast.loading('Creating your account...')
    try {
      console.log('[SIGNUP] Creating account for:', data.email, 'with role:', selectedRole)
      
      const createRes = await fetch('/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          role: selectedRole,
          profileData: {},
        }),
      })

      if (!createRes.ok) {
        const errorData = await createRes.json().catch(() => ({ error: 'Creation failed' }))
        console.error('[SIGNUP] Account creation failed:', errorData)
        throw new Error(errorData.error || `Account creation failed`)
      }
      
      const createData = await createRes.json()
      console.log('[SIGNUP] Account created successfully:', { id: createData.user?.id, email: createData.user?.email })
      
      toast.dismiss(loadingToast)
      toast.success('Account created! Signing you in...')
      
      console.log('[SIGNUP] Attempting sign-in with credentials:', { email: data.email, role: selectedRole })
      
      // ✅ FIX: Wrap signIn call to handle URL construction errors with fallback
      let signInResult
      let usedFallback = false
      try {
        signInResult = await signIn('credentials', {
          email: data.email,
          password: data.password,
          role: selectedRole,
          redirect: false,
        })
      } catch (urlError) {
        // If URL construction fails, use direct API call as fallback
        if (urlError.message?.includes('Invalid URL') || urlError.message?.includes('Failed to construct')) {
          console.warn('[SIGNUP] URL construction error, using fallback API method:', urlError.message)
          
          try {
            // Get CSRF token
            const csrfToken = await getCsrfToken()
            if (!csrfToken) {
              throw new Error('Could not get CSRF token')
            }

            // Use window.location.origin as base URL
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
            
            // Make direct fetch to credentials callback
            const response = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                email: data.email,
                password: data.password,
                role: selectedRole || '',
                csrfToken: csrfToken,
                redirect: 'false',
                json: 'true'
              })
            })

            let responseData
            try {
              responseData = await response.json()
            } catch (e) {
              // If response is not JSON, check status
              if (response.ok) {
                // Success - redirect will be handled by NextAuth
                signInResult = { ok: true }
              } else {
                responseData = { error: 'Sign-in failed' }
              }
            }
            
            if (responseData?.error) {
              signInResult = { error: responseData.error, ok: false }
            } else if (response.ok) {
              // Success - session should be set via cookies
              signInResult = { ok: true }
              usedFallback = true
              // Mark that we used fallback so we can redirect immediately
            } else {
              signInResult = { error: 'Sign-in failed', ok: false }
            }
          } catch (fallbackError) {
            console.error('[SIGNUP] Fallback sign-in also failed:', fallbackError)
            toast.dismiss(loadingToast)
            toast.success('Account created successfully! Redirecting to sign in...')
            setLoading(false)
            // Redirect to sign-in page with success message
            setTimeout(() => {
              router.push('/sign-in?message=account-created')
            }, 1500)
            return
          }
        } else {
          throw urlError
        }
      }

      console.log('[SIGNUP] Sign-in result:', signInResult)

      if (signInResult?.error) {
        console.error('[SIGNUP] Sign-in error:', signInResult.error)
        throw new Error(signInResult.error || 'Sign-in failed after account creation')
      }

      if (!signInResult?.ok) {
        console.error('[SIGNUP] Sign-in not ok:', signInResult)
        throw new Error('Sign-in failed. Please try signing in manually.')
      }

      console.log('[SIGNUP] Sign-in successful, redirecting to subdomain...')
      toast.dismiss(loadingToast)
      toast.success('Account created! Redirecting to sign in...')
      setLoading(false)
      
      // ✅ FIX: Redirect to subdomain sign-in page so session cookie is set for the correct domain
      // The session cookie from main domain won't work on subdomain, so we need to sign in on subdomain
      const roleToSubdomain = {
        user: 'user',
        doctor: 'doctor',
        hospital_admin: 'hospital',
        admin: 'admin'
      }
      
      const subdomain = roleToSubdomain[selectedRole] || 'user'
      const isDevelopment = typeof window !== 'undefined' && window.location.hostname.includes('localhost')
      const mainDomain = isDevelopment ? 'localhost' : (process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'qlinichealth.com')
      const port = isDevelopment ? ':3000' : ''
      const protocol = isDevelopment ? 'http' : 'https'
      
      // Redirect to subdomain sign-in page with email pre-filled for better UX
      // User will need to sign in on the subdomain to get the session cookie for that domain
      const subdomainSignInUrl = `${protocol}://${subdomain}.${mainDomain}${port}/sign-in?email=${encodeURIComponent(data.email)}&role=${selectedRole}&fromSignup=true`
      
      setTimeout(() => {
        window.location.href = subdomainSignInUrl
      }, 500)
      return

    } catch (err) {
      console.error('[SIGNUP] Error:', err)
      toast.dismiss(loadingToast)
      toast.error(err.message || 'An error occurred during sign-up')
      setLoading(false)
    }
  }

  const handleSocialSignUp = async (provider) => {
    setSocialLoading(provider)
    const roleToPass = selectedRole || 'user';
    
    try {
      // ✅ FIXED: Store role on server-side before OAuth redirect
      // This ensures new OAuth users get the correct role assigned
      const tempEmail = `temp-${roleToPass}-${Date.now()}`;
      await fetch('/api/auth/set-oauth-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: tempEmail,
          role: roleToPass 
        })
      }).catch(e => console.error('[OAuth Role Store] Error:', e));

      // Also set client-side cookie as backup
      document.cookie = `oauth_role=${roleToPass}; path=/; max-age=300; SameSite=Lax;`;
      
      await signIn(provider, { 
        redirect: true
      });
    } catch (error) {
      console.error('[handleSocialSignUp] Error:', error)
      toast.error('Failed to initiate social sign-up')
      setSocialLoading(null)
    }
  }

  const selectedRoleObj = roles.find((r) => r.value === selectedRole)

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.1, 1], x: [0, 50, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-[100px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center h-full justify-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-4 md:mb-8 shrink-0">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <Image src="/logo.png" alt="Qlinic" width={32} height={32} className="w-8 h-8 md:w-10 md:h-10 drop-shadow-sm" />
            <span className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Qlinic</span>
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedRole ? (
            <motion.div key="role-selection" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="w-full max-w-4xl">
              <div className="text-center mb-4 md:mb-8"><p className="text-xs md:text-base text-slate-500 dark:text-slate-400">Select your role</p></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
                {roles.map((role, index) => {
                  const RoleIcon = role.icon
                  return (
                    <motion.button key={role.value} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -4 }} onClick={() => setSelectedRole(role.value)} className="group relative w-full text-left">
                      <Card className="h-full border-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-sm hover:shadow-md transition-all rounded-2xl md:rounded-4xl ring-1 ring-white/50 dark:ring-white/10">
                        <CardContent className="p-4 md:p-6 flex items-center md:flex-col md:items-start h-full gap-4 md:gap-0">
                          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center md:mb-4 shrink-0 group-hover:bg-blue-100 transition-colors">
                            <RoleIcon className="w-5 h-5 md:w-7 md:h-7 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">{role.label}</h3>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 md:mb-4 truncate md:whitespace-normal">{role.description}</p>
                            <div className="hidden md:block space-y-2 mt-auto">
                              {role.features.map((f, i) => (<div key={i} className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400" /><span className="text-xs text-slate-600 dark:text-slate-300">{f.text}</span></div>))}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 md:hidden" />
                        </CardContent>
                      </Card>
                    </motion.button>
                  )
                })}
              </div>
              <div className="text-center mt-6"><Link href="/sign-in" className="text-xs md:text-sm text-slate-500 hover:text-blue-600 font-medium">Already have an account? <span className="underline">Sign in</span></Link></div>
            </motion.div>
          ) : (
            <motion.div key="signup-form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="w-full max-w-sm">
              <button onClick={() => setSelectedRole(null)} className="flex items-center text-xs md:text-sm font-medium text-slate-500 hover:text-slate-800 mb-3 md:mb-5 pl-1"><ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />Back to roles</button>
              <Card className="border-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-sm rounded-4xl ring-1 ring-white/50 dark:ring-white/10">
                <CardContent className="p-5 md:p-8">
                  <div className="text-center mb-5 md:mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-2"><selectedRoleObj.icon className="w-3 h-3 md:w-4 md:h-4 text-blue-600" /><span className="text-xs font-bold text-blue-700 dark:text-blue-300">{selectedRoleObj.label}</span></div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">Create Account</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-5 md:mb-6">
                    {['google', 'facebook', 'apple'].map((provider) => (
                      <button key={provider} type="button" onClick={() => handleSocialSignUp(provider)} className="flex items-center justify-center h-9 md:h-10 rounded-xl bg-white/60 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-white/80 transition-all">
                        {socialLoading === provider ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                          provider === 'google' ? <Chrome className="w-4 h-4 text-slate-700 dark:text-slate-200" /> :
                          provider === 'facebook' ? <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 3.667h-3.533v7.98H9.101z"/></svg> :
                          <svg className="w-4 h-4 text-slate-800 dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>}
                      </button>
                    ))}
                  </div>
                  <div className="relative mb-5 md:mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/50"></div></div><div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-transparent px-2 text-slate-400">Or email</span></div></div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormControl><Input placeholder="First Name" className="h-10 md:h-11 rounded-xl bg-white/50 border-0 ring-1 ring-slate-200 px-3 text-sm" {...field} /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormControl><Input placeholder="Last Name" className="h-10 md:h-11 rounded-xl bg-white/50 border-0 ring-1 ring-slate-200 px-3 text-sm" {...field} /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormControl><Input type="email" placeholder="Email Address" className="h-10 md:h-11 rounded-xl bg-white/50 border-0 ring-1 ring-slate-200 px-3 text-sm" {...field} /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                      <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormControl><div className="relative"><Input type={showPassword ? 'text' : 'password'} placeholder="Password" className="h-10 md:h-11 rounded-xl bg-white/50 border-0 ring-1 ring-slate-200 px-3 pr-9 text-sm" {...field} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                      <FormField control={form.control} name="confirmPassword" render={({ field }) => (<FormItem><FormControl><div className="relative"><Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" className="h-10 md:h-11 rounded-xl bg-white/50 border-0 ring-1 ring-slate-200 px-3 pr-9 text-sm" {...field} /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-slate-400">{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                      <Button type="submit" disabled={loading} className="w-full h-10 md:h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-2 shadow-lg shadow-blue-500/20">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              <div className="text-center mt-4"><p className="text-[10px] text-slate-500">By joining, you agree to our <span className="underline cursor-pointer">Terms</span> & <span className="underline cursor-pointer">Privacy</span></p></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}