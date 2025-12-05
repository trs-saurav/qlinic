// middleware.js
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/patient",
  "/doctor",
  "/hospital-admin",
  "/admin",
  "/aboutus",
  "/solution",
  "/contact-us",
  "/api/webhooks(.*)",
  "/api/inngest(.*)",   // ← allow Inngest endpoint without auth
]);


export default clerkMiddleware((auth, request) => {
  // Public routes are accessible to everyone
  // Protected routes will be handled by ProtectedRoute component
  if (!isPublicRoute(request)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
