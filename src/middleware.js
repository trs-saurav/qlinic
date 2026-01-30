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
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|webp|ico|mp4|webm)$/)
  ) {
    return NextResponse.next()
  }

  // =======================================================
  // 2. DOMAIN CONFIGURATION (Vercel-Safe Extraction)
  // =======================================================
  const isDevelopment = process.env.NODE_ENV === 'development'
  const mainDomain = "qlinichealth.com"
  
  let currentSubdomain = null
  const host = hostname.replace(':3000', '') // Remove port for local matching

  if (isDevelopment) {
    const parts = host.split('.')
    if (parts.length === 2 && parts[1] === 'localhost') {
      currentSubdomain = parts[0]
    }
  } else {
    // ✅ PRODUCTION FIX: Only extract subdomain if it's on your actual domain
    // Prevents loops on vercel.app preview URLs
    if (host.endsWith(mainDomain) && host !== mainDomain && host !== `www.${mainDomain}`) {
      currentSubdomain = host.replace(`.${mainDomain}`, '').replace('www.', '')
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
  const authPaths = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password']
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

    // Intercept path hits (e.g. qlinichealth.com/doctor)
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

    // Redirect logged in users to their subdomain
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
    
    // Prevent doctor.qlinichealth.com/doctor
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

    // Cross-Role Enforcement
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

    // Rewrite to the folder
    if (!nextUrl.pathname.startsWith('/api/')) {
      const url = nextUrl.clone()
      url.pathname = `/${roleFolder}${nextUrl.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|mp4|webm)).*)'],
}