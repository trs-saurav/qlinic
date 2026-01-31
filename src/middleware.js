import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req) {
  const { nextUrl } = req
  const hostname = req.headers.get('host') || ''
  
  // 1. SKIP STATIC FILES & API
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/api') || 
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|ico)$/)
  ) {
    return NextResponse.next()
  }

  // 2. CONFIG
  const isDevelopment = process.env.NODE_ENV === 'development'
  const rootDomain = isDevelopment ? 'localhost:3000' : 'qlinichealth.com'
  
  // Extract subdomain
  let currentSubdomain = null
  if (!isDevelopment && hostname !== rootDomain) {
      currentSubdomain = hostname.replace(`.${rootDomain}`, '')
  } else if (isDevelopment && hostname !== 'localhost:3000') {
      currentSubdomain = hostname.split('.')[0]
  }

  // 3. GET SESSION (Robust Check)
  let token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: '__Secure-authjs.session-token', 
  })

  if (!token) {
     token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: 'authjs.session-token', 
    })
  }

  // 4. PUBLIC PATHS
  const publicPaths = ['/sign-in', '/sign-up', '/aboutus', '/', '/for-patients', '/for-clinics']
  const isPublic = publicPaths.some(path => nextUrl.pathname === path || (path !== '/' && nextUrl.pathname.startsWith(path)))

  // -------------------------------------------------------------
  // ✅ SCENARIO A: NO SESSION (NOT LOGGED IN)
  // -------------------------------------------------------------
  if (!token) {
    // FIX: Only redirect to sign-in if we are NOT ALREADY there!
    // This prevents the "Too Many Redirects" loop on doctor.localhost
    const isSignInPage = nextUrl.pathname.startsWith('/sign-in');
    
    if (currentSubdomain && currentSubdomain !== 'www' && !isSignInPage) {
       const url = new URL('/sign-in', req.url)
       url.searchParams.set('role', currentSubdomain)
       url.searchParams.set('redirect', nextUrl.pathname)
       return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------------
  // ✅ SCENARIO B: LOGGED IN (ROLE ROUTING)
  // -------------------------------------------------------------
  
  // Allow Landing Page Access on Root Domain
  if (!currentSubdomain && isPublic) {
    return NextResponse.next()
  }

  const role = token.role || 'user'
  
  const roleSubdomainMap = {
    'doctor': 'doctor',
    'hospital_admin': 'hospital',
    'admin': 'admin',
    'user': 'user'
  }
  
  const correctSubdomain = roleSubdomainMap[role] || 'user'

  // CHECK 1: WRONG SUBDOMAIN
  if (currentSubdomain !== correctSubdomain) {
      const protocol = isDevelopment ? 'http' : 'https'
      const port = isDevelopment ? ':3000' : ''
      const newUrl = `${protocol}://${correctSubdomain}.${rootDomain.replace(':3000','')}${port}${nextUrl.pathname}`
      return NextResponse.redirect(newUrl)
  }

  // CHECK 2: CORRECT SUBDOMAIN REWRITE
  if (currentSubdomain === correctSubdomain) {
    if (nextUrl.pathname.startsWith(`/${correctSubdomain}`)) {
        return NextResponse.next()
    }
    return NextResponse.rewrite(
        new URL(`/${correctSubdomain}${nextUrl.pathname}`, req.url)
    )
  }

  return NextResponse.next()
}