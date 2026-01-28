import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import AppleProvider from 'next-auth/providers/apple'

const isDevelopment = process.env.NODE_ENV === 'development'
const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost'

// For localhost subdomains in development, we need to handle cookies differently
// Since localhost subdomains don't work with traditional cookie domains,
// we leave the domain as undefined for development to allow browsers to handle it correctly.
const cookieDomain = isDevelopment ? undefined : `.${mainDomain}`

// PKCE cookies need special handling in development for localhost subdomains
const pkceCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: !isDevelopment, // Only secure in production
  maxAge: 900,
}

export const baseAuthConfig = {
  debug: isDevelopment, 
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),
  ],

  cookies: {
    sessionToken: {
      name: isDevelopment ? 'authjs.session-token' : '__Secure-authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        secure: !isDevelopment,
      },
    },
    pkceCodeVerifier: {
      name: isDevelopment ? 'authjs.pkce.code_verifier' : '__Secure-authjs.pkce.code_verifier',
      options: {
        ...pkceCookieOptions,
        domain: cookieDomain, // Apply the same domain logic
      },
    },
    callbackUrl: {
      name: isDevelopment ? 'authjs.callback-url' : '__Secure-authjs.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        secure: !isDevelopment,
      },
    },
  },

  pages: {
    signIn: '/sign-in',
    error: '/sign-in', 
  },

  session: {
    strategy: 'jwt',
  },
}