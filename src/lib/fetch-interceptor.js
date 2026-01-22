export function setupFetchInterceptor() {
  if (typeof window === 'undefined') return

  const originalFetch = window.fetch

  window.fetch = async function(input, init) {
    try {
      // 1. Detect if the URL is external
      // If input is a Request object, get .url, otherwise use input string
      let urlString = '';
      if (typeof input === 'string') {
        urlString = input;
      } else if (input instanceof Request) {
        urlString = input.url;
      } else if (typeof input === 'object' && input !== null && input.url) {
        urlString = input.url.toString();
      } else {
        urlString = String(input);
      }
      
      // It's external if it starts with http/https AND doesn't match our current domain
      const origin = window.location.origin || '';
      const isExternal = urlString.startsWith('http') && origin && !urlString.includes(origin);

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
      // Log the error but still propagate it
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('⚠️ Network error in fetch:', error.message);
      } else {
        console.error('❌ Fetch error:', error);
      }
      throw error; // Re-throw to maintain normal error handling
    }
  }
}