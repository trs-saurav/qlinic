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
      response_type: "code",
      // Remove redirect_uri - let NextAuth handle it automatically
    }
  },
  // Use only state check for development, pkce + state for production
  checks: process.env.NODE_ENV === "development" ? ['state'] : ['pkce', 'state']
}),


    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      checks: isDevelopment ? ['state'] : ['state']
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
      checks: isDevelopment ? ['state'] : ['state']
    }),
  ],

  pages: {
    signIn: '/sign-in',
    error: '/sign-in', 
  },

  session: {
    strategy: 'jwt',
  },
}