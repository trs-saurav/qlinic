// src/lib/fetch-interceptor.js
export function setupFetchInterceptor() {
  if (typeof window === 'undefined') return

  const originalFetch = window.fetch

  window.fetch = async function(input, init) {
    try {
      // ✅ Just ensure credentials are included, don't rewrite URLs
      const enhancedInit = {
        ...init,
        credentials: 'include',
        headers: {
          ...init?.headers,
        },
      }

      const response = await originalFetch(input, enhancedInit)
      
      // Handle 401s
      if (response.status === 401) {
        const currentPath = window.location.pathname
        if (!currentPath.includes('/sign-in')) {
          window.location.href = '/sign-in'
        }
      }

      return response
    } catch (error) {
      console.error('❌ Fetch error:', error)
      throw error
    }
  }
}
