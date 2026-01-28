import { Suspense } from 'react'
import SignInClient from './SignInClient'

function SignInPageContent() {
  return <SignInClient />
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-violet-50 dark:from-gray-950 dark:via-blue-950 dark:to-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading sign in page...</p>
      </div>
    </div>}>
      <SignInPageContent />
    </Suspense>
  )
}
