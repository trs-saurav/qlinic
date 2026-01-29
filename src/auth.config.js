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
      // ✅ Map role from profile or use pre-selected role
      profile(profile) {
        console.log('📝 [AUTH.CONFIG] Google profile callback', {
          email: profile.email,
          hasRole: !!profile.role
        });
        
        return {
          ...profile,
          role: profile.role ?? "user", // Default to 'user' if not provided
        };
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      // ✅ Map role from profile
      profile(profile) {
        console.log('📝 [AUTH.CONFIG] Facebook profile callback', {
          email: profile.email,
          hasRole: !!profile.role
        });
        
        return {
          ...profile,
          role: profile.role ?? "user",
        };
      },
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
      // ✅ Map role from profile
      profile(profile) {
        console.log('📝 [AUTH.CONFIG] Apple profile callback', {
          email: profile.email,
          hasRole: !!profile.role
        });
        
        return {
          ...profile,
          role: profile.role ?? "user",
        };
      },
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