'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole } from '@/app/actions' // We will create this server action

export default function CompleteAuthPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [message, setMessage] = useState('Completing your profile...')

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated') {
      router.push('/sign-in')
      return
    }

    if (session) {
      const pendingRole = localStorage.getItem('oauth_pending_role')
      localStorage.removeItem('oauth_pending_role') // Clean up

      if (pendingRole && session.user.role !== pendingRole) {
        setMessage(`Assigning role: ${pendingRole}...`)
        
        updateUserRole({ role: pendingRole })
          .then(() => {
            setMessage('Role assigned. Redirecting...')
            // Update the session on the client
            return update({ role: pendingRole })
          })
          .then(() => {
            // Redirect to the correct dashboard
            const roleRoutes = {
              user: '/user',
              doctor: '/doctor',
              hospital_admin: '/hospital',
            }
            router.push(roleRoutes[pendingRole] || '/user')
          })
          .catch(err => {
            console.error('Failed to update role:', err)
            setMessage('Error assigning role. Redirecting to default dashboard.')
            router.push('/user')
          })
      } else {
        // No pending role, or role is already correct, redirect
        const role = session.user.role
        const roleRoutes = {
          user: '/user',
          doctor: '/doctor',
          hospital_admin: '/hospital',
        }
        router.push(roleRoutes[role] || '/user')
      }
    }
  }, [session, status, router, update])

  return (
    <div>
      <h1>{message}</h1>
    </div>
  )
}
