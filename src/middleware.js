import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req) {
  const { nextUrl } = req
  const hostHeader = req.headers.get('host') || ''
  
  // 1. EARLY EXITS
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|webp|ico|mp4|webm)$/)
  ) {
    return NextResponse.next()
  }

  // 2. DOMAIN CONFIGURATION
  const isDevelopment = process.env.NODE_ENV === 'development'
  const mainDomain = "qlinichealth.com"
  
  let currentSubdomain = null
  const hostname = hostHeader.split(':')[0] 

  if (isDevelopment) {
    const parts = hostname.split('.')
    if (parts.length === 2 && parts[1] === 'localhost') {
      currentSubdomain = parts[0]
    }
  } else {
    // ✅ PRODUCTION FIX: Only treat as subdomain if it's your custom domain.
    // Ignores internal Vercel URLs to stop loop chains.
    if (hostname.endsWith(mainDomain) && hostname !== mainDomain && hostname !== `www.${mainDomain}`) {
      currentSubdomain = hostname.replace(`.${mainDomain}`, '').replace('www.', '')
    }
  }

  const isMainDomain = !currentSubdomain || currentSubdomain === 'www'

  // 3. ROLE MAPPINGS
  const subdomainToRole = { admin: 'admin', hospital: 'hospital_admin', doctor: 'doctor', user: 'user' }
  const roleToSubdomain = { admin: 'admin', hospital_admin: 'hospital', doctor: 'doctor', user: 'user' }
  const currentRoleContext = subdomainToRole[currentSubdomain]

  // 4. AUTHENTICATION
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    // Checks for secure production cookie first
    cookieName: isDevelopment ? 'authjs.session-token' : '__Secure-authjs.session-token',
  })

  const isLoggedIn = !!token
  const userRole = token?.role

  // 5. PATH DEFINITIONS
  const authPaths = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password']
  const isAuthPath = authPaths.some(path => nextUrl.pathname.startsWith(path))

  // 6. MAIN DOMAIN LOGIC
  if (isMainDomain) {
    const firstPath = nextUrl.pathname.split('/')[1]
    const pathToSub = { 'doctor': 'doctor', 'hospital': 'hospital', 'user': 'user', 'admin': 'admin' }

    // Intercept paths (qlinichealth.com/doctor -> doctor.qlinichealth.com)
    if (pathToSub[firstPath]) {
      const targetSub = pathToSub[firstPath]
      const protocol = isDevelopment ? 'http' : 'https'
      const port = isDevelopment ? ':3000' : ''
      const cleanPath = nextUrl.pathname.replace(`/${firstPath}`, '') || '/'
      return NextResponse.redirect(new URL(`${protocol}://${targetSub}.${mainDomain}${port}${cleanPath}${nextUrl.search}`))
    }

    // Only redirect logged in users to dashboard if they hit the root "/"
    if (isLoggedIn && userRole && nextUrl.pathname === '/') {
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
    
    // Redirect to login if accessing subdomain without session
    if (!isLoggedIn && !isAuthPath) {
      const loginUrl = new URL('/sign-in', req.url)
      loginUrl.searchParams.set('role', currentRoleContext)
      return NextResponse.redirect(loginUrl)
    }

    // ✅ ANTI-LOOP ROLE ENFORCEMENT
    if (isLoggedIn && userRole !== currentRoleContext) {
      const correctSub = roleToSubdomain[userRole]
      if (correctSub) {
        const protocol = isDevelopment ? 'http' : 'https'
        const port = isDevelopment ? ':3000' : ''
        const targetHost = `${correctSub}.${mainDomain}`
        
        // ONLY redirect if the current hostname is NOT already the target
        if (hostname !== targetHost) {
          return NextResponse.redirect(new URL(`${protocol}://${targetHost}${port}${nextUrl.pathname}${nextUrl.search}`))
        }
      }
    }

    // Internal Rewrite (Ensure no double mapping)
    if (!nextUrl.pathname.startsWith('/api/') && !nextUrl.pathname.startsWith(`/${roleFolder}`)) {
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