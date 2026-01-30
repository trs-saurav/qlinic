import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req) {
  const { nextUrl } = req
  const hostname = req.headers.get('host') || ''
  
  console.log('\n=== MIDDLEWARE EXECUTION START ===')
  console.log('🌐 Full URL:', req.url)
  console.log('🏠 Hostname:', hostname)
  console.log('📍 Pathname:', nextUrl.pathname)
  console.log('🔍 Search Params:', nextUrl.search)
  
  // =======================================================
  // 1. EARLY EXITS - Static assets, auth API, etc.
  // =======================================================
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/api/inngest') ||
    nextUrl.pathname.startsWith('/api/webhooks') ||
    nextUrl.pathname.startsWith('/api/user/check') ||
    nextUrl.pathname.startsWith('/api/user/create') ||
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|webp|ico|mp4|webm)$/)
  ) {
    console.log('⏭️  Early exit - static asset or API route')
    return NextResponse.next()
  }

  // =======================================================
  // 2. ENVIRONMENT & DOMAIN CONFIGURATION
  // =======================================================
  const isDevelopment = process.env.NODE_ENV === 'development'
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || (isDevelopment ? 'localhost' : 'qlinichealth.com')
  
  console.log('⚙️  Environment:', {
    isDevelopment,
    mainDomain
  })
  
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
  
  console.log('🏷️  Domain Analysis:', {
    hostnameWithoutPort,
    parts,
    currentSubdomain,
    isMainDomain
  })

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
  
  console.log('👥 Role Context:', {
    currentRoleContext,
    subdomainToRoleMapping: subdomainToRole
  })

  // =======================================================
  // 4. AUTHENTICATION
  // =======================================================
  console.log('🔐 Getting token...')
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: isDevelopment ? 'authjs.session-token' : '__Secure-authjs.session-token',
  })

  const isLoggedIn = !!token
  const userRole = token?.role
  
  console.log('🎟️  Auth Status:', {
    isLoggedIn,
    userRole,
    tokenExists: !!token,
    tokenPreview: token ? `${JSON.stringify(token).substring(0, 100)}...` : null
  })

  // =======================================================
  // 5. PATH DEFINITIONS
  // =======================================================
  const authPaths = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/auth/error', '/unauthorized']
  const mainDomainPublicPaths = ['/', '/aboutus', '/privacy', '/terms', '/for-patients', '/for-clinics', '/why-qlinic', '/doctor-bot']

  const isAuthPath = authPaths.some(path => nextUrl.pathname.startsWith(path))
  const isPublicPath = mainDomainPublicPaths.some(path => nextUrl.pathname === path)
  
  console.log('🛣️  Path Analysis:', {
    isAuthPath,
    isPublicPath,
    authPaths,
    mainDomainPublicPaths
  })

  // =======================================================
  // 6. MAIN DOMAIN LOGIC
  // =======================================================
  if (isMainDomain) {
    console.log('🏢 Processing Main Domain Logic')
    const pathParts = nextUrl.pathname.split('/')
    const firstPath = pathParts[1]
    
    console.log('🧭 First path segment:', firstPath)
    
    const pathToSubdomain = {
      'doctor': 'doctor',
      'hospital': 'hospital',
      'user': 'user',
      'admin': 'admin'
    }

    // ✅ PRIORITY 1: Explicit Path Redirect (Overrides Login Logic)
    if (pathToSubdomain[firstPath]) {
      const targetSub = pathToSubdomain[firstPath]
      const protocol = isDevelopment ? 'http' : 'https'
      const port = isDevelopment ? ':3000' : ''
      const cleanPath = nextUrl.pathname.replace(`/${firstPath}`, '') || '/'
      
      console.log('🎯 PATH REDIRECT TRIGGERED:', {
        fromPath: nextUrl.pathname,
        toSubdomain: targetSub,
        fullPath: `${protocol}://${targetSub}.${mainDomain}${port}${cleanPath}${nextUrl.search}`
      })
      
      // Create redirect response with proper headers
      const redirectUrl = new URL(`${protocol}://${targetSub}.${mainDomain}${port}${cleanPath}${nextUrl.search}`)
      const response = NextResponse.redirect(redirectUrl)
      
      // Add header to indicate this was a path-based redirect
      response.headers.set('x-path-redirect', 'true')
      
      console.log('✅ Returning path redirect response')
      return response
    }

    // ✅ PRIORITY 2: Public & Auth Paths
    if (isPublicPath || isAuthPath) {
      console.log('📄 Public/Auth path - allowing through')
      return NextResponse.next()
    }

    // ✅ PRIORITY 3: Logged in user hitting the root qlinichealth.com/
    if (isLoggedIn && userRole) {
      const targetSubdomain = roleToSubdomain[userRole]
      if (targetSubdomain) {
        const protocol = isDevelopment ? 'http' : 'https'
        const port = isDevelopment ? ':3000' : ''
        
        // Check if we're already on the correct subdomain via path redirect
        const pathRedirectHeader = req.headers.get('x-path-redirect')
        console.log('🔁 Checking path redirect header:', pathRedirectHeader)
        
        if (pathRedirectHeader !== 'true') {
          const redirectDestination = `${protocol}://${targetSubdomain}.${mainDomain}${port}${nextUrl.pathname}${nextUrl.search}`
          console.log('👤 User role redirect:', {
            userRole,
            targetSubdomain,
            redirectDestination
          })
          
          return NextResponse.redirect(
            new URL(redirectDestination)
          )
        } else {
          console.log('⏭️  Skipping role redirect due to path redirect header')
        }
      }
    }

    // ✅ PRIORITY 4: Catch-all Protection
    if (!isLoggedIn && !isPublicPath) {
      console.log('🔒 Unauthenticated access to protected area')
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    console.log('➡️  Falling through to NextResponse.next()')
    return NextResponse.next()
  }

  // =======================================================
  // 7. SUBDOMAIN LOGIC
  // =======================================================
  console.log('🏢 Processing Subdomain Logic')
  if (currentRoleContext) {
    console.log('🎭 Current role context:', currentRoleContext)
    const roleFolder = currentRoleContext === 'hospital_admin' ? 'hospital' : currentRoleContext
    
    console.log('📁 Role folder mapping:', {
      originalRole: currentRoleContext,
      roleFolder
    })
    
    // 🛑 Prevent Recursion: If on doctor.site.com/doctor, strip the path
    if (nextUrl.pathname.startsWith(`/${roleFolder}`)) {
      console.log('🌀 Preventing recursion - stripping role folder from path')
      const cleanUrl = nextUrl.clone()
      cleanUrl.pathname = nextUrl.pathname.replace(`/${roleFolder}`, '') || '/'
      console.log('🧹 Cleaned path:', cleanUrl.pathname)
      return NextResponse.redirect(cleanUrl)
    }

    if (isAuthPath) {
      console.log('🔑 Auth path on subdomain - allowing through')
      return NextResponse.next()
    }

    // Authentication Guard
    if (!isLoggedIn) {
      console.log('🔒 Unauthenticated on subdomain - redirecting to sign-in')
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('role', currentRoleContext)
      signInUrl.searchParams.set('redirect', nextUrl.pathname)
      console.log('📍 Sign-in params:', {
        role: currentRoleContext,
        redirect: nextUrl.pathname
      })
      return NextResponse.redirect(signInUrl)
    }

    // ✅ Skip Role Enforcement for Path-Based Redirects
    const pathRedirectHeader = req.headers.get('x-path-redirect')
    console.log('🚦 Path redirect header check:', pathRedirectHeader)
    
    if (pathRedirectHeader !== 'true') {
      console.log('👮‍♂️ Checking role enforcement...')
      // Strict Role Enforcement (Fixes the Production Defaulting to 'User')
      if (userRole !== currentRoleContext) {
        console.log('⚠️  Role mismatch detected:', {
          userRole,
          currentRoleContext,
          expectedRole: currentRoleContext
        })
        
        const correctSub = roleToSubdomain[userRole]
        const protocol = isDevelopment ? 'http' : 'https'
        const port = isDevelopment ? ':3000' : ''
        
        console.log('🔄 Role correction data:', {
          correctSub,
          roleToSubdomain,
          userRole
        })
        
        // If they are on the wrong subdomain, send them to the right one
        if (correctSub) {
          const redirectUrl = `${protocol}://${correctSub}.${mainDomain}${port}${nextUrl.pathname}${nextUrl.search}`
          console.log('🔁 Redirecting to correct role subdomain:', redirectUrl)
          return NextResponse.redirect(
            new URL(redirectUrl)
          )
        }
        // If role is unknown, send to main domain
        console.log('🏠 Redirecting to main domain due to unknown role')
        return NextResponse.redirect(new URL(`${protocol}://${mainDomain}${port}`))
      } else {
        console.log('✅ Role matches context - proceeding')
      }
    } else {
      console.log('⏭️  Skipping role enforcement due to path redirect')
    }

    // Internal Rewrite
    if (!nextUrl.pathname.startsWith('/api/') && !nextUrl.pathname.startsWith(`/${roleFolder}`)) {
      console.log('📝 Rewriting path to include role folder')
      const url = nextUrl.clone()
      url.pathname = `/${roleFolder}${nextUrl.pathname}`
      console.log('✏️  New pathname:', url.pathname)
      return NextResponse.rewrite(url)
    }
    
    console.log('➡️  Subdomain logic completed - allowing through')
  }
  
  // =======================================================
  // 8. FALLBACK - Unknown subdomain
  // =======================================================
  if (currentSubdomain) {
    console.log('❓ Unknown subdomain - redirecting to main domain')
    const port = isDevelopment ? ':3000' : ''
    const protocol = isDevelopment ? 'http' : 'https'
    return NextResponse.redirect(`${protocol}://${mainDomain}${port}`)
  }

  console.log('🔚 End of middleware - returning NextResponse.next()')
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|mp4|webm)).*)',
  ],
}
