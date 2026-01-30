import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req) {
  const { nextUrl } = req
  const hostname = req.headers.get('host') || ''
  
  // =======================================================
  // 1. EARLY EXITS - Assets and API routes
  // =======================================================
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|webp|ico|mp4|webm)$/)
  ) {
    return NextResponse.next()
  }

  // =======================================================
  // 2. ENVIRONMENT & DOMAIN CONFIGURATION
  // =======================================================
  const isDevelopment = process.env.NODE_ENV === 'development'
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || (isDevelopment ? 'localhost' : 'qlinichealth.com')
  
  // Robust Subdomain Extraction for Production
  let currentSubdomain = null
  const hostParts = hostname.split('.')
  
  if (isDevelopment) {
    // Local: user.localhost:3000 -> parts are ["user", "localhost:3000"]
    if (hostParts.length === 2 && hostParts[1].startsWith('localhost')) {
      currentSubdomain = hostParts[0]
    }
  } else {
    // Production: user.qlinichealth.com -> parts are ["user", "qlinichealth", "com"]
    // We check if we have more parts than the main domain (which has 2: qlinichealth.com)
    if (hostParts.length >= 3) {
      currentSubdomain = hostParts[0]
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
    // Production uses secure cookies with __Secure- prefix
    cookieName: isDevelopment ? 'authjs.session-token' : '__Secure-authjs.session-token',
  })

  const isLoggedIn = !!token
  const userRole = token?.role

  // =======================================================
  // 5. PATH DEFINITIONS
  // =======================================================
  const authPaths = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password']
  const mainDomainPublicPaths = ['/', '/aboutus', '/privacy', '/terms', '/for-patients', '/for-clinics', '/why-qlinic', '/doctor-bot']

  const isAuthPath = authPaths.some(path => nextUrl.pathname.startsWith(path))
  const isPublicPath = mainDomainPublicPaths.some(path => nextUrl.pathname === path)

  // =======================================================
  // 6. MAIN DOMAIN LOGIC
  // =======================================================
  if (isMainDomain) {
    const firstPath = nextUrl.pathname.split('/')[1]
    const pathToSubdomain = {
      'doctor': 'doctor',
      'hospital': 'hospital',
      'user': 'user',
      'admin': 'admin'
    }

    // ✅ PRIORITY 1: Explicit Path Redirect (Overrides Login Logic)
    // Intercept qlinichealth.com/doctor and move to doctor.qlinichealth.com
    if (pathToSubdomain[firstPath]) {
      const targetSub = pathToSubdomain[firstPath]
      const protocol = isDevelopment ? 'http' : 'https'
      const port = isDevelopment ? ':3000' : ''
      const cleanPath = nextUrl.pathname.replace(`/${firstPath}`, '') || '/'
      
      return NextResponse.redirect(
        new URL(`${protocol}://${targetSub}.${mainDomain}${port}${cleanPath}${nextUrl.search}`)
      )
    }

    if (isPublicPath || isAuthPath) return NextResponse.next()

    // ✅ PRIORITY 2: Logged in user hitting root qlinichealth.com/
    if (isLoggedIn && userRole) {
      const targetSub = roleToSubdomain[userRole]
      if (targetSub) {
        const protocol = isDevelopment ? 'http' : 'https'
        const port = isDevelopment ? ':3000' : ''
        return NextResponse.redirect(
          new URL(`${protocol}://${targetSub}.${mainDomain}${port}${nextUrl.pathname}${nextUrl.search}`)
        )
      }
    }

    // Auth Protection
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
    
    // Prevent URL path duplication (e.g., doctor.site.com/doctor)
    if (nextUrl.pathname.startsWith(`/${roleFolder}`)) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    if (isAuthPath) return NextResponse.next()

    if (!isLoggedIn) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('role', currentRoleContext)
      signInUrl.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // ✅ PRIORITY 3: Cross-Role Protection (Fixed for Production)
    if (userRole !== currentRoleContext) {
      const correctSub = roleToSubdomain[userRole]
      const protocol = isDevelopment ? 'http' : 'https'
      const port = isDevelopment ? ':3000' : ''
      
      if (correctSub) {
        return NextResponse.redirect(
          new URL(`${protocol}://${correctSub}.${mainDomain}${port}${nextUrl.pathname}${nextUrl.search}`)
        )
      }
      return NextResponse.redirect(new URL(`${protocol}://${mainDomain}${port}`))
    }

    // Internal Rewrite to Role Folder
    if (!nextUrl.pathname.startsWith('/api/')) {
      const url = nextUrl.clone()
      url.pathname = `/${roleFolder}${nextUrl.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // =======================================================
  // 8. FALLBACK
  // =======================================================
  if (currentSubdomain) {
    const protocol = isDevelopment ? 'http' : 'https'
    const port = isDevelopment ? ':3000' : ''
    return NextResponse.redirect(new URL(`${protocol}://${mainDomain}${port}`))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|mp4|webm)).*)'],
}