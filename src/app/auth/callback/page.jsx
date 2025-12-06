// app/auth/callback/page.jsx
import { Suspense } from 'react'
import AuthCallbackContent from './AuthCallbackContent'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-slate-900">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-blue-600 mb-4"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
