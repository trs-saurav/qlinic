// middleware.js
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const { nextUrl } = req
  
  const hostname = req.headers.get('host') || ''
  const hostnameWithoutPort = hostname.split(':')[0]
  const parts = hostnameWithoutPort.split('.')
  
  // ✅ Determine current subdomain
  let currentHost = 'main'
  if (parts.length === 2 && parts[1] === 'localhost') {
    currentHost = parts[0] // user.localhost -> user
  } else if (parts.length > 2) {
    currentHost = parts[0] // user.qlinichealth.com -> user
  } else if (parts[0] === 'localhost') {
    currentHost = 'main' // Plain localhost -> main
  }
  
  const isDevelopment = process.env.NODE_ENV === 'development'
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost'
  const isMainDomain = currentHost === 'main' || currentHost === mainDomain.split('.')[0]
  
  const subdomainToRole = {
    'admin': 'admin',
    'hospital': 'hospital_admin',
    'doctor': 'doctor',
    'user': 'user',
    'api': 'api'
  }
  
  const origin = req.headers.get('origin')
  
  // ✅ CRITICAL: Skip middleware for NextAuth routes
  if (nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  
  // ✅ Skip static files and Next.js internals
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/favicon.ico') ||
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next()
  }
  
  // ✅ CORS handling for API subdomain
  if (currentHost === 'api') {
    const allowedOrigins = isDevelopment
      ? [
          'http://localhost:3000',
          'http://user.localhost:3000',
          'http://doctor.localhost:3000',
          'http://admin.localhost:3000',
          'http://hospital.localhost:3000',
          `http://${mainDomain}:3000`,
          `http://user.${mainDomain}:3000`,
          `http://doctor.${mainDomain}:3000`,
          `http://hospital.${mainDomain}:3000`,
          `http://admin.${mainDomain}:3000`,
        ]
      : [
          `https://www.${mainDomain}`,
          `https://${mainDomain}`,
          `https://user.${mainDomain}`,
          `https://doctor.${mainDomain}`,
          `https://admin.${mainDomain}`,
          `https://hospital.${mainDomain}`,
        ]
    
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    
    const url = nextUrl.clone()
    
    // Rewrite /api/* to /*
    if (nextUrl.pathname.startsWith('/api/')) {
      url.pathname = nextUrl.pathname.replace('/api', '')
    } else if (nextUrl.pathname !== '/' && !nextUrl.pathname.startsWith('/_next')) {
      url.pathname = `/api${nextUrl.pathname}`
    }
    
    const response = NextResponse.rewrite(url)
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    return response
  }
  
  // ✅ REDIRECT: Main domain to appropriate subdomain
  if (isMainDomain) {
    const pathRole = nextUrl.pathname.split('/')[1]
    
    if (subdomainToRole[pathRole] && pathRole !== 'api') {
      const subdomain = pathRole
      const port = isDevelopment ? ':3000' : ''
      const protocol = isDevelopment ? 'http' : 'https'
      
      const subdomainUrl = new URL(
        `${protocol}://${subdomain}.${mainDomain}${port}${nextUrl.pathname.replace(`/${pathRole}`, '') || '/'}${nextUrl.search}`
      )
      
      return NextResponse.redirect(subdomainUrl)
    }
  }
  
  const roleFromSubdomain = subdomainToRole[currentHost]
  
  // ✅ Public API paths (no auth required)
  const publicApiPaths = [
    '/api/auth',
    '/api/user/create',
    '/api/user/check',
    '/api/webhooks',
    '/api/inngest',
    '/api/search',
    '/api/home/stats',
    '/api/public'
  ]

  if (publicApiPaths.some(path => nextUrl.pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // ✅ Get authentication token
  const cookieCandidates = [
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
  ]

  let token = null
  for (const cookieName of cookieCandidates) {
    if (req.cookies.get(cookieName)) {
      token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName,
      })
      if (token) break
    }
  }

  // Fallback to default cookie name
  if (!token) {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })
  }
  
  const isLoggedIn = !!token
  const userRole = token?.role

  // ✅ Public paths (accessible without login)
  const publicPaths = [
    '/',
    '/sign-in',
    '/sign-up',
    '/aboutus',
    '/about',
    '/solutions',
    '/contact-us',
    '/search',
    '/privacy',
    '/terms',
    '/unauthorized',
    '/auth/error',
  ]

  const isPublicPath = publicPaths.some(path => 
    nextUrl.pathname === path || nextUrl.pathname.startsWith(path + '/')
  )
  
  // ✅ Redirect to sign-in if accessing protected route without auth
  if (roleFromSubdomain && roleFromSubdomain !== 'api' && !isLoggedIn && !isPublicPath) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('role', roleFromSubdomain)
    signInUrl.searchParams.set('redirect', nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  // ✅ Redirect root (/) to sign-in on subdomains if not logged in
  if (roleFromSubdomain && roleFromSubdomain !== 'api' && nextUrl.pathname === '/') {
    if (!isLoggedIn) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('role', roleFromSubdomain)
      return NextResponse.redirect(signInUrl)
    } else {
      // Redirect logged-in users from root to their dashboard
      const dashboardPath = roleFromSubdomain === 'hospital_admin' ? '/hospital-admin' : `/${roleFromSubdomain}`
      return NextResponse.redirect(new URL(dashboardPath, req.url))
    }
  }
  
  // ✅ Allow access to public paths
  if (isPublicPath) {
    return NextResponse.next()
  }

  // ✅ REWRITE: Add role prefix to path on subdomains
  if (roleFromSubdomain && roleFromSubdomain !== 'api') {
    const url = nextUrl.clone()
    const rolePath = roleFromSubdomain === 'hospital_admin' ? 'hospital-admin' : roleFromSubdomain
    
    if (!url.pathname.startsWith(`/${rolePath}`) && !isPublicPath) {
      url.pathname = `/${rolePath}${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // ✅ Protect API routes
  if (nextUrl.pathname.startsWith('/api') && !publicApiPaths.some(path => nextUrl.pathname.startsWith(path))) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ✅ Route-based access control
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isDoctorRoute = nextUrl.pathname.startsWith('/doctor')
  const isUserRoute = nextUrl.pathname.startsWith('/user')
  const isHospitalAdminRoute = nextUrl.pathname.startsWith('/hospital-admin')

  // Redirect to sign-in if not authenticated
  if (!isLoggedIn && (isAdminRoute || isDoctorRoute || isUserRoute || isHospitalAdminRoute)) {
    const signInUrl = new URL('/sign-in', nextUrl.origin)
    signInUrl.searchParams.set('redirect', nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // ✅ ROLE VERIFICATION: Ensure user role matches the route/subdomain
  if (isLoggedIn) {
    // Check if user is accessing the correct role-based route
    if (isAdminRoute && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl))
    }
    if (isDoctorRoute && userRole !== 'doctor') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl))
    }
    if (isUserRoute && userRole !== 'user') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl))
    }
    if (isHospitalAdminRoute && userRole !== 'hospital_admin') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl))
    }
    
    // ✅ CRITICAL: Ensure user is on the correct subdomain
    if (roleFromSubdomain && roleFromSubdomain !== 'api' && userRole !== roleFromSubdomain) {
      // Redirect to correct subdomain
      const correctSubdomain = userRole === 'hospital_admin' ? 'hospital' : userRole
      const port = isDevelopment ? ':3000' : ''
      const protocol = isDevelopment ? 'http' : 'https'
      const correctUrl = `${protocol}://${correctSubdomain}.${mainDomain}${port}/${userRole === 'hospital_admin' ? 'hospital-admin' : userRole}`
      
      return NextResponse.redirect(new URL(correctUrl))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)).*)',
    '/api/:path*',
  ],
}
