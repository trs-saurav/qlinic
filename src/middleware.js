// src/app/middleware.js
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req) {
  const { nextUrl } = req
  
  // ========================================
  // 1. EARLY EXITS
  // ========================================
  
  if (nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/favicon.ico') ||
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|webp|ico)$/)
  ) {
    return NextResponse.next()
  }
  
  // ========================================
  // 2. SUBDOMAIN DETECTION
  // ========================================
  
  const hostname = req.headers.get('host') || ''
  const hostnameWithoutPort = hostname.split(':')[0]
  const parts = hostnameWithoutPort.split('.')
  
  let currentHost = 'main'
  if (parts.length === 2 && parts[1] === 'localhost') {
    currentHost = parts[0]
  } else if (parts.length > 2) {
    currentHost = parts[0]
  } else if (parts[0] === 'localhost') {
    currentHost = 'main'
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
  
  const roleFromSubdomain = subdomainToRole[currentHost]
  
  // ========================================
  // 3. API SUBDOMAIN - FIXED
  // ========================================
  
  if (currentHost === 'api') {
    console.log('🔧 API subdomain detected')
    console.log('   Pathname:', nextUrl.pathname)
    
    const origin = req.headers.get('origin')
    const allowedOrigins = isDevelopment
      ? [
          'http://localhost:3000',
          'http://user.localhost:3000',
          'http://doctor.localhost:3000',
          'http://admin.localhost:3000',
          'http://hospital.localhost:3000',
        ]
      : [
          `https://${mainDomain}`,
          `https://www.${mainDomain}`,
          `https://user.${mainDomain}`,
          `https://doctor.${mainDomain}`,
          `https://admin.${mainDomain}`,
          `https://hospital.${mainDomain}`,
        ]
    
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin',
        },
      })
    }
    
    // ✅ FIX: Handle api.localhost root - return API info
    if (nextUrl.pathname === '/') {
      return NextResponse.json({
        status: 'ok',
        message: 'Qlinic API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json'
        }
      })
    }
    
    // ✅ FIX: Only rewrite paths that don't already start with /api
    const url = nextUrl.clone()
    if (!nextUrl.pathname.startsWith('/api/')) {
      url.pathname = `/api${nextUrl.pathname}`
      console.log('   Rewriting to:', url.pathname)
    }
    
    const response = NextResponse.rewrite(url)
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Vary', 'Origin')
    
    return response
  }
  
  // ========================================
  // 4. PUBLIC PATHS
  // ========================================
  
  const authPaths = ['/sign-in', '/sign-up', '/auth/error', '/unauthorized']
  const publicPaths = ['/', ...authPaths, '/aboutus', '/about', '/solutions', '/contact-us', '/search', '/privacy', '/terms']
  const publicApiPaths = ['/api/auth', '/api/user/create', '/api/user/check', '/api/webhooks', '/api/inngest', '/api/search', '/api/home/stats', '/api/public']
  
  const isAuthPath = authPaths.some(path => nextUrl.pathname === path || nextUrl.pathname.startsWith(path + '/'))
  const isPublicPath = publicPaths.some(path => nextUrl.pathname === path || nextUrl.pathname.startsWith(path + '/'))
  const isPublicApiPath = publicApiPaths.some(path => nextUrl.pathname.startsWith(path))
  
  if (isPublicApiPath) {
    return NextResponse.next()
  }
  
  // ========================================
  // 5. MAIN DOMAIN REDIRECTS
  // ========================================
  
  if (isMainDomain) {
    const pathRole = nextUrl.pathname.split('/')[1]
    
    if (subdomainToRole[pathRole] && pathRole !== 'api') {
      const subdomain = pathRole
      const port = isDevelopment ? ':3000' : ''
      const protocol = isDevelopment ? 'http' : 'https'
      
      let subdomainUrl;
      
      if (pathRole === 'hospital' || pathRole === 'hospital-admin') {
        subdomainUrl = new URL(
          `${protocol}://${subdomain}.${mainDomain}${port}/hospital${nextUrl.search}`
        );
      } else {
        subdomainUrl = new URL(
          `${protocol}://${subdomain}.${mainDomain}${port}${nextUrl.pathname.replace(`/${pathRole}`, '') || '/'}${nextUrl.search}`
        );
      }
      
      return NextResponse.redirect(subdomainUrl);
    }
    
    return NextResponse.next()
  }
  
  // ========================================
  // 6. AUTHENTICATION CHECK
  // ========================================
  
  const sessionCookieName = isDevelopment 
    ? 'authjs.session-token'
    : '__Secure-authjs.session-token'
  
  let token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: sessionCookieName,
  })
  
  const isLoggedIn = !!token
  const userRole = token?.role
  
  // ========================================
  // 7. SUBDOMAIN ROOT HANDLING
  // ========================================
  
  if (roleFromSubdomain && roleFromSubdomain !== 'api' && nextUrl.pathname === '/') {
    const dashboardPath = roleFromSubdomain === 'hospital_admin' ? '/hospital' : `/${roleFromSubdomain}`
    return NextResponse.redirect(new URL(dashboardPath, req.url))
  }
  
  // ========================================
  // 8. AUTH PATHS
  // ========================================
  
  if (isAuthPath) {
    const requestedRole = nextUrl.searchParams.get('role')
    
    if (isLoggedIn && nextUrl.pathname === '/sign-in') {
      if (roleFromSubdomain && userRole === roleFromSubdomain) {
        const dashboardPath = roleFromSubdomain === 'hospital_admin' ? '/hospital' : `/${roleFromSubdomain}`
        return NextResponse.redirect(new URL(dashboardPath, req.url), { status: 303 })
      }
      
      if (requestedRole && requestedRole !== userRole) {
        const dashboardPath = userRole === 'hospital_admin' ? '/hospital' : `/${userRole}`
        return NextResponse.redirect(new URL(dashboardPath, req.url))
      }
    }
    
    if (!isLoggedIn && nextUrl.pathname === '/sign-in' && requestedRole && roleFromSubdomain && requestedRole !== roleFromSubdomain) {
      const correctSubdomain = {
        'user': 'user',
        'doctor': 'doctor',
        'admin': 'admin',
        'hospital_admin': 'hospital'
      }[requestedRole]
      
      if (correctSubdomain) {
        const port = isDevelopment ? ':3000' : ''
        const protocol = isDevelopment ? 'http' : 'https'
        
        const correctSubdomainUrl = new URL(
          `${protocol}://${correctSubdomain}.${mainDomain}${port}/sign-in?role=${requestedRole}`
        )
        
        return NextResponse.redirect(correctSubdomainUrl)
      }
    }
    
    return NextResponse.next()
  }
  
  // ========================================
  // 9. PUBLIC PATHS
  // ========================================
  
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // ========================================
  // 10. AUTHENTICATION REQUIRED
  // ========================================
  
  if (!isLoggedIn && roleFromSubdomain && roleFromSubdomain !== 'api' && nextUrl.pathname !== '/') {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('role', roleFromSubdomain)
    signInUrl.searchParams.set('redirect', nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  // ========================================
  // 11. ROLE-BASED ACCESS CONTROL
  // ========================================
  
  if (isLoggedIn && roleFromSubdomain && roleFromSubdomain !== 'api') {
    const isAdminRoute = nextUrl.pathname.startsWith('/admin')
    const isDoctorRoute = nextUrl.pathname.startsWith('/doctor')
    const isUserRoute = nextUrl.pathname.startsWith('/user')
    const isHospitalRoute = nextUrl.pathname.startsWith('/hospital')  
    
    if ((isAdminRoute && userRole !== 'admin') ||
        (isDoctorRoute && userRole !== 'doctor') ||
        (isUserRoute && userRole !== 'user') ||
        (isHospitalRoute && userRole !== 'hospital_admin')) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }
  
  // ========================================
  // 12. PATH REWRITING FOR SUBDOMAINS
  // ========================================
  
  if (roleFromSubdomain && roleFromSubdomain !== 'api' && !isPublicPath && !isAuthPath) {
    const rolePath = roleFromSubdomain === 'hospital_admin' ? 'hospital' : roleFromSubdomain
    
    // ✅ NEVER rewrite auth or API routes
    const isAuthApiRoute = nextUrl.pathname.startsWith('/api/auth')
    const isAnyApiRoute = nextUrl.pathname.startsWith('/api/')
    const alreadyPrefixed = nextUrl.pathname.startsWith(`/${rolePath}`)
    
    if (!isAuthApiRoute && !isAnyApiRoute && !alreadyPrefixed) {
      const url = nextUrl.clone()
      url.pathname = `/${rolePath}${nextUrl.pathname}`
      return NextResponse.rewrite(url)
    }
  }
  
  // ========================================
  // 13. API ROUTE PROTECTION
  // ========================================
  
  if (nextUrl.pathname.startsWith('/api') && !isPublicApiPath) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)).*)',
  ],
}
