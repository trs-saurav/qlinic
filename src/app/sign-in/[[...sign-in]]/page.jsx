// app/sign-up/[[...sign-up]]/page.jsx
'use client'
import { SignUp } from '@clerk/nextjs'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Stethoscope, 
  Building2, 
  Shield,
  ArrowRight,
  Heart,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState(null)

  const roles = [
    {
      value: 'patient',
      label: 'Patient',
      icon: Users,
      description: 'Book appointments and manage health',
      color: 'from-blue-500 to-blue-600'
    },
    {
      value: 'doctor',
      label: 'Doctor',
      icon: Stethoscope,
      description: 'Manage patients and appointments',
      color: 'from-green-500 to-green-600'
    },
    {
      value: 'hospital_admin',
      label: 'Hospital Admin',
      icon: Building2,
      description: 'Manage hospital operations',
      color: 'from-purple-500 to-purple-600'
    },
    {
      value: 'admin',
      label: 'Super Admin',
      icon: Shield,
      description: 'Platform administration',
      color: 'from-red-500 to-red-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 gap-8 items-center"
        >
          
          {/* Left Side - Role Selection */}
          <div className="space-y-6">
            {/* Logo and Title */}
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-1">
                  QLINIC
                  <Sparkles className="w-5 h-5 text-violet-500" />
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your healthcare partner</p>
              </div>
            </Link>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create Account
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Select your role to get started
              </p>
            </div>

            {/* Role Selection Cards */}
            <div className="space-y-3">
              {roles.map((role) => {
                const IconComponent = role.icon
                const isSelected = selectedRole === role.value
                
                return (
                  <motion.button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {role.label}
                          </h3>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                            >
                              <ArrowRight className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {!selectedRole && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg"
              >
                <Shield className="w-4 h-4" />
                Please select your role to continue
              </motion.p>
            )}
          </div>

          {/* Right Side - Clerk Sign Up */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
          >
            {selectedRole ? (
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none bg-transparent",
                    headerTitle: "text-2xl font-bold",
                    headerSubtitle: "text-gray-600 dark:text-gray-400",
                    formButtonPrimary: 
                      "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-lg",
                    formFieldInput: 
                      "rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500",
                    footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                  }
                }}
                redirectUrl={`/${selectedRole}/dashboard`}
                afterSignUpUrl={`/${selectedRole}/dashboard`}
                signInUrl="/sign-in"
                unsafeMetadata={{
                  role: selectedRole
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Select Your Role
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-xs">
                  Choose your role from the options on the left to access the sign-up form
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
