// components/ProtectedRoute.jsx
'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAppContext } from '@/context/AppContext'

const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  requiredRoles = [],
  allowAdmin = true,
  redirectTo = '/' 
}) => {
  const { user, isLoaded } = useUser()
  const { userRole, isLoading, ROLES } = useAppContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isLoading) {
      if (!user) {
        toast.error('Please sign in to access this page')
        router.push('/sign-in')
        return
      }

      // Get role from publicMetadata (secure) or unsafeMetadata (fallback)
      const currentRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role || userRole

      if (!currentRole) {
        toast.error('User role not found. Please complete your profile.')
        router.push('/')
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
        router.push(redirectTo)
        return
      }
    }
  }, [user, isLoaded, userRole, isLoading, router, requiredRole, requiredRoles, allowAdmin, redirectTo, ROLES])

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const currentRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role || userRole

  if (allowAdmin && currentRole === ROLES.ADMIN) {
    return children
  }

  let hasPermission = false
  if (requiredRole) {
    hasPermission = currentRole === requiredRole
  } else if (requiredRoles.length > 0) {
    hasPermission = requiredRoles.includes(currentRole)
  } else {
    hasPermission = !!user
  }

  if (!user || !hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Verifying permissions...</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
