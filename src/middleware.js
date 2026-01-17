// middleware.js
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const { nextUrl } = req
  
  const hostname = req.headers.get('host') || ''
  const hostnameWithoutPort = hostname.split(':')[0]
  const parts = hostnameWithoutPort.split('.')
  
  let currentHost = 'main'
  if (parts.length === 2 && parts[1] === 'localhost') {
    currentHost = parts[0]
  } else if (parts.length > 2) {
    currentHost = parts[0]
  }
  
  const isDevelopment = process.env.NODE_ENV === 'development'
  const mainDomain = isDevelopment ? 'localhost' : 'qlinichealth.com'
  const isMainDomain = currentHost === 'main' || currentHost === 'localhost'
  
  const subdomainToRole = {
    'admin': 'admin',
    'hospital': 'hospital_admin',
    'doctor': 'doctor',
    'user': 'user',
    'api': 'api'
  }
  
  // ✅ Get the request origin
  const origin = req.headers.get('origin')
  
  // ✅ IMPORTANT: Skip middleware for NextAuth routes
  if (nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  
  // ✅ CORS handling for API subdomain
  if (currentHost === 'api') {
    // Define allowed origins
    const allowedOrigins = [
      'http://user.localhost:3000',
      'http://doctor.localhost:3000',
      'http://admin.localhost:3000',
      'http://hospital.localhost:3000',
      'https://user.qlinichealth.com',
      'https://doctor.qlinichealth.com',
      'https://admin.qlinichealth.com',
      'https://hospital.qlinichealth.com',
    ]
    
    // ✅ Use specific origin instead of wildcard
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
        },
      })
    }
    
    const url = nextUrl.clone()
    
    if (nextUrl.pathname.startsWith('/api/')) {
      url.pathname = nextUrl.pathname.replace('/api', '')
    } else if (nextUrl.pathname !== '/' && !nextUrl.pathname.startsWith('/_next')) {
      url.pathname = `/api${nextUrl.pathname}`
    }
    
    // Add CORS headers with specific origin
    const response = NextResponse.rewrite(url)
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    return response
  }
  
  // Redirect from main domain
  if (isMainDomain) {
    const pathRole = nextUrl.pathname.split('/')[1]
    
    if (subdomainToRole[pathRole] && pathRole !== 'api') {
      const subdomain = pathRole === 'hospital_admin' ? 'hospital' : pathRole
      
      const subdomainUrl = new URL(req.url)
      subdomainUrl.hostname = `${subdomain}.${mainDomain}`
      subdomainUrl.pathname = nextUrl.pathname.replace(`/${pathRole}`, '') || '/'
      
      return NextResponse.redirect(subdomainUrl)
    }
  }
  
  const roleFromSubdomain = subdomainToRole[currentHost]
  
  const publicApiPaths = [
    '/api/auth',
    '/api/user/create',
    '/api/user/check',
    '/api/webhooks',
    '/api/inngest',
    '/api/search',
    '/api/home/stats'
  ]

  if (publicApiPaths.some(path => nextUrl.pathname.startsWith(path))) {
    return NextResponse.next()
  }

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

  if (!token) {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })
  }
  
  const isLoggedIn = !!token
  const userRole = token?.role

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
  ]

  const isPublicPath = publicPaths.some(path => 
    nextUrl.pathname === path || nextUrl.pathname.startsWith(path + '/')
  )
  
  if (roleFromSubdomain && roleFromSubdomain !== 'api' && !isLoggedIn && !isPublicPath) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('role', roleFromSubdomain)
    signInUrl.searchParams.set('redirect', nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  if (roleFromSubdomain && roleFromSubdomain !== 'api' && isPublicPath && nextUrl.pathname === '/') {
    if (!isLoggedIn) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('role', roleFromSubdomain)
      return NextResponse.redirect(signInUrl)
    }
  }
  
  if (isPublicPath && nextUrl.pathname !== '/') {
    return NextResponse.next()
  }

  if (roleFromSubdomain && roleFromSubdomain !== 'api') {
    const url = nextUrl.clone()
    const rolePath = roleFromSubdomain === 'hospital_admin' ? 'hospital-admin' : roleFromSubdomain
    
    if (!url.pathname.startsWith(`/${rolePath}`)) {
      url.pathname = `/${rolePath}${url.pathname === '/' ? '' : url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  if (nextUrl.pathname.startsWith('/api')) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isDoctorRoute = nextUrl.pathname.startsWith('/doctor')
  const isUserRoute = nextUrl.pathname.startsWith('/user')
  const isHospitalAdminRoute = nextUrl.pathname.startsWith('/hospital-admin')

  if (!isLoggedIn && (isAdminRoute || isDoctorRoute || isUserRoute || isHospitalAdminRoute)) {
    const signInUrl = new URL('/sign-in', nextUrl.origin)
    signInUrl.searchParams.set('redirect', nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  if (isLoggedIn) {
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
    
    if (roleFromSubdomain && roleFromSubdomain !== 'api' && userRole !== roleFromSubdomain) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
