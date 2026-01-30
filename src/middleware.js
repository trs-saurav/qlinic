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
  
  const hostnameWithoutPort = hostname.split(':')[0]
  const parts = hostnameWithoutPort.split('.')
  let currentSubdomain = null
  
  if (isDevelopment) {
    if (parts.length === 2 && parts[1] === 'localhost') {
      currentSubdomain = parts[0]
    }
  } else {
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
  const mainDomainPublicPaths = ['/', '/aboutus', '/privacy', '/terms', '/for-patients', '/for-clinics', '/why-qlinic', '/doctor-bot']

  const isAuthPath = authPaths.some(path => nextUrl.pathname.startsWith(path))
  const isPublicPath = mainDomainPublicPaths.some(path => nextUrl.pathname === path)

 // =======================================================
  // 6. MAIN DOMAIN LOGIC
  // =======================================================
  if (isMainDomain) {
    const pathParts = nextUrl.pathname.split('/')
    const firstPath = pathParts[1]
    
    const pathToSubdomain = {
      'doctor': 'doctor',
      'hospital': 'hospital',
      'user': 'user',
      'admin': 'admin'
    }

    // ✅ PRIORITY 1: Explicit Path Redirect (Overrides Login Logic)
    if (pathToSubdomain[firstPath]) {
      const targetSub = pathToSubdomain[firstPath]
      const protocol = isDevelopment ? 'http' : 'https'
      const port = isDevelopment ? ':3000' : ''
      const cleanPath = nextUrl.pathname.replace(`/${firstPath}`, '') || '/'
      
      return NextResponse.redirect(
        new URL(`${protocol}://${targetSub}.${mainDomain}${port}${cleanPath}${nextUrl.search}`)
      )
    }

    // ✅ PRIORITY 2: Public & Auth Paths
    if (isPublicPath || isAuthPath) {
      return NextResponse.next()
    }

    // ✅ PRIORITY 3: Logged in user hitting the root qlinichealth.com/
    if (isLoggedIn && userRole) {
      const targetSubdomain = roleToSubdomain[userRole]
      if (targetSubdomain) {
        const protocol = isDevelopment ? 'http' : 'https'
        const port = isDevelopment ? ':3000' : ''
        return NextResponse.redirect(
          new URL(`${protocol}://${targetSubdomain}.${mainDomain}${port}${nextUrl.pathname}${nextUrl.search}`)
        )
      }
    }

    // ✅ PRIORITY 4: Catch-all Protection
    if (!isLoggedIn && !isPublicPath) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
  }

  // =======================================================
  // 7. SUBDOMAIN LOGIC
  // =======================================================
  if (currentRoleContext) {
    const roleFolder = currentRoleContext === 'hospital_admin' ? 'hospital' : currentRoleContext
    
    // 🛑 Prevent Recursion: If on doctor.site.com/doctor, strip the path
    if (nextUrl.pathname.startsWith(`/${roleFolder}`)) {
      const cleanUrl = nextUrl.clone()
      cleanUrl.pathname = nextUrl.pathname.replace(`/${roleFolder}`, '') || '/'
      return NextResponse.redirect(cleanUrl)
    }

    if (isAuthPath) return NextResponse.next()

    // Authentication Guard
    if (!isLoggedIn) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('role', currentRoleContext)
      signInUrl.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // ✅ Strict Role Enforcement (Fixes the Production Defaulting to 'User')
    if (userRole !== currentRoleContext) {
      const correctSub = roleToSubdomain[userRole]
      const protocol = isDevelopment ? 'http' : 'https'
      const port = isDevelopment ? ':3000' : ''
      
      // If they are on the wrong subdomain, send them to the right one
      if (correctSub) {
        return NextResponse.redirect(
          new URL(`${protocol}://${correctSub}.${mainDomain}${port}${nextUrl.pathname}${nextUrl.search}`)
        )
      }
      // If role is unknown, send to main domain
      return NextResponse.redirect(new URL(`${protocol}://${mainDomain}${port}`))
    }

    // Internal Rewrite
    if (!nextUrl.pathname.startsWith('/api/') && !nextUrl.pathname.startsWith(`/${roleFolder}`)) {
      const url = nextUrl.clone()
      url.pathname = `/${roleFolder}${nextUrl.pathname}`
      return NextResponse.rewrite(url)
    }
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