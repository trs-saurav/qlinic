'use client'

import { signIn, useSession, getCsrfToken } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { 
  Users, 
  Stethoscope, 
  Building2,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Chrome,
  Check
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function SignInClient() {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  let roleFromUrl, redirectTo
  try {
    roleFromUrl = searchParams.get('role') || 'user'
    redirectTo = searchParams.get('redirect')
  } catch (error) {
    roleFromUrl = 'user'
    redirectTo = null
  }
  
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const roles = {
    user: {
      label: 'Patient',
      description: 'Book appointments, access records, and manage health',
      icon: Users,
      redirectUrl: '/user',
      features: ['Instant booking', 'Medical records', 'Family profiles']
    },
    doctor: {
      label: 'Doctor',
      description: 'Manage consultations, patients, and your practice',
      icon: Stethoscope,
      redirectUrl: '/doctor',
      features: ['Consultations', 'Patient history', 'Availability']
    },
    hospital_admin: {
      label: 'Hospital Admin',
      description: 'Control operations, staff, and performance',
      icon: Building2,
      redirectUrl: '/hospital',
      features: ['Staff management', 'Analytics', 'Operations']
    },
    admin: {
      label: 'Admin',
      description: 'Full platform control and system management',
      icon: Shield,
      redirectUrl: '/admin',
      features: ['System control', 'User management', 'Analytics']
    }
  }

  const currentRole = roles[roleFromUrl] || roles.user
  const IconComponent = currentRole.icon

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const token = await getCsrfToken()
        console.log('✅ CSRF token loaded:', token ? 'present' : 'missing')
      } catch (error) {
        console.error('CSRF error:', error)
      }
    }
    fetchCsrfToken()
  }, [])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = session.user.role
      const roleRoutes = {
        user: '/user',
        doctor: '/doctor',
        hospital_admin: '/hospital',
        admin: '/admin',
        sub_admin: '/sub-admin'
      }
      
      const destination = redirectTo || roleRoutes[userRole] || '/user'
      const timer = setTimeout(() => {
        window.location.href = destination
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [status, session, redirectTo])

  const onSubmit = async (data) => {
    setLoading(true)
    const loadingToast = toast.loading('Signing in...')
    
    const currentOrigin = window.location.origin
    let targetUrl
    if (redirectTo) {
      targetUrl = redirectTo.startsWith('http') 
        ? redirectTo 
        : `${currentOrigin}${redirectTo}`
    } else {
      targetUrl = `${currentOrigin}${currentRole.redirectUrl}`
    }
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        role: roleFromUrl,
        redirect: false,
        callbackUrl: targetUrl
      })

      toast.dismiss(loadingToast)
      
      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          toast.error('Invalid email, password, or you are trying to sign in with the wrong role')
        } else if (result.error === 'MissingCSRF') {
          toast.loading('Refreshing security token...', { id: 'csrf-refresh' })
          const newToken = await getCsrfToken()
          toast.dismiss('csrf-refresh')
          
          if (newToken) {
            const retryResult = await signIn('credentials', {
              email: data.email,
              password: data.password,
              role: roleFromUrl,
              redirect: false,
              callbackUrl: targetUrl
            })
            
            if (retryResult?.error) {
              toast.error(retryResult.error === 'CredentialsSignin' 
                ? 'Invalid email, password, or wrong role' 
                : retryResult.error)
              setLoading(false)
              return
            }
            
            if (retryResult?.ok) {
              toast.success('Signed in successfully!')
              return
            }
          } else {
            toast.error('Could not refresh security token. Please refresh the page and try again.')
            setLoading(false)
            return
          }
        } else {
          toast.error(result.error)
        }
        setLoading(false)
        return
      }
      
      if (result?.ok) {
        toast.success('Signed in successfully!')
      } else {
        toast.error('Sign in failed. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('❌ Exception during sign-in:', err)
      toast.dismiss(loadingToast)
      toast.error('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider) => {
    setSocialLoading(provider);
    
    const roleToPass = roleFromUrl || 'user';
    document.cookie = `oauth_role=${roleToPass}; path=/; max-age=300; SameSite=Lax;`;

    await signIn(provider, { 
      callbackUrl: redirectTo || '/', 
      redirect: true 
    });
  }

  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#020617]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#020617]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen    overflow-hidden relative bg-[#F8FAFC] dark:bg-[#020617] flex self-center items-center  justify-center lg:pt-20">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-[100px]"
        />
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-5xl h-full max-h-[90vh] overflow-y-auto"
      >
        {/* Glassmorphism Card */}
        <div className="border-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden">
          {/* Gradient Top Border - Single Blue */}
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
          
          {/* Logo Section */}
          <div className="flex justify-center pt-6 pb-4 px-4 md:px-6">
            <Link href="/" className="inline-flex items-center gap-2 md:gap-3 group">
              <div className="relative w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg">
                <Image 
                  src="/logo.png" 
                  alt="Qlinic" 
                  width={40} 
                  height={40}
                  className="w-6 h-6 md:w-8 md:h-8"
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Qlinic
                </h1>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                  Healthcare made simple
                </p>
              </div>
            </Link>
          </div>

          {/* Main Content - Two Columns */}
          <div className="grid lg:grid-cols-2 gap-0 px-4 md:px-6 pb-6 items-center">
            
            {/* Left Side - Portal Details */}
            <div className="hidden lg:flex flex-col justify-center pr-6 border-r border-slate-200/50 dark:border-slate-700/50">
              <div className="space-y-5">
                {/* Role Header */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <IconComponent className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      {currentRole.label}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Portal Access</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentRole.description}
                </p>

                {/* Features */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Key Features
                  </p>
                  {currentRole.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex items-center gap-2.5"
                    >
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Change Role Link */}
                <div className="pt-3">
                  <Link 
                    href="/"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    Not a {currentRole.label.toLowerCase()}? Select different role →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Side - Sign In Form */}
            <div className="flex flex-col justify-center lg:pl-6 w-full">
              {/* Mobile Role Badge */}
              <div className="lg:hidden mb-4 flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <IconComponent className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {currentRole.label} Portal
                  </span>
                </div>
              </div>

              <div className="space-y-4 w-full">
                {/* Header */}
                <div className="text-center lg:text-left">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Welcome back
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Sign in to your dashboard
                  </p>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin('google')}
                    disabled={socialLoading !== null || loading}
                    className="h-10 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group bg-white/60 dark:bg-slate-800/60"
                  >
                    {socialLoading === 'google' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Chrome className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin('facebook')}
                    disabled={socialLoading !== null || loading}
                    className="h-10 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group bg-white/60 dark:bg-slate-800/60"
                  >
                    {socialLoading === 'facebook' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 text-[#1877F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 3.667h-3.533v7.98H9.101z"/>
                      </svg>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin('apple')}
                    disabled={socialLoading !== null || loading}
                    className="h-10 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group bg-white/60 dark:bg-slate-800/60"
                  >
                    {socialLoading === 'apple' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 text-slate-800 dark:text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                    )}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="bg-slate-300 dark:bg-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-[10px] md:text-xs font-medium">
                    <span className="bg-white/40 dark:bg-slate-900/40 px-3 text-slate-500 dark:text-slate-400 backdrop-blur-xl">
                      Or with email
                    </span>
                  </div>
                </div>

                {/* Email Form */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Email
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                              <Input
                                type="email"
                                placeholder="name@example.com"
                                className="pl-9 h-10 text-sm border-2 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl bg-white/50 dark:bg-slate-800/50"
                                disabled={loading}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-1">
                            <FormLabel className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Password
                            </FormLabel>
                            <Link
                              href="/forgot-password"
                              className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Forgot?
                            </Link>
                          </div>
                          <FormControl>
                            <div className="relative group">
                              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••••"
                                className="pl-9 pr-9 h-10 text-sm border-2 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl bg-white/50 dark:bg-slate-800/50"
                                disabled={loading}
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                disabled={loading}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={loading || socialLoading !== null}
                      className="w-full h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all rounded-xl relative overflow-hidden group text-sm"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin relative z-10" />
                          <span className="relative z-10">Signing in...</span>
                        </>
                      ) : (
                        <span className="relative z-10">Sign In</span>
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Sign Up Link */}
                <div className="text-center pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                    Don't have an account?{' '}
                    <Link 
                      href={`/sign-up?role=${roleFromUrl}`}
                      className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Create account →
                    </Link>
                  </p>
                </div>

                {/* Mobile - Change Role Link */}
                <div className="lg:hidden text-center">
                  <Link 
                    href="/"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Not a {currentRole.label.toLowerCase()}? Select different role →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
