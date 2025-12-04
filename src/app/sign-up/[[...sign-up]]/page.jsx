// app/sign-up/[[...sign-up]]/page.jsx
'use client'
import { SignUp } from '@clerk/nextjs'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Stethoscope, 
  Building2, 
  Shield,
  ArrowRight,
  Heart,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState(null)
  const [showSignUp, setShowSignUp] = useState(false)

  const roles = [
    {
      value: 'patient',
      label: 'Patient',
      icon: Users,
      description: 'Book appointments and manage your health',
      features: ['Book Appointments', 'View Medical History', 'Find Doctors', 'Health Records'],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      value: 'doctor',
      label: 'Doctor',
      icon: Stethoscope,
      description: 'Manage patients and appointments',
      features: ['Manage Appointments', 'Patient Records', 'Prescriptions', 'Schedule Management'],
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-500',
      iconBg: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      value: 'hospital_admin',
      label: 'Hospital Admin',
      icon: Building2,
      description: 'Manage hospital operations and staff',
      features: ['Manage Doctors', 'Hospital Settings', 'Patient Management', 'Analytics'],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      value: 'admin',
      label: 'Super Admin',
      icon: Shield,
      description: 'Full platform administration access',
      features: ['All Access', 'System Settings', 'User Management', 'Platform Analytics'],
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-500',
      iconBg: 'bg-red-100 dark:bg-red-900/30'
    }
  ]

  const handleRoleSelect = (roleValue) => {
    setSelectedRole(roleValue)
  }

  const handleContinue = () => {
    if (selectedRole) {
      setShowSignUp(true)
    }
  }

  const handleBack = () => {
    setShowSignUp(false)
  }

  const selectedRoleData = roles.find(r => r.value === selectedRole)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative w-full max-w-6xl">
        
        <AnimatePresence mode="wait">
          {!showSignUp ? (
            // Step 1: Role Selection
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-1">
                      QLINIC
                      <Sparkles className="w-5 h-5 text-violet-500" />
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Your healthcare partner</p>
                  </div>
                </Link>

                <div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                    Join QLINIC Today
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Select your role to get started with personalized healthcare management
                  </p>
                </div>
              </div>

              {/* Role Selection Grid */}
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {roles.map((role, index) => {
                  const IconComponent = role.icon
                  const isSelected = selectedRole === role.value
                  
                  return (
                    <motion.button
                      key={role.value}
                      onClick={() => handleRoleSelect(role.value)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                        isSelected
                          ? `${role.borderColor} ${role.bgColor} shadow-xl`
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {/* Background gradient on hover */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 ${isSelected ? 'opacity-10' : ''}`}
                        whileHover={{ opacity: 0.05 }}
                      />

                      <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg`}>
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              className={`w-8 h-8 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg`}
                            >
                              <CheckCircle className="w-5 h-5 text-white" />
                            </motion.div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div className="mb-4">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {role.label}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {role.description}
                          </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-2">
                          {role.features.map((feature, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 + i * 0.05 }}
                              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${role.color}`} />
                              {feature}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Warning message if no role selected */}
              <AnimatePresence>
                {!selectedRole && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-md mx-auto"
                  >
                    <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                        Please select your role to continue with sign up
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Continue Button */}
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  onClick={handleContinue}
                  disabled={!selectedRole}
                  whileHover={selectedRole ? { scale: 1.05 } : {}}
                  whileTap={selectedRole ? { scale: 0.95 } : {}}
                  className={`px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 shadow-lg transition-all duration-300 ${
                    selectedRole
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white cursor-pointer'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue as {selectedRoleData?.label || 'Guest'}
                  <ArrowRight className="w-5 h-5" />
                </motion.button>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            // Step 2: Clerk Sign Up Form
            <motion.div
              key="signup-form"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.5 }}
              className="grid md:grid-cols-2 gap-8 items-center"
            >
              {/* Left Side - Selected Role Info */}
              <div className="space-y-6">
                <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
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
                    Create Your Account
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Join as a {selectedRoleData?.label}
                  </p>
                </div>

                {/* Selected Role Card */}
                {selectedRoleData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-2xl border-2 ${selectedRoleData.borderColor} ${selectedRoleData.bgColor} shadow-lg`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedRoleData.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <selectedRoleData.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {selectedRoleData.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedRoleData.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        What you'll get:
                      </p>
                      {selectedRoleData.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Change role
                </button>
              </div>

              {/* Right Side - Clerk Sign Up Component */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-h-[600px] overflow-y-auto"
              >
                <SignUp
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none bg-transparent",
                      headerTitle: "text-2xl font-bold text-gray-900 dark:text-white",
                      headerSubtitle: "text-gray-600 dark:text-gray-400",
                      formButtonPrimary: 
                        "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-lg py-3 transition-all duration-200",
                      formFieldInput: 
                        "rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 px-4 py-3 transition-all duration-200",
                      formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
                      footerActionLink: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium",
                      identityPreviewText: "text-gray-700 dark:text-gray-300",
                      identityPreviewEditButton: "text-blue-600 hover:text-blue-700",
                      formResendCodeLink: "text-blue-600 hover:text-blue-700",
                      otpCodeFieldInput: "border-2 border-gray-300 dark:border-gray-600 rounded-lg",
                    }
                  }}
                  forceRedirectUrl={`/${selectedRole}`}
                  fallbackRedirectUrl={`/${selectedRole}`}
                  signInUrl="/sign-in"
                  unsafeMetadata={{
                    role: selectedRole
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
