export function setupFetchInterceptor() {
  if (typeof window === 'undefined') return

  const originalFetch = window.fetch

  window.fetch = async function(input, init) {
    try {
      // Convert input to URL string for analysis
      let urlString = '';
      let requestObject = null;
      
      if (typeof input === 'string') {
        urlString = input;
      } else if (input instanceof Request) {
        urlString = input.url;
        requestObject = input; // Keep reference to original Request object
      } else if (typeof input === 'object' && input !== null && input.url) {
        urlString = input.url.toString();
      } else {
        urlString = String(input);
      }
      
      // ✅ EXCLUDE ALL NextAuth internal requests
      const isNextAuthRequest = urlString.includes('/api/auth/') || 
                               urlString.includes('_nextauth') ||
                               urlString.includes('session') ||
                               urlString.includes('csrf') ||
                               urlString.includes('providers') ||
                               urlString.includes('callback') ||
                               urlString.includes('signin') ||
                               urlString.includes('error');
      
      // If it's a NextAuth request, pass through unchanged to avoid interference
      if (isNextAuthRequest) {
        // Use original Request object if available to preserve all properties
        if (requestObject) {
          return originalFetch.call(this, requestObject, init);
        }
        return originalFetch.call(this, input, init);
      }
      
      // ✅ EXCLUDE already relative API calls (they're already correct)
      const isRelativeApiCall = urlString.startsWith('/api/') && !urlString.includes('://');
      
      // Only intercept absolute API calls that need conversion
      const shouldIntercept = !isRelativeApiCall && 
                             (urlString.includes('api.localhost:3000') || 
                              urlString.includes('api.qlinichealth.com'));
      
      // If it shouldn't be intercepted, pass through unchanged
      if (!shouldIntercept) {
        return originalFetch.call(this, input, init);
      }
      
      // Convert api.domain.com/api/... to /api/...
      let modifiedUrl = urlString;
      if (urlString.includes('api.localhost:3000/api/')) {
        modifiedUrl = urlString.replace('http://api.localhost:3000/api/', '/api/');
      } else if (urlString.includes('api.qlinichealth.com/api/')) {
        modifiedUrl = urlString.replace('https://api.qlinichealth.com/api/', '/api/');
      }
      
      // Prepare the enhanced configuration
      const enhancedInit = {
        ...init,
        credentials: 'include', // Include credentials for internal requests
        headers: {
          ...init?.headers,
        },
      }

      const response = await originalFetch.call(this, modifiedUrl, enhancedInit)
      
      // Handle 401s (Unauthorized) only for non-auth requests
      if (response.status === 401) {
        const currentPath = window.location.pathname
        if (!currentPath.includes('/sign-in')) {
          window.location.href = '/sign-in'
        }
      }

      return response
    } catch (error) {
      console.error('❌ Fetch interceptor error:', error);
      throw error;
    }
  }
}
