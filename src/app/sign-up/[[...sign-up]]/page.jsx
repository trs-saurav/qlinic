'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { 
  Users, 
  Stethoscope, 
  Building2, 
  Sparkles, 
  Check,
  Loader2,
  Mail,
  Lock,
  UserCircle,
  Chrome,
  Eye,
  EyeOff,
  Shield,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// Form validation schema
const signUpSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const roles = [
  {
    value: 'patient',
    label: 'Patient',
    description: 'Book appointments & manage health',
    icon: Users,
    gradient: 'from-blue-500 via-blue-600 to-violet-600',
    features: ['Instant booking', 'Medical records', 'Family profiles'],
    bgGradient: 'from-blue-500/20 via-violet-500/20 to-purple-500/20'
  },
  {
    value: 'doctor',
    label: 'Doctor',
    description: 'Manage patients & appointments',
    icon: Stethoscope,
    gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
    features: ['Consultations', 'Patient history', 'Availability'],
    bgGradient: 'from-emerald-500/20 via-teal-500/20 to-green-500/20'
  },
  {
    value: 'hospital_admin',
    label: 'Hospital Admin',
    description: 'Manage hospital operations',
    icon: Building2,
    gradient: 'from-purple-500 via-purple-600 to-pink-600',
    features: ['Staff management', 'Analytics', 'Operations'],
    bgGradient: 'from-purple-500/20 via-pink-500/20 to-rose-500/20'
  },
]

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState('patient')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    const loadingToast = toast.loading('Creating your account...')

    try {
      // Check if user exists
      const checkRes = await fetch('/api/user/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      const checkData = await checkRes.json()
      if (checkData.exists) {
        toast.dismiss(loadingToast)
        toast.error('An account with this email already exists')
        setLoading(false)
        return
      }

      // Create user
      const res = await fetch('/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          role: selectedRole,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create account')
      }

      toast.dismiss(loadingToast)
      toast.success('Account created! Signing you in...', { icon: '🎉' })

      // Auto sign-in
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        const roleRoutes = {
          patient: '/patient',
          doctor: '/doctor',
          hospital_admin: '/hospital-admin',
        }
        window.location.href = roleRoutes[selectedRole]
      } else {
        toast.error('Account created, but login failed. Please sign in.')
        setTimeout(() => router.push('/sign-in'), 2000)
      }
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error(err.message)
      setLoading(false)
    }
  }

  const handleSocialSignUp = async (provider) => {
    setSocialLoading(provider)
    const providerNames = { google: 'Google', facebook: 'Facebook', apple: 'Apple' }
    toast.loading(`Connecting to ${providerNames[provider]}...`, { id: 'social-signup' })
    
    await signIn(provider, { 
      callbackUrl: `/patient`,
      redirect: true 
    })
  }

  const selectedRoleObj = roles.find((r) => r.value === selectedRole)
  const IconComponent = selectedRoleObj?.icon || Users

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-gradient-to-br from-gray-50 via-blue-50 to-violet-50 dark:from-gray-950 dark:via-blue-950/30 dark:to-gray-900">
      
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br ${selectedRoleObj.bgGradient} rounded-full blur-3xl opacity-30`}
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-tr ${selectedRoleObj.bgGradient} rounded-full blur-3xl opacity-30`}
        />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-6xl">
          
          {/* Header with Logo - Compact */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6"
          >
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-3 justify-center">
                {/* Logo */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
                  <div className="relative w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-blue-100 dark:border-blue-900">
                    <Image 
                      src="/logo.png" 
                      alt="Qlinic" 
                      width={40} 
                      height={40}
                      className="w-8 h-8"
                    />
                  </div>
                </motion.div>
                
                {/* Brand Name */}
                <div className="text-left">
                  <h1 className="text-2xl md:text-3xl font-black flex items-center gap-1">
                    <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                      QLINIC
                    </span>
                    <Sparkles className="w-5 h-5 text-violet-500 group-hover:rotate-12 transition-transform" />
                  </h1>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3 text-blue-500" />
                    Healthcare made simple
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Two Column Grid Layout */}
          <div className="grid lg:grid-cols-2 gap-6 items-center">
            
            {/* Left Side - Role Selection */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden lg:block"
            >
              <Card className="border-0 backdrop-blur-2xl bg-white/60 dark:bg-gray-900/60 shadow-2xl overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${selectedRoleObj.gradient}`} />
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    Select Your Role
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Choose how you'll use QLINIC
                  </p>
                  
                  <div className="space-y-2">
                    {roles.map((role) => {
                      const RoleIcon = role.icon
                      const isSelected = selectedRole === role.value

                      return (
                        <motion.button
                          key={role.value}
                          onClick={() => setSelectedRole(role.value)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left relative ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/50 dark:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${role.gradient} shadow flex-shrink-0`}>
                              <RoleIcon className="w-5 h-5 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {role.label}
                                </h4>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                                  >
                                    <Check className="w-3 h-3 text-white" />
                                  </motion.div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {role.description}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Selected Features */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      What you get:
                    </p>
                    <div className="space-y-2">
                      {selectedRoleObj.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={`w-5 h-5 bg-gradient-to-br ${selectedRoleObj.gradient} rounded-md flex items-center justify-center flex-shrink-0`}>
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                          <span className="text-xs text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Side - Sign Up Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Mobile Role Badge */}
              <div className="lg:hidden mb-4 flex justify-center">
                <Badge 
                  className={`px-4 py-2 bg-gradient-to-r ${selectedRoleObj.gradient} text-white border-0 shadow-lg text-sm font-semibold`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {selectedRoleObj.label}
                </Badge>
              </div>

              {/* Glassmorphism Card */}
              <Card className="border-0 backdrop-blur-3xl bg-white/70 dark:bg-gray-900/70 shadow-2xl overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${selectedRoleObj.gradient}`} />
                
                <CardHeader className="space-y-1 pb-3 pt-5 px-6">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Create Account
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    Join thousands using QLINIC
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 px-6 pb-6">
                  
                  {/* Social Login */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialSignUp('google')}
                      disabled={socialLoading !== null || loading}
                      className="h-10 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group backdrop-blur-xl"
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
                      onClick={() => handleSocialSignUp('facebook')}
                      disabled={socialLoading !== null || loading}
                      className="h-10 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group backdrop-blur-xl"
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
                      onClick={() => handleSocialSignUp('apple')}
                      disabled={socialLoading !== null || loading}
                      className="h-10 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group backdrop-blur-xl"
                    >
                      {socialLoading === 'apple' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                      )}
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="bg-gray-300 dark:bg-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-[10px] font-medium">
                      <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                        Or with email
                      </span>
                    </div>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">First Name</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <UserCircle className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                                  <Input
                                    placeholder="John"
                                    className="pl-9 h-10 text-sm border-2 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg backdrop-blur-xl bg-white/50 dark:bg-gray-800/50"
                                    disabled={loading}
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">Last Name</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <UserCircle className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                                  <Input
                                    placeholder="Doe"
                                    className="pl-9 h-10 text-sm border-2 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg backdrop-blur-xl bg-white/50 dark:bg-gray-800/50"
                                    disabled={loading}
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">Email</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                                <Input
                                  type="email"
                                  placeholder="name@example.com"
                                  className="pl-9 h-10 text-sm border-2 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg backdrop-blur-xl bg-white/50 dark:bg-gray-800/50"
                                  disabled={loading}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                                <Input
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="••••••••••"
                                  className="pl-9 pr-9 h-10 text-sm border-2 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg backdrop-blur-xl bg-white/50 dark:bg-gray-800/50"
                                  disabled={loading}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  disabled={loading}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px]">
                              Min. 8 chars with uppercase, lowercase & number
                            </FormDescription>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                                <Input
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  placeholder="••••••••••"
                                  className="pl-9 pr-9 h-10 text-sm border-2 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg backdrop-blur-xl bg-white/50 dark:bg-gray-800/50"
                                  disabled={loading}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  disabled={loading}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={loading || socialLoading !== null}
                        className={`w-full h-11 bg-gradient-to-r ${selectedRoleObj.gradient} hover:opacity-90 text-white font-bold shadow-xl hover:shadow-2xl transition-all text-sm rounded-lg relative overflow-hidden group mt-4`}
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin relative z-10" />
                            <span className="relative z-10">Creating...</span>
                          </>
                        ) : (
                          <span className="relative z-10 flex items-center gap-2 justify-center">
                            Create Account
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-center text-xs text-gray-600 dark:text-gray-400">
                      Already have an account?{' '}
                      <Link 
                        href="/sign-in" 
                        className={`font-bold bg-gradient-to-r ${selectedRoleObj.gradient} bg-clip-text text-transparent hover:underline`}
                      >
                        Sign in →
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Terms - Mobile */}
              <p className="text-[10px] text-center text-gray-500 dark:text-gray-400 mt-3">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                  Privacy Policy
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
