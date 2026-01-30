'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function OAuthComplete() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const role = searchParams.get('role') || 'user'
  
  useEffect(() => {
    // Redirect to appropriate subdomain
    const roleRoutes = {
      user: '/user',
      doctor: '/doctor',
      hospital_admin: '/hospital',
      admin: '/admin'
    }
    
    const destination = roleRoutes[role] || '/user'
    router.push(destination)
  }, [role, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    </div>
  )
}
