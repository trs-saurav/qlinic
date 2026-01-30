'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  requiredRoles = [],
  allowAdmin = true
}) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // ✅ Detect context from current subdomain
  const getContextRole = () => {
    if (typeof window === 'undefined') return null
    
    const hostname = window.location.hostname
    if (hostname.includes('doctor.')) return 'doctor'
    if (hostname.includes('hospital.')) return 'hospital_admin'
    if (hostname.includes('admin.')) return 'admin'
    if (hostname.includes('user.') || hostname === 'localhost') return 'user'
    return null
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to sign-in with context role
      const contextRole = getContextRole()
      const signInUrl = contextRole 
        ? `/sign-in?role=${contextRole}` 
        : '/sign-in'
      router.push(signInUrl)
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  // Admin bypass
  if (session?.user?.role === 'admin' && allowAdmin) {
    return children
  }

  // Check role requirements
  let hasPermission = false
  if (requiredRole) {
    hasPermission = session?.user?.role === requiredRole
  } else if (requiredRoles.length > 0) {
    hasPermission = requiredRoles.includes(session?.user?.role)
  } else {
    hasPermission = !!session?.user
  }

  if (!hasPermission) {
    // ✅ Context-aware redirect
    const contextRole = getContextRole()
    if (contextRole) {
      toast.error('You do not have permission to access this page')
      router.push(`/sign-in?role=${contextRole}`)
    } else {
      toast.error('You do not have permission to access this page')
      router.push('/sign-in')
    }
    return null
  }

  return children
}

export default ProtectedRoute
