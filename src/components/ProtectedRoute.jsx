'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  HOSPITAL_ADMIN: 'hospital_admin',
  ADMIN: 'admin',
  SUB_ADMIN: 'sub_admin',
}

const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  requiredRoles = [],
  allowAdmin = true,
  redirectTo = '/' 
}) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    if (status !== 'loading' && !hasChecked) {
      setHasChecked(true)

      // Not signed in
      if (status === 'unauthenticated') {
        toast.error('Please sign in to access this page')
        
        // Redirect to role-specific sign-in
        if (requiredRole) {
          router.push(`/sign-in?role=${requiredRole}`)
        } else {
          router.push('/sign-in')
        }
        return
      }

      // User is authenticated
      if (status === 'authenticated' && session?.user) {
        const currentRole = session.user.role

        if (!currentRole) {
          toast.error('User role not found. Please complete your profile.')
          router.push('/sign-up')
          return
        }

        // Admin has access to everything if allowAdmin is true
        if (allowAdmin && currentRole === ROLES.ADMIN) {
          return
        }

        let hasPermission = false

        if (requiredRole) {
          hasPermission = currentRole === requiredRole
        } else if (requiredRoles.length > 0) {
          hasPermission = requiredRoles.includes(currentRole)
        } else {
          hasPermission = true
        }

        if (!hasPermission) {
          toast.error('You do not have permission to access this page')
          
          // Redirect to user's actual role dashboard
          switch(currentRole) {
            case ROLES.PATIENT:
              router.push('/patient')
              break
            case ROLES.DOCTOR:
              router.push('/doctor')
              break
            case ROLES.HOSPITAL_ADMIN:
              router.push('/hospital-admin')
              break
            case ROLES.ADMIN:
              router.push('/admin')
              break
            case ROLES.SUB_ADMIN:
              router.push('/sub-admin')
              break
            default:
              router.push(redirectTo)
          }
          return
        }
      }
    }
  }, [session, status, hasChecked, router, requiredRole, requiredRoles, allowAdmin, redirectTo])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-b-4 border-t-4 border-violet-400 mx-auto animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-b-4 border-t-4 border-violet-400 mx-auto animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  const currentRole = session?.user?.role

  // Admin bypass
  if (allowAdmin && currentRole === ROLES.ADMIN) {
    return children
  }

  // Check permissions
  let hasPermission = false
  if (requiredRole) {
    hasPermission = currentRole === requiredRole
  } else if (requiredRoles.length > 0) {
    hasPermission = requiredRoles.includes(currentRole)
  } else {
    hasPermission = !!session?.user
  }

  if (!session?.user || !hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-b-4 border-t-4 border-violet-400 mx-auto animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Verifying permissions...</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
