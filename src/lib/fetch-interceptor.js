export function setupFetchInterceptor() {
  if (typeof window === 'undefined') return

  const originalFetch = window.fetch

  window.fetch = async function(input, init) {
    try {
      // 1. Detect if the URL is external
      // If input is a Request object, get .url, otherwise use input string
      const urlString = (typeof input === 'object' && input !== null && input.url) ? input.url : input.toString();
      
      // It's external if it starts with http/https AND doesn't match our current domain
      const isExternal = urlString.startsWith('http') && !urlString.includes(window.location.origin);

      // 2. Prepare the enhanced configuration
      const enhancedInit = {
        ...init,
        // CRITICAL FIX: Only send cookies/credentials to YOUR backend
        credentials: isExternal ? 'omit' : 'include',
        headers: {
          ...init?.headers,
        },
      }

      const response = await originalFetch(input, enhancedInit)
      
      // 3. Handle 401s (Unauthorized) only for internal requests
      if (!isExternal && response.status === 401) {
        const currentPath = window.location.pathname
        // Avoid redirect loop if already on sign-in
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