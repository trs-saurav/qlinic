export const authConfig = {
  pages: {
    signIn: '/sign-in',
    error: '/auth/error',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const role = auth?.user?.role
      
      // Public routes
      const publicPaths = [
        '/',
        '/sign-in',
        '/sign-up',
        '/aboutus',
        '/solutions',
        '/contact-us',
        '/search',
      ]
      
      const isPublicPath = publicPaths.some(path => 
        nextUrl.pathname === path || nextUrl.pathname.startsWith(path + '/')
      )
      
      // Allow public routes and API webhooks/inngest
      if (isPublicPath || 
          nextUrl.pathname.startsWith('/api/webhooks') || 
          nextUrl.pathname.startsWith('/api/inngest')) {
        return true
      }
      
      // API routes require authentication
      if (nextUrl.pathname.startsWith('/api')) {
        return isLoggedIn
      }
      
      // Protected routes
      const isAdminRoute = nextUrl.pathname.startsWith('/admin')
      const isSubAdminRoute = nextUrl.pathname.startsWith('/sub-admin')
      const isDoctorRoute = nextUrl.pathname.startsWith('/doctor')
      const isPatientRoute = nextUrl.pathname.startsWith('/patient')
      const isHospitalAdminRoute = nextUrl.pathname.startsWith('/hospital-admin')
      
      if (isAdminRoute || isSubAdminRoute || isDoctorRoute || isPatientRoute || isHospitalAdminRoute) {
        if (!isLoggedIn) return false
        
        // Admin routes
        if (isAdminRoute && role !== 'admin') return false
        
        // Sub-admin routes
        if (isSubAdminRoute && !['admin', 'sub_admin'].includes(role)) return false
        
        // Doctor routes
        if (isDoctorRoute && role !== 'doctor') return false
        
        // Patient routes
        if (isPatientRoute && role !== 'patient') return false
        
        // Hospital admin routes
        if (isHospitalAdminRoute && role !== 'hospital_admin') return false
      }
      
      return true
    },
  },
  providers: [],
}
