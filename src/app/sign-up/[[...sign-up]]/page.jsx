// app/sign-up/[[...sign-up]]/page.jsx
'use client'
import { SignUp, useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Stethoscope, 
  Building2, 
  Shield,
  Heart,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState('patient')
  const { isSignedIn, user } = useUser()
  const router = useRouter()

  // Save user to MongoDB after sign-up
  useEffect(() => {
    async function saveUser() {
      if (isSignedIn && user && selectedRole) {
        try {
          console.log('💾 Saving user to MongoDB...');
          
          const response = await fetch('/api/user/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: selectedRole }),
          });

          const data = await response.json();
          
          if (data.success) {
            console.log('✅ User saved successfully');
            // Redirect to role-specific page
            router.push(`/${selectedRole}`);
          }
        } catch (error) {
          console.error('❌ Error saving user:', error);
        }
      }
    }

    saveUser();
  }, [isSignedIn, user, selectedRole, router]);

  const roles = [
    {
      value: 'patient',
      label: 'Patient',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      value: 'doctor',
      label: 'Doctor',
      icon: Stethoscope,
      color: 'bg-green-500'
    },
    {
      value: 'hospital_admin',
      label: 'Hospital Admin',
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      value: 'admin',
      label: 'Admin',
      icon: Shield,
      color: 'bg-red-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      
      <div className="w-full max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-1">
                QLINIC
                <Sparkles className="w-4 h-4 text-violet-500" />
              </h1>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select your role and get started
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {roles.map((role) => {
            const IconComponent = role.icon
            const isSelected = selectedRole === role.value
            
            return (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 ${role.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                  {role.label}
                </p>
              </button>
            )
          })}
        </div>

        {/* Sign Up Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formButtonPrimary: 
                  "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-lg py-3",
                formFieldInput: 
                  "rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 px-4 py-3",
                formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
                footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                socialButtonsBlockButton: "border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700",
              }
            }}
            signInUrl="/sign-in"
            unsafeMetadata={{
              role: selectedRole
            }}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
