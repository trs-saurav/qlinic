import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const { nextUrl } = req

  // ✅ Public API routes that don't need authentication
  const publicApiPaths = [
    '/api/auth',
    '/api/user/create',
    '/api/user/check',
    '/api/webhooks',
    '/api/inngest',
    '/api/search',
  ]

  // Check if current path is a public API route
  const isPublicApi = publicApiPaths.some(path => 
    nextUrl.pathname.startsWith(path)
  )

  if (isPublicApi) {
   
    return NextResponse.next()
  }

  // Get session token for protected routes
  // Try to read token from all possible cookie names (Auth.js v5 + legacy next-auth)
  const cookieCandidates = [
    '__Secure-authjs.session-token',
    'authjs.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.session-token',
  ]

  let token = null
  for (const cookieName of cookieCandidates) {
    if (req.cookies.get(cookieName)) {
      token = await getToken({
        req,
        secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
        cookieName,
      })
      if (token) break
    }
  }

  // Fallback to default resolution if not found by explicit cookie names
  if (!token) {
    token = await getToken({
      req,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    })
  }
  
  const isLoggedIn = !!token
  const role = token?.role

  // Public page routes
  const publicPaths = [
    '/',
    '/sign-in',
    '/sign-up',
    '/aboutus',
    '/about',
    '/solutions',
    '/contact-us',
    '/search',
    '/privacy',
    '/terms',
    '/unauthorized',
  ]
  
  const isPublicPath = publicPaths.some(path => 
    nextUrl.pathname === path || nextUrl.pathname.startsWith(path + '/')
  )
  
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Protected API routes - require authentication
  if (nextUrl.pathname.startsWith('/api')) {
    if (!isLoggedIn) {
      console.log('❌ Unauthorized API access:', nextUrl.pathname)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }
  
  // Protected page routes
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isSubAdminRoute = nextUrl.pathname.startsWith('/sub-admin')
  const isDoctorRoute = nextUrl.pathname.startsWith('/doctor')
  const isuserRoute = nextUrl.pathname.startsWith('/user')
  const isHospitalAdminRoute = nextUrl.pathname.startsWith('/hospital-admin')

  // Redirect to sign-in if not logged in
  if (!isLoggedIn && (isAdminRoute || isSubAdminRoute || isDoctorRoute || isuserRoute || isHospitalAdminRoute)) {
    const signInUrl = new URL('/sign-in', nextUrl.origin)
    signInUrl.searchParams.set('redirect', nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Role-based access control
  if (isLoggedIn) {
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl))
    }

    if (isSubAdminRoute && !['admin', 'sub_admin'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl))
    }

    if (isDoctorRoute && role !== 'doctor') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl))
    }

    if (isuserRoute && role !== 'user') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl))
    }

    if (isHospitalAdminRoute && role !== 'hospital_admin') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
