// src/middleware.js
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req) {
  const { nextUrl } = req
  const hostname = req.headers.get('host') || ''
  
  // =======================================================
  // 1. EARLY EXITS - Static assets, auth API, etc.
  // =======================================================
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/api/inngest') ||
    nextUrl.pathname.startsWith('/api/webhooks') ||
    nextUrl.pathname.startsWith('/api/user/check') ||
    nextUrl.pathname.startsWith('/api/user/create') ||
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|webp|ico|mp4|webm)$/)
  ) {
    return NextResponse.next()
  }

  // =======================================================
  // 2. ENVIRONMENT & DOMAIN CONFIGURATION
  // =======================================================
  const isDevelopment = process.env.NODE_ENV === 'development'
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || (isDevelopment ? 'localhost' : 'qlinichealth.com')
  
  // Extract subdomain
  const hostnameWithoutPort = hostname.split(':')[0]
  const parts = hostnameWithoutPort.split('.')
  let currentSubdomain = null
  
  if (isDevelopment) {
    // localhost:3000, user.localhost:3000, etc.
    if (parts.length === 2 && parts[1] === 'localhost') {
      currentSubdomain = parts[0]
    }
  } else {
    // qlinichealth.com, user.qlinichealth.com, etc.
    if (parts.length >= 3) {
      currentSubdomain = parts[0]
    }
  }

  const isMainDomain = !currentSubdomain || currentSubdomain === 'www'

  // =======================================================
  // 3. ROLE MAPPINGS
  // =======================================================
  const subdomainToRole = {
    'admin': 'admin',
    'hospital': 'hospital_admin',
    'doctor': 'doctor',
    'user': 'user'
  }

  const roleToSubdomain = {
    'admin': 'admin',
    'hospital_admin': 'hospital',
    'doctor': 'doctor',
    'user': 'user'
  }

  const currentRoleContext = subdomainToRole[currentSubdomain]

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
  // 5. PATH DEFINITIONS
  // =======================================================
  const authPaths = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/auth/error', '/unauthorized']
  
  // Public paths ONLY on main domain
  const mainDomainPublicPaths = [
    '/',
    '/aboutus',
    '/privacy',
    '/terms',
    '/for-patients',
    '/for-clinics',
    '/why-qlinic',
    '/doctor-bot'
  ]

  const isAuthPath = authPaths.some(path => nextUrl.pathname.startsWith(path))
  const isPublicPath = mainDomainPublicPaths.some(path => nextUrl.pathname === path)

  // =======================================================
  // 6. MAIN DOMAIN LOGIC
  // =======================================================
  if (isMainDomain) {
    // ✅ NEW: Path-based redirects (this should come FIRST)
    const pathParts = nextUrl.pathname.split('/')
    const firstPathSegment = pathParts[1]
    
    const pathToSubdomain = {
      'doctor': 'doctor',
      'hospital': 'hospital',
      'user': 'user',
      'admin': 'admin'
    }

    if (pathToSubdomain[firstPathSegment]) {
      const targetSubdomain = pathToSubdomain[firstPathSegment]
      const port = isDevelopment ? ':3000' : ''
      const protocol = isDevelopment ? 'http' : 'https'
      const cleanPath = nextUrl.pathname.replace(`/${firstPathSegment}`, '') || '/'
      
      // Redirect to subdomain
      const targetUrl = `${protocol}://${targetSubdomain}.${mainDomain}${port}${cleanPath}${nextUrl.search}`
      return NextResponse.redirect(targetUrl)
    }

    // Allow public paths without login
    if (isPublicPath || isAuthPath) {
      return NextResponse.next()
    }

    // If logged in user tries to access main domain (not public/auth)
    if (isLoggedIn && userRole) {
      const targetSubdomain = roleToSubdomain[userRole]
      if (targetSubdomain) {
        const port = isDevelopment ? ':3000' : ''
        const protocol = isDevelopment ? 'http' : 'https'
        const targetUrl = `${protocol}://${targetSubdomain}.${mainDomain}${port}${nextUrl.pathname}${nextUrl.search}`
        return NextResponse.redirect(targetUrl)
      }
    }

    // Not logged in, trying to access protected route on main domain
    if (!isLoggedIn && !isPublicPath && !isAuthPath) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
  }

  // =======================================================
  // 7. SUBDOMAIN LOGIC (user, doctor, hospital, admin)
  // =======================================================
  if (currentRoleContext) {
    
    // A. Allow auth paths on subdomains
    if (isAuthPath) {
      return NextResponse.next()
    }

    // B. Not logged in? Redirect to sign-in with role context
    if (!isLoggedIn) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('role', currentRoleContext)
      signInUrl.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // ✅ FIX: Only enforce role correction if NOT coming from path redirect
    // Check if this is a fresh arrival from path redirect
    const referer = req.headers.get('referer') || ''
    const isFreshPathRedirect = referer.includes(mainDomain) && 
                               (referer.includes('/doctor') || 
                                referer.includes('/hospital') || 
                                referer.includes('/admin') || 
                                referer.includes('/user'))

    if (userRole !== currentRoleContext && !isFreshPathRedirect) {
      const correctSubdomain = roleToSubdomain[userRole]
      if (correctSubdomain) {
        const port = isDevelopment ? ':3000' : ''
        const protocol = isDevelopment ? 'http' : 'https'
        const targetUrl = `${protocol}://${correctSubdomain}.${mainDomain}${port}${nextUrl.pathname}${nextUrl.search}`
        return NextResponse.redirect(targetUrl)
      }
      
      // If no mapping, redirect to main domain
      const port = isDevelopment ? ':3000' : ''
      const protocol = isDevelopment ? 'http' : 'https'
      return NextResponse.redirect(`${protocol}://${mainDomain}${port}`)
    }

    // D. Correct subdomain + correct role = Rewrite to role folder
    const roleFolder = currentRoleContext === 'hospital_admin' ? 'hospital' : currentRoleContext
    const isApiRoute = nextUrl.pathname.startsWith('/api/')
    const isAlreadyPrefixed = nextUrl.pathname.startsWith(`/${roleFolder}`)

    if (!isApiRoute && !isAlreadyPrefixed && !isAuthPath) {
      const url = nextUrl.clone()
      url.pathname = `/${roleFolder}${nextUrl.pathname}`
      return NextResponse.rewrite(url)
    }

    return NextResponse.next()
  }

  // =======================================================
  // 8. FALLBACK - Unknown subdomain
  // =======================================================
  if (currentSubdomain) {
    const port = isDevelopment ? ':3000' : ''
    const protocol = isDevelopment ? 'http' : 'https'
    return NextResponse.redirect(`${protocol}://${mainDomain}${port}`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|mp4|webm)).*)',
  ],
}
