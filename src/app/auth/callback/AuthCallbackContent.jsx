// app/auth/callback/AuthCallbackContent.jsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [isProcessing, setIsProcessing] = useState(false)
  const roleFromUrl = searchParams.get('role') || (typeof window !== 'undefined' ? localStorage.getItem('pendingRole') : null) || 'patient'

  useEffect(() => {
    const handleRedirect = async () => {
      if (!isLoaded || isProcessing) return
      if (!user) return

      setIsProcessing(true)

      console.log('🔍 User detected:', user.id)
      console.log('🔍 Role from URL/Storage:', roleFromUrl)

      // Check if user already has a role
      const existingRole = user.publicMetadata?.role

      if (existingRole) {
        console.log('✅ User already has role in publicMetadata:', existingRole)
        const redirectMap = {
          patient: '/patient',
          doctor: '/doctor',
          hospital_admin: '/hospital-admin',
          admin: '/admin'
        }
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingRole')
        }
        router.push(redirectMap[existingRole] || '/patient')
        return
      }

      // New user - call API to set role in BOTH metadata fields
      console.log('⚙️ New user - calling API to set role:', roleFromUrl)
      
      try {
        const response = await fetch('/api/user/set-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: roleFromUrl })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('✅ Role set successfully via API:', data.role)
          
          // Reload user to get updated metadata
          await user.reload()
          
          const redirectMap = {
            patient: '/patient',
            doctor: '/doctor',
            hospital_admin: '/hospital-admin',
            admin: '/admin'
          }
          
          if (typeof window !== 'undefined') {
            localStorage.removeItem('pendingRole')
          }
          
          router.push(redirectMap[roleFromUrl] || '/patient')
        } else {
          console.error('❌ Failed to set role')
          setIsProcessing(false)
          router.push('/')
        }
      } catch (error) {
        console.error('❌ Error calling API:', error)
        setIsProcessing(false)
        router.push('/')
      }
    }

    handleRedirect()
  }, [user, isLoaded, roleFromUrl, router, isProcessing])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-slate-900">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-blue-600 mb-4"></div>
          <div className="absolute inset-0 rounded-full h-16 w-16 border-b-4 border-t-4 border-violet-400 animate-spin" 
               style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Setting up your account...</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Configuring your {roleFromUrl} role</p>
      </div>
    </div>
  )
}
