// app/sign-in/[[...sign-in]]/page.jsx
'use client'
import { SignIn } from '@clerk/nextjs'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users, 
  Stethoscope, 
  Building2,
  Heart,
  Sparkles,
  ArrowLeft,
  Shield
} from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const roleFromUrl = searchParams.get('role') || 'patient'
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  // Store role in localStorage for OAuth callback
  useEffect(() => {
    if (roleFromUrl) {
      localStorage.setItem('pendingRole', roleFromUrl)
      console.log('💾 Stored role in localStorage:', roleFromUrl)
    }
  }, [roleFromUrl])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const roles = {
    patient: {
      label: 'Patient',
      description: 'Access your health records and appointments',
      icon: Users,
      gradient: 'from-blue-500 to-violet-600',
      redirectUrl: '/patient'
    },
    doctor: {
      label: 'Doctor',
      description: 'Manage your patients and appointments',
      icon: Stethoscope,
      gradient: 'from-emerald-500 to-teal-600',
      redirectUrl: '/doctor'
    },
    hospital_admin: {
      label: 'Hospital Admin',
      description: 'Manage hospital operations and staff',
      icon: Building2,
      gradient: 'from-purple-500 to-pink-600',
      redirectUrl: '/hospital-admin'
    },
    admin: {
      label: 'Admin',
      description: 'MAIN ADMIN ACCESS TO ALL FEATURES',
      icon: Shield,
      gradient: 'from-red-500 to-orange-600',
      redirectUrl: '/admin'
    }
  }

  const currentRole = roles[roleFromUrl] || roles.patient
  const IconComponent = currentRole.icon

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-slate-900"
    >
      {/* Animated gradient following mouse */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-20"
        animate={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
        }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-8 left-8 z-20"
      >
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
              >
                <Heart className="w-9 h-9 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                  QLINIC
                  <Sparkles className="w-5 h-5 text-violet-500 group-hover:rotate-12 transition-transform" />
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your healthcare partner</p>
              </div>
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            
            {/* Left Side - Role Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className={`inline-flex items-center gap-3 p-6 rounded-2xl bg-gradient-to-br ${currentRole.gradient} shadow-xl mb-6`}
                >
                  <IconComponent className="w-12 h-12 text-white" strokeWidth={2} />
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {currentRole.label} Portal
                    </h2>
                    <p className="text-white/90 text-sm">
                      Sign in to continue
                    </p>
                  </div>
                </motion.div>

                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
                >
                  Welcome Back!
                </motion.h3>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg text-gray-600 dark:text-gray-400 mb-6"
                >
                  {currentRole.description}
                </motion.p>
              </div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Secure & Private
                </h4>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${currentRole.gradient} mt-2`}></div>
                    <span>End-to-end encrypted data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${currentRole.gradient} mt-2`}></div>
                    <span>HIPAA compliant platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${currentRole.gradient} mt-2`}></div>
                    <span>24/7 technical support</span>
                  </li>
                </ul>
              </motion.div>

              {/* Switch role link */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Not a {currentRole.label.toLowerCase()}?{' '}
                <Link 
                  href="/"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                >
                  Go back and select your role
                </Link>
              </motion.p>
            </motion.div>

            {/* Right Side - Sign In Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50"
            >
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none bg-transparent",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    formButtonPrimary: 
                      `bg-gradient-to-r ${currentRole.gradient} hover:opacity-90 text-white font-semibold rounded-xl py-3.5 shadow-lg hover:shadow-xl transition-all duration-200`,
                    formFieldInput: 
                      "rounded-xl border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 px-4 py-3 transition-colors duration-200",
                    formFieldLabel: "text-gray-700 dark:text-gray-300 font-semibold mb-2",
                    footerActionLink: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold",
                    socialButtonsBlockButton: 
                      "border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200",
                    socialButtonsBlockButtonText: "font-semibold",
                    dividerLine: "bg-gray-300 dark:bg-gray-600",
                    dividerText: "text-gray-500 dark:text-gray-400",
                    formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                    footerAction: "hidden",
                    identityPreviewEditButton: "text-blue-600 hover:text-blue-700 dark:text-blue-400",
                  }
                }}
                signUpUrl="/sign-up"
                // ✅ FIXED: Redirect through callback to assign role
                redirectUrl={`/auth/callback?role=${roleFromUrl}`}
                afterSignInUrl={`/auth/callback?role=${roleFromUrl}`}
              />
              
              {/* Custom Sign Up Link */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link 
                    href="/sign-up" 
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors inline-flex items-center gap-1 group"
                  >
                    Sign up here
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
