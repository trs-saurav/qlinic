import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// ✅ Only truly public routes (no auth needed)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/aboutus",
  "/solutions",
  "/contact-us",
  "/api/webhooks(.*)",
  "/api/inngest(.*)",
]);

// ✅ Protected API routes (return JSON errors, not redirects)
const isProtectedApiRoute = createRouteMatcher([
  "/api/hospital(.*)",
  "/api/patient(.*)",
  "/api/doctor(.*)",
  "/api/appointments(.*)",
]);

// ✅ Protected page routes (can redirect to sign-in)
const isProtectedPageRoute = createRouteMatcher([
  "/patient(.*)",
  "/doctor(.*)",
  "/hospital-admin(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // ✅ Allow public routes
  if (isPublicRoute(request)) {
    return;
  }

  // ✅ Protect API routes (will return 401 JSON, not redirect)
  if (isProtectedApiRoute(request)) {
    await auth.protect();
    return;
  }

  // ✅ Protect page routes (will redirect to sign-in)
  if (isProtectedPageRoute(request)) {
    await auth.protect();
    return;
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
