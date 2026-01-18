'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SetupCheck({ children }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasHospital, setHasHospital] = useState(false)

  useEffect(() => {
    checkHospital()
  }, [])

  const checkHospital = async () => {
    try {
      const res = await fetch('/api/hospital/profile')
      
      if (res.ok) {
        setHasHospital(true)
      } else {
        // No hospital, redirect to setup
        router.push('/hospital/setup')
      }
    } catch (err) {
      console.error('Check failed:', err)
    } finally {
      setChecking(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!hasHospital) {
    return null // Will redirect
  }

  return <>{children}</>
}
