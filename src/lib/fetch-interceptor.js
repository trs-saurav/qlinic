// src/lib/fetch-interceptor.js
export function setupFetchInterceptor() { // ✅ Named export
  if (typeof window === 'undefined') return

  const originalFetch = window.fetch

  window.fetch = async function(input, init) {
    try {
      let url = typeof input === 'string' ? input : input.url
      
      // ✅ Skip interceptor for NextAuth routes
      if (url.includes('/api/auth/')) {
        console.log('🔐 Auth request - bypassing interceptor')
        return originalFetch(input, {
          ...init,
          credentials: 'include'
        })
      }

      console.log('🌐 Intercepted fetch:', url)

      // Ensure credentials are included
      const enhancedInit = {
        ...init,
        credentials: init?.credentials || 'include',
      }

      const response = await originalFetch(input, enhancedInit)
      
      // Handle auth errors
      if (response.status === 401) {
        console.warn('⚠️ Unauthorized - redirecting to sign in')
        window.location.href = '/sign-in'
      }

      return response
    } catch (error) {
      console.error('❌ Fetch interceptor error:', error)
      throw error
    }
  }
}
