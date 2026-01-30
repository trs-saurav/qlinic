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
    // ✅ FIX: Path-based Subdomain Redirection
    // If on main domain and path is /doctor, /hospital, etc., redirect to subdomain
    const pathParts = nextUrl.pathname.split('/')
    const firstPath = pathParts[1]
    
    const pathToSubdomain = {
      'doctor': 'doctor',
      'hospital': 'hospital',
      'user': 'user',
      'admin': 'admin'
    }

    if (pathToSubdomain[firstPath]) {
      const targetSubdomain = pathToSubdomain[firstPath]
      const port = isDevelopment ? ':3000' : ''
      const protocol = isDevelopment ? 'http' : 'https'
      
      // Strip the prefix from the path (e.g., /doctor/profile -> /profile)
      const cleanPath = nextUrl.pathname.replace(`/${firstPath}`, '') || '/'
      const targetUrl = `${protocol}://${targetSubdomain}.${mainDomain}${port}${cleanPath}${nextUrl.search}`
      
      return NextResponse.redirect(targetUrl)
    }

    if (isPublicPath || isAuthPath) {
      return NextResponse.next()
    }

    // Redirect logged in users to their dashboard if they hit qlinichealth.com/
    if (isLoggedIn && userRole) {
      const targetSubdomain = roleToSubdomain[userRole]
      if (targetSubdomain) {
        const port = isDevelopment ? ':3000' : ''
        const protocol = isDevelopment ? 'http' : 'https'
        return NextResponse.redirect(`${protocol}://${targetSubdomain}.${mainDomain}${port}${nextUrl.pathname}${nextUrl.search}`)
      }
    }

    // Default protection for any other path on main domain
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
    // ✅ FIX: Prevent Prefix Duplication
    // If user is on doctor.site.com/doctor, redirect to doctor.site.com/
    const roleFolder = currentRoleContext === 'hospital_admin' ? 'hospital' : currentRoleContext
    if (nextUrl.pathname.startsWith(`/${roleFolder}`)) {
      const cleanUrl = nextUrl.clone()
      cleanUrl.pathname = nextUrl.pathname.replace(`/${roleFolder}`, '') || '/'
      return NextResponse.redirect(cleanUrl)
    }

    if (isAuthPath) return NextResponse.next()

    if (!isLoggedIn) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('role', currentRoleContext)
      signInUrl.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Role Enforcement: Redirect to correct subdomain if role doesn't match current context
    if (userRole !== currentRoleContext) {
      const correctSubdomain = roleToSubdomain[userRole]
      const port = isDevelopment ? ':3000' : ''
      const protocol = isDevelopment ? 'http' : 'https'
      
      if (correctSubdomain) {
        return NextResponse.redirect(`${protocol}://${correctSubdomain}.${mainDomain}${port}${nextUrl.pathname}${nextUrl.search}`)
      }
      return NextResponse.redirect(`${protocol}://${mainDomain}${port}`)
    }

    // Final Rewrite to internal role folder
    const isApiRoute = nextUrl.pathname.startsWith('/api/')
    if (!isApiRoute && !nextUrl.pathname.startsWith(`/${roleFolder}`)) {
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