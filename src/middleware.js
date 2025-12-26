import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'



// ✅ Public routes (no auth)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/aboutus',
  '/solutions',
  '/contact-us',

  // webhooks / inngest must be public
  '/api/webhooks(.*)',
  '/api/inngest(.*)',
])

// ✅ Protected pages (redirect to sign-in if not authenticated)
const isProtectedPageRoute = createRouteMatcher([
  '/patient(.*)',
  '/doctor(.*)',
  '/hospital-admin(.*)',
  '/admin(.*)',
])

// ✅ Protect ALL APIs by default (return 401 if not authenticated),
// except the explicitly public ones above.
const isApiRoute = createRouteMatcher(['/api(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) return

  // Protect all APIs
  if (isApiRoute(req)) {
    await auth.protect()
    return
  }

  // Protect app pages
  if (isProtectedPageRoute(req)) {
    await auth.protect()
    return
  }

  // Everything else stays public by default
})

export const config = {
  matcher: [
    // match all routes except static files and _next
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
