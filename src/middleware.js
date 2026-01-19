// src/app/middleware.js
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req) {
  const { nextUrl } = req
  const hostname = req.headers.get('host') || ''
  
  // =======================================================
  // 1. EARLY EXITS
  // =======================================================
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|webp|ico)$/)
  ) {
    return NextResponse.next()
  }

  // =======================================================
  // 2. CONTEXT & CONFIGURATION
  // =======================================================
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || (isDevelopment ? 'localhost' : 'qlinichealth.com')
  
  const hostnameWithoutPort = hostname.split(':')[0]
  const parts = hostnameWithoutPort.split('.')
  let currentSubdomain = null
  
  if (isDevelopment) {
    if (parts.length === 2 && parts[1] === 'localhost') currentSubdomain = parts[0]
  } else {
    if (parts.length >= 3) currentSubdomain = parts[0]
  }

  const isMainDomain = !currentSubdomain || currentSubdomain === 'www' || currentSubdomain === 'main'

  const subdomainToRole = {
    'admin': 'admin',
    'hospital': 'hospital_admin',
    'doctor': 'doctor',
    'user': 'user',
    'api': 'api'
  }

  const roleToSubdomain = {
    'admin': 'admin',
    'hospital_admin': 'hospital',
    'doctor': 'doctor',
    'user': 'user'
  }

  const currentRoleContext = subdomainToRole[currentSubdomain]

  // =======================================================
  // 3. API SUBDOMAIN HANDLING
  // =======================================================
  if (currentSubdomain === 'api') {
    const origin = req.headers.get('origin')
    const allowedOrigins = isDevelopment
      ? ['http://localhost:3000', 'http://user.localhost:3000', 'http://doctor.localhost:3000', 'http://admin.localhost:3000', 'http://hospital.localhost:3000']
      : [`https://${mainDomain}`, `https://user.${mainDomain}`, `https://doctor.${mainDomain}`, `https://admin.${mainDomain}`, `https://hospital.${mainDomain}`]
    
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

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
    if (!nextUrl.pathname.startsWith('/api/')) {
      url.pathname = `/api${nextUrl.pathname}`
    }
    const response = NextResponse.rewrite(url)
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response
  }

  // =======================================================
  // 4. AUTHENTICATION
  // =======================================================
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: isDevelopment ? 'authjs.session-token' : '__Secure-authjs.session-token',
  })

  const isLoggedIn = !!token
  const userRole = token?.role

  // =======================================================
  // 5. PATH DEFINITIONS (STRICT PRIVACY)
  // =======================================================
  const authPaths = ['/sign-in', '/sign-up', '/auth/error', '/unauthorized']
  const publicPaths = ['/', ...authPaths, '/about', '/contact-us', '/privacy', '/terms']
  
  const isAuthPath = authPaths.some(path => nextUrl.pathname.startsWith(path))
  
  // LOGIC: Paths like '/' are only public on the Main Domain.
  // On subdomains, everything is private unless it's an Auth Path (like sign-in).
  let isEffectivePublicPath = publicPaths.some(path => nextUrl.pathname === path)
  if (!isMainDomain && !isAuthPath) {
    isEffectivePublicPath = false
  }

  // =======================================================
  // 6. GLOBAL NAVIGATION REDIRECTS (FIXED)
  // =======================================================
  // If ANYONE (Main or Subdomain) visits a path belonging to another portal
  // (e.g. /doctor), send them to that subdomain immediately.
  if (!isAuthPath) {
    const pathParts = nextUrl.pathname.split('/')
    const firstPathSegment = pathParts[1] 

    const pathToSubdomain = {
      'admin': 'admin',
      'hospital': 'hospital',
      'doctor': 'doctor',
      'user': 'user'
    }

    if (pathToSubdomain[firstPathSegment]) {
      const targetSubdomain = pathToSubdomain[firstPathSegment]
      
      // If we are currently NOT on that subdomain, redirect there.
      if (currentSubdomain !== targetSubdomain) {
        const port = isDevelopment ? ':3000' : ''
        const protocol = isDevelopment ? 'http' : 'https'
        
        // Remove the prefix: /doctor/dashboard -> doctor.localhost/dashboard
        const newPath = nextUrl.pathname.replace(`/${firstPathSegment}`, '') || '/'
        
        return NextResponse.redirect(
          new URL(`${protocol}://${targetSubdomain}.${mainDomain}${port}${newPath}${nextUrl.search}`)
        )
      }
    }
  }

  // =======================================================
  // 7. DASHBOARD REDIRECTS (Main Domain Only)
  // =======================================================
  if (isMainDomain && isLoggedIn && !isEffectivePublicPath) {
    const targetSub = roleToSubdomain[userRole]
    if (targetSub) {
      const port = isDevelopment ? ':3000' : ''
      const protocol = isDevelopment ? 'http' : 'https'
      return NextResponse.redirect(`${protocol}://${targetSub}.${mainDomain}${port}`)
    }
  }

  // =======================================================
  // 8. SUBDOMAIN ISOLATION (The Firewall)
  // =======================================================
  if (currentRoleContext && currentRoleContext !== 'api') {
    
    // A. Unauthorized (Not Logged In)
    // We removed the Alien Path bypass. This strictly enforces login.
    if (!isLoggedIn && !isEffectivePublicPath && !isAuthPath) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('role', currentRoleContext)
      signInUrl.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // B. Wrong Neighborhood (Logged In, but Wrong Role)
    if (isLoggedIn && userRole !== currentRoleContext) {
      const correctSub = roleToSubdomain[userRole] || 'user'
      const port = isDevelopment ? ':3000' : ''
      const protocol = isDevelopment ? 'http' : 'https'
      return NextResponse.redirect(`${protocol}://${correctSub}.${mainDomain}${port}`)
    }
  }

  // =======================================================
  // 9. INTERNAL REWRITES
  // =======================================================
  if (currentRoleContext && currentRoleContext !== 'api' && !isAuthPath) {
    const roleFolder = currentRoleContext === 'hospital_admin' ? 'hospital' : currentRoleContext
    const isApiRoute = nextUrl.pathname.startsWith('/api/')
    const isAlreadyPrefixed = nextUrl.pathname.startsWith(`/${roleFolder}`)

    if (!isApiRoute && !isAlreadyPrefixed) {
      const url = nextUrl.clone()
      url.pathname = `/${roleFolder}${nextUrl.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)).*)',
  ],
}