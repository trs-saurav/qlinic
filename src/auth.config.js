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
      // ✅ Add proper redirect URI for OAuth callbacks
      redirect_uri: process.env.NODE_ENV === "production" 
        ? "https://qlinichealth.com/api/auth/callback/google"
        : "http://localhost:3000/api/auth/callback/google"
    }
  },
  // ✅ Use state check only (PKCE can cause issues with subdomains)
  checks: ['state']
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