import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req) {
  const { nextUrl } = req
  const hostname = req.headers.get('host') || ''
  
  // 1. EARLY EXITS (Assets/Auth API)
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|webp|ico|mp4|webm)$/)
  ) {
    return NextResponse.next()
  }

  // 2. DOMAIN CONFIGURATION (Vercel Branch URL safe)
  const isDevelopment = process.env.NODE_ENV === 'development'
  const mainDomain = "qlinichealth.com"
  
  let currentSubdomain = null
  const host = hostname.replace(':3000', '') // Clean local port

  if (isDevelopment) {
    const parts = host.split('.')
    if (parts.length === 2 && parts[1] === 'localhost') {
      currentSubdomain = parts[0]
    }
  } else {
    // ✅ PRODUCTION FIX: Only extract subdomain if the host is your actual custom domain.
    // This ignores internal Vercel URLs like qlinic-6oo8wkjls...vercel.app
    if (host.endsWith(mainDomain) && host !== mainDomain && host !== `www.${mainDomain}`) {
      currentSubdomain = host.replace(`.${mainDomain}`, '').replace('www.', '')
    }
  }

  const isMainDomain = !currentSubdomain || currentSubdomain === 'www'

  // 3. ROLE MAPPINGS
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

  // 4. AUTHENTICATION (Hardened for HTTPS/Production)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    // Production Secure Cookie Check
    cookieName: isDevelopment ? 'authjs.session-token' : '__Secure-authjs.session-token',
  })

  const isLoggedIn = !!token
  const userRole = token?.role

  // 5. PATH DEFINITIONS
  const authPaths = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password']
  const mainDomainPublicPaths = ['/', '/aboutus', '/privacy', '/terms', '/for-patients', '/for-clinics', '/why-qlinic', '/doctor-bot']
  const isAuthPath = authPaths.some(path => nextUrl.pathname.startsWith(path))
  const isPublicPath = mainDomainPublicPaths.some(path => nextUrl.pathname === path)

  // 6. MAIN DOMAIN LOGIC
  if (isMainDomain) {
    const firstPath = nextUrl.pathname.split('/')[1]
    const pathToSub = { 'doctor': 'doctor', 'hospital': 'hospital', 'user': 'user', 'admin': 'admin' }

    // Intercept paths (e.g. qlinichealth.com/doctor -> doctor.qlinichealth.com)
    if (pathToSub[firstPath]) {
      const targetSub = pathToSub[firstPath]
      const protocol = isDevelopment ? 'http' : 'https'
      const port = isDevelopment ? ':3000' : ''
      const cleanPath = nextUrl.pathname.replace(`/${firstPath}`, '') || '/'
      return NextResponse.redirect(new URL(`${protocol}://${targetSub}.${mainDomain}${port}${cleanPath}${nextUrl.search}`))
    }

    if (isPublicPath || isAuthPath) return NextResponse.next()

    // Redirect logged in user to their dashboard
    if (isLoggedIn && userRole) {
      const target = roleToSubdomain[userRole]
      if (target) {
        const protocol = isDevelopment ? 'http' : 'https'
        const port = isDevelopment ? ':3000' : ''
        return NextResponse.redirect(new URL(`${protocol}://${target}.${mainDomain}${port}/`))
      }
    }
    return NextResponse.next()
  }

  // 7. SUBDOMAIN LOGIC
  if (currentRoleContext) {
    const roleFolder = currentRoleContext === 'hospital_admin' ? 'hospital' : currentRoleContext
    
    // Prevent URL path duplication
    if (nextUrl.pathname.startsWith(`/${roleFolder}`)) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    if (isAuthPath) return NextResponse.next()

    // Auth Guard
    if (!isLoggedIn) {
      const loginUrl = new URL('/sign-in', req.url)
      loginUrl.searchParams.set('role', currentRoleContext)
      return NextResponse.redirect(loginUrl)
    }

    // Role Enforcement (If on wrong subdomain, move to correct one)
    if (userRole !== currentRoleContext) {
      const correct = roleToSubdomain[userRole]
      const protocol = isDevelopment ? 'http' : 'https'
      const port = isDevelopment ? ':3000' : ''
      if (correct) {
        return NextResponse.redirect(new URL(`${protocol}://${correct}.${mainDomain}${port}/`))
      }
      return NextResponse.redirect(new URL(`${protocol}://${mainDomain}${port}`))
    }

    // Internal Rewrite
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