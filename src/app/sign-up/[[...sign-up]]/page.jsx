'use client'
import { SignUp, useUser } from '@clerk/nextjs'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Stethoscope, 
  Building2, 
  Shield,
  Heart,
  Sparkles,
  ArrowLeft,
  Check
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState('patient')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const containerRef = useRef(null)

  // Mouse movement gradient effect
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

  // Save user to MongoDB after sign-up
  useEffect(() => {
    async function saveUser() {
      if (isSignedIn && user && selectedRole) {
        try {
          console.log('💾 Saving user to MongoDB...')
          
          const response = await fetch('/api/user/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: selectedRole }),
          })

          const data = await response.json()
          
          if (data.success) {
            console.log('✅ User saved successfully')
            router.push(`/${selectedRole}`)
          }
        } catch (error) {
          console.error('❌ Error saving user:', error)
        }
      }
    }

    saveUser()
  }, [isSignedIn, user, selectedRole, router])

  const roles = [
    {
      value: 'patient',
      label: 'Patient',
      description: 'Book appointments & consultations',
      icon: Users,
      gradient: 'from-blue-500 to-violet-600'
    },
    {
      value: 'doctor',
      label: 'Doctor',
      description: 'Manage appointments & patients',
      icon: Stethoscope,
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      value: 'hospital_admin',
      label: 'Hospital',
      description: 'Manage hospital operations',
      icon: Building2,
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'Platform administration',
      icon: Shield,
      gradient: 'from-red-500 to-orange-600'
    }
  ]

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
        <div className="w-full max-w-6xl">
          
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
            
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3"
            >
              Create Your Account
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-gray-600 dark:text-gray-400"
            >
              Select your role to get started
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            
            {/* Left Side - Role Selection */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="sticky top-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Choose Your Role
                </h3>
                
                <div className="space-y-4">
                  {roles.map((role, index) => {
                    const IconComponent = role.icon
                    const isSelected = selectedRole === role.value
                    
                    return (
                      <motion.button
                        key={role.value}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        onClick={() => setSelectedRole(role.value)}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-xl shadow-blue-500/20' 
                            : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        {/* Selection indicator */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                            >
                              <Check className="w-5 h-5 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${role.gradient} shadow-lg flex-shrink-0`}>
                            <IconComponent className="w-7 h-7 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {role.label}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {role.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Selected role badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 border border-blue-200 dark:border-blue-800"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    You're signing up as:
                  </p>
                  <div className="flex items-center gap-2">
                    {React.createElement(roles.find(r => r.value === selectedRole)?.icon, { 
                      className: "w-5 h-5 text-blue-600 dark:text-blue-400" 
                    })}
                    <span className="font-bold text-gray-900 dark:text-white">
                      {roles.find(r => r.value === selectedRole)?.label}
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Side - Sign Up Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50"
            >
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none bg-transparent",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    formButtonPrimary: 
                      "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-xl py-3.5 shadow-lg hover:shadow-xl transition-all duration-200",
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
                    footerAction: "text-center",
                    identityPreviewEditButton: "text-blue-600 hover:text-blue-700 dark:text-blue-400",
                  }
                }}
                signInUrl="/sign-in"
                unsafeMetadata={{
                  role: selectedRole
                }}
              />
            </motion.div>
          </div>

          {/* Footer */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8"
          >
            Already have an account?{' '}
            <Link 
              href="/sign-in" 
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
            >
              Sign in here
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  )
}
