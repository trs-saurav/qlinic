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

  // 3. ROOT DOMAIN SHORTCUTS
  // Redirect qlinichealth.com/doctor -> doctor.qlinichealth.com/doctor
  if (!currentSubdomain || currentSubdomain === 'www') {
     const pathSegment = nextUrl.pathname.split('/')[1]; 
     const validSubdomains = ['doctor', 'hospital', 'admin', 'user'];

     if (validSubdomains.includes(pathSegment)) {
        const protocol = isDevelopment ? 'http' : 'https';
        const port = isDevelopment ? ':3000' : '';
        const domainClean = rootDomain.replace(':3000', '');
        
        // Keep the pathSegment in the URL so it lands on /doctor/dashboard correctly
        const newUrl = `${protocol}://${pathSegment}.${domainClean}${port}${nextUrl.pathname}${nextUrl.search}`;
        
        return NextResponse.redirect(newUrl);
     }
  }

  // 4. GET SESSION
  let token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, cookieName: '__Secure-authjs.session-token' })
  if (!token) token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, cookieName: 'authjs.session-token' })

  // Helper: Map 'hospital' subdomain to 'hospital_admin' role
  const getRoleFromSubdomain = (sub) => {
    if (sub === 'hospital') return 'hospital_admin';
    return sub; 
  };
  
  const currentRoleScope = getRoleFromSubdomain(currentSubdomain); 
  const appFolder = currentSubdomain === 'hospital' ? '/hospital' : `/${currentSubdomain}`;

  // -------------------------------------------------------------
  // A. NO SESSION -> Protect ONLY the App Folder
  // -------------------------------------------------------------
  if (!token) {
    const isSignInPage = nextUrl.pathname.startsWith('/sign-in');
    const isAppPath = nextUrl.pathname.startsWith(appFolder); // e.g., starts with /user

    // Only force login if they are trying to access /user/* on user.com
    if (currentSubdomain && currentSubdomain !== 'www' && !isSignInPage && isAppPath) {
       const url = new URL('/sign-in', req.url)
       url.searchParams.set('role', currentRoleScope)
       url.searchParams.set('redirect', nextUrl.pathname)
       return NextResponse.redirect(url)
    }

    // Inject role into /sign-in URL if missing
    if (currentSubdomain && currentSubdomain !== 'www' && isSignInPage && !nextUrl.searchParams.has('role')) {
       const url = new URL(req.url)
       url.searchParams.set('role', currentRoleScope)
       return NextResponse.redirect(url)
    }
    
    // If not logged in and not accessing App Folder, we let it fall through to the Rewrite logic below
  }

  // -------------------------------------------------------------
  // B. LOGGED IN -> Enforce Role ONLY on App Folder
  // -------------------------------------------------------------
  if (token) {
      const role = token.role || 'user'
      const roleSubdomainMap = { 'doctor': 'doctor', 'hospital_admin': 'hospital', 'admin': 'admin', 'user': 'user' }
      const correctSubdomain = roleSubdomainMap[role] || 'user'

      if (currentSubdomain !== correctSubdomain) {
          if (nextUrl.pathname.startsWith('/sign-in')) return NextResponse.next();
          
          const isAppPath = nextUrl.pathname.startsWith(appFolder);
          
          // Only block if trying to access the restricted app folder
          if (isAppPath) {
            const url = new URL('/sign-in', req.url)
            url.searchParams.set('role', currentRoleScope)
            url.searchParams.set('redirect', nextUrl.pathname)
            return NextResponse.redirect(url)
          }
      }
  }

  // -------------------------------------------------------------
  // ✅ FIX: STRICT ISOLATION REWRITE
  // -------------------------------------------------------------
  if (currentSubdomain && currentSubdomain !== 'www') {
    // 1. Allow Sign-In/Sign-Up (Shared Pages available at root)
    if (nextUrl.pathname.startsWith('/sign-in') || nextUrl.pathname.startsWith('/sign-up')) {
        return NextResponse.next();
    }

    // 2. Allow App Folder Paths (e.g. /doctor/dashboard)
    // Next.js will find these in app/doctor/...
    if (nextUrl.pathname.startsWith(appFolder)) {
        return NextResponse.next();
    }
    
    // 3. BLOCK EVERYTHING ELSE
    // Rewrite path to /subdomain/path.
    // Example: User visits doctor.com/sustain
    // We rewrite to: /doctor/sustain
    // Since app/doctor/sustain does not exist -> 404 Not Found.
    return NextResponse.rewrite(new URL(`${appFolder}${nextUrl.pathname}`, req.url));
  }

  return NextResponse.next()
}