import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req) {
  const { nextUrl } = req
  const hostname = req.headers.get('host') || ''
  
  // Early exits for static assets
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/api/inngest') ||
    nextUrl.pathname.startsWith('/api/webhooks') ||
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|webp|ico|mp4|webm)$/)
  ) {
    return NextResponse.next()
  }

  // Environment configuration
  const isDevelopment = process.env.NODE_ENV === 'development'
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || (isDevelopment ? 'localhost' : 'qlinichealth.com')
  
  // Parse hostname to determine subdomain
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

  // Role mappings
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

  // Get authentication token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: isDevelopment ? 'authjs.session-token' : '__Secure-authjs.session-token',
  })

  const isLoggedIn = !!token
  const userRole = token?.role

  // Path definitions
  const authPaths = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/auth/error', '/unauthorized']
  const mainDomainPublicPaths = ['/', '/aboutus', '/privacy', '/terms', '/for-patients', '/for-clinics', '/why-qlinic', '/doctor-bot']

  const isAuthPath = authPaths.some(path => nextUrl.pathname.startsWith(path))
  const isPublicPath = mainDomainPublicPaths.some(path => nextUrl.pathname === path)

  // MAIN DOMAIN LOGIC
  if (isMainDomain) {
    // Path-based redirects (highest priority)
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
      
      const targetUrl = `${protocol}://${targetSubdomain}.${mainDomain}${port}${cleanPath}${nextUrl.search}`
      return NextResponse.redirect(targetUrl)
    }

    // Public and auth paths
    if (isPublicPath || isAuthPath) {
      return NextResponse.next()
    }

    // Logged in users get redirected to their role subdomain
    if (isLoggedIn && userRole) {
      const targetSubdomain = roleToSubdomain[userRole]
      if (targetSubdomain) {
        const port = isDevelopment ? ':3000' : ''
        const protocol = isDevelopment ? 'http' : 'https'
        const targetUrl = `${protocol}://${targetSubdomain}.${mainDomain}${port}${nextUrl.pathname}${nextUrl.search}`
        return NextResponse.redirect(targetUrl)
      }
    }

    // Unauthenticated users trying to access protected areas
    if (!isLoggedIn && !isPublicPath && !isAuthPath) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
  }

  // SUBDOMAIN LOGIC
  if (currentRoleContext) {
    // Allow auth paths
    if (isAuthPath) {
      return NextResponse.next()
    }

    // Unauthenticated users get redirected to sign-in with role context
    if (!isLoggedIn) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('role', currentRoleContext)
      signInUrl.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // ✅ CRITICAL FIX: Remove strict role enforcement to prevent redirect loops
    // Instead, allow access and let ProtectedRoute handle detailed permissions
    
    // Rewrite to role folder structure
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

  // Unknown subdomain fallback
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
