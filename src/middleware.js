import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req) {
  const { nextUrl } = req
  const hostname = req.headers.get('host') || ''
  
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/api') || 
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|ico)$/)
  ) {
    return NextResponse.next()
  }

  const isDevelopment = process.env.NODE_ENV === 'development'
  const rootDomain = isDevelopment ? 'localhost:3000' : 'qlinichealth.com'
  
  let currentSubdomain = null
  if (!isDevelopment && hostname !== rootDomain) {
      currentSubdomain = hostname.replace(`.${rootDomain}`, '')
  } else if (isDevelopment && hostname !== 'localhost:3000') {
      currentSubdomain = hostname.split('.')[0]
  }

  // Check for ANY session token
  let token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, cookieName: '__Secure-authjs.session-token' })
  if (!token) token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, cookieName: 'authjs.session-token' })

  const publicPaths = ['/sign-in', '/sign-up', '/aboutus', '/', '/for-patients', '/for-clinics']
  const isPublic = publicPaths.some(path => nextUrl.pathname === path || (path !== '/' && nextUrl.pathname.startsWith(path)))

  // A. NO SESSION -> Redirect to Login (Stay on same subdomain)
  if (!token) {
    const isSignInPage = nextUrl.pathname.startsWith('/sign-in');
    if (currentSubdomain && currentSubdomain !== 'www' && !isSignInPage) {
       const url = new URL('/sign-in', req.url)
       url.searchParams.set('role', currentSubdomain)
       url.searchParams.set('redirect', nextUrl.pathname)
       return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // B. LOGGED IN -> Enforce Role
  if (!currentSubdomain && isPublic) return NextResponse.next()

  const role = token.role || 'user'
  const roleSubdomainMap = { 'doctor': 'doctor', 'hospital_admin': 'hospital', 'admin': 'admin', 'user': 'user' }
  const correctSubdomain = roleSubdomainMap[role] || 'user'

  // If session doesn't match subdomain, it's effectively "Not Logged In" for this specific app.
  // Instead of redirecting to the "Correct" subdomain, we just force them to Sign In on the CURRENT one.
  if (currentSubdomain !== correctSubdomain) {
      if (nextUrl.pathname.startsWith('/sign-in')) return NextResponse.next();
      
      // Force sign-in on the current subdomain to create a new, parallel session
      const url = new URL('/sign-in', req.url)
      url.searchParams.set('role', currentSubdomain)
      url.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(url)
  }

  // C. Correct Subdomain -> Rewrite
  if (currentSubdomain === correctSubdomain) {
    if (nextUrl.pathname.startsWith(`/${correctSubdomain}`)) return NextResponse.next()
    return NextResponse.rewrite(new URL(`/${correctSubdomain}${nextUrl.pathname}`, req.url))
  }

  return NextResponse.next()
}