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

  // -------------------------------------------------------------
  // 3. ✅ ROOT DOMAIN SHORTCUTS (Placed Here)
  // -------------------------------------------------------------
  // Allows users to type "qlinichealth.com/doctor" and get sent to "doctor.qlinichealth.com"
  if (!currentSubdomain || currentSubdomain === 'www') {
     const pathSegment = nextUrl.pathname.split('/')[1]; // Gets 'doctor' from '/doctor/dashboard'
     const validSubdomains = ['doctor', 'hospital', 'admin', 'user'];

     if (validSubdomains.includes(pathSegment)) {
        const protocol = isDevelopment ? 'http' : 'https';
        const port = isDevelopment ? ':3000' : '';
        
        // Remove the segment from the path (e.g., /doctor/dashboard -> /dashboard)
        const newPath = nextUrl.pathname.replace(`/${pathSegment}`, '') || '/';
        const domainClean = rootDomain.replace(':3000', '');

        // Construct new URL: https://doctor.qlinichealth.com/dashboard
        const newUrl = `${protocol}://${pathSegment}.${domainClean}${port}${newPath}${nextUrl.search}`;
        
        return NextResponse.redirect(newUrl);
     }
  }

  // 4. GET SESSION
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

  // If session doesn't match subdomain, allow sign-in page (Escape Hatch) or force login on current domain
  if (currentSubdomain !== correctSubdomain) {
      if (nextUrl.pathname.startsWith('/sign-in')) return NextResponse.next();
      
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