import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import AppleProvider from 'next-auth/providers/apple'

const isDevelopment = process.env.NODE_ENV === 'development'

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
      },
      // ✅ Use only state check in development, pkce + state in production
      checks: isDevelopment ? ['state'] : ['pkce', 'state']
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      checks: ['state'] // Facebook works well with state only
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
      checks: ['state']
    }),
  ],

  pages: {
    signIn: '/sign-in',
    error: '/sign-in', // Redirect errors to sign-in page
  },

  session: {
    strategy: 'jwt',
  },
}
