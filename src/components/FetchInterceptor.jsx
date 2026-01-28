// src/components/FetchInterceptor.jsx
'use client'

import { useEffect } from 'react'
import { setupFetchInterceptor } from '@/lib/fetch-interceptor' // ✅ Fixed import name

export default function FetchInterceptor() {
  useEffect(() => {
    setupFetchInterceptor() // ✅ Call the correct function
  }, [])

  return null
}
