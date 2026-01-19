import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import AppleProvider from 'next-auth/providers/apple'

const isDevelopment = process.env.NODE_ENV === 'development'

const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || (isDevelopment ? 'localhost' : 'qlinichealth.com')

// To allow authentication to work across subdomains (e.g. OAuth callback on root, session on user subdomain),
// we set the cookie domain to the main domain in production.
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
    state: {
      name: isDevelopment ? 'authjs.state' : '__Secure-authjs.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        secure: !isDevelopment,
        maxAge: 900,
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