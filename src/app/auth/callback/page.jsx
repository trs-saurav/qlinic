// app/auth/callback/page.jsx - Updated to use API
'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [isProcessing, setIsProcessing] = useState(false)
  const roleFromUrl = searchParams.get('role') || localStorage.getItem('pendingRole') || 'patient'

  useEffect(() => {
    const handleRedirect = async () => {
      if (!isLoaded || isProcessing) return
      if (!user) return

      setIsProcessing(true)

      const existingRole = user.publicMetadata?.role

      if (existingRole) {
        const redirectMap = {
          patient: '/patient',
          doctor: '/doctor',
          hospital_admin: '/hospital-admin',
          admin: '/admin'
        }
        localStorage.removeItem('pendingRole')
        router.push(redirectMap[existingRole] || '/patient')
        return
      }

      // New user - call API to set role
      try {
        const response = await fetch('/api/user/set-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: roleFromUrl })
        })

        if (response.ok) {
          await user.reload() // Reload to get updated metadata
          
          const redirectMap = {
            patient: '/patient',
            doctor: '/doctor',
            hospital_admin: '/hospital-admin',
            admin: '/admin'
          }
          localStorage.removeItem('pendingRole')
          router.push(redirectMap[roleFromUrl] || '/patient')
        } else {
          console.error('Failed to set role')
          router.push('/')
        }
      } catch (error) {
        console.error('Error:', error)
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
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Setting up your {roleFromUrl} account...</p>
      </div>
    </div>
  )
}
