'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function OAuthCompleteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  useEffect(() => {
    // Retrieve the intended role from localStorage
    let intendedRole = null;
    if (typeof window !== 'undefined') {
      intendedRole = localStorage.getItem('oauth_intended_role');
      localStorage.removeItem('oauth_intended_role'); // Clean up
      
      // Fallback: Check cookies if localStorage failed (e.g. initiated from Sign In page)
      if (!intendedRole) {
        const getCookie = (name) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? match[2] : null;
        }
        intendedRole = getCookie('oauth_role') || getCookie('oauth_role_token');
      }
      
      console.log('[OAuth Complete] Retrieved role:', intendedRole);
    }
    
    // Redirect to sign-in with the intended role
    const redirectUrl = intendedRole 
      ? `/sign-in?role=${intendedRole}&oauth_completed=1`
      : '/sign-in?oauth_completed=1';
      
    router.replace(redirectUrl);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing your sign-up...</p>
      </div>
    </div>
  );
}

export default function OAuthComplete() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing your sign-up...</p>
        </div>
      </div>
    }>
      <OAuthCompleteContent />
    </Suspense>
  )
}
