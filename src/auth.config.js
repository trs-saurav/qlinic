// auth.config.js
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import AppleProvider from 'next-auth/providers/apple'
import bcrypt from 'bcryptjs'
import connectDB from '@/config/db'
import User from '@/models/user'

const isDevelopment = process.env.NODE_ENV === 'development'
const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost'

// ✅ Enable domain cookies for custom domains (both dev and production)
// Only skip domain attribute for plain 'localhost'
const shouldUseDomainCookie = mainDomain !== 'localhost'

console.log('🔧 Auth Config:', { 
  cookieDomain: shouldUseDomainCookie ? `.${mainDomain}` : undefined,
  useSecureCookies: !isDevelopment,
  mainDomain,
  nodeEnv: process.env.NODE_ENV,
  isLocalhost: mainDomain === 'localhost'
})

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          await connectDB()

          const user = await User.findOne({ email: credentials?.email }).select('+password')
          if (!user) {
            throw new Error('Invalid email or password')
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            throw new Error('Invalid email or password')
          }

          console.log('✅ User authenticated:', user.email, 'Role:', user.role)

          return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            image: user.profileImage || user.image,
          }
        } catch (error) {
          console.error('❌ Auth error:', error.message)
          throw error
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
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

  // ✅ Cookie configuration for subdomain sharing (works in both dev and prod)
  cookies: {
    sessionToken: {
      name: isDevelopment 
        ? 'authjs.session-token'
        : '__Secure-authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // ✅ Shares cookies across subdomains in production and custom dev domains
        domain: shouldUseDomainCookie ? `.${mainDomain}` : undefined,
        secure: !isDevelopment, // Auto HTTPS in production
      },
    },
    callbackUrl: {
      name: isDevelopment
        ? 'authjs.callback-url'
        : '__Secure-authjs.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        domain: shouldUseDomainCookie ? `.${mainDomain}` : undefined,
        secure: !isDevelopment,
      },
    },
    csrfToken: {
      name: isDevelopment
        ? 'authjs.csrf-token'
        : '__Secure-authjs.csrf-token',
      options: {
        httpOnly: false, // ✅ Client needs access to CSRF token
        sameSite: 'lax',
        path: '/',
        domain: shouldUseDomainCookie ? `.${mainDomain}` : undefined,
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.role = user.role
        token.image = user.image
      }

      // Handle OAuth role assignment
      if (account?.provider && account.provider !== 'credentials') {
        if (!token.role) {
          token.role = 'user' // Default role for OAuth
        }
        console.log('✅ OAuth user role:', token.role)
      }

      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.email = token.email
        session.user.firstName = token.firstName
        session.user.lastName = token.lastName
        session.user.role = token.role
        session.user.image = token.image
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }

      // Allow redirects to same domain and subdomains
      try {
        const urlObj = new URL(url)
        const baseUrlObj = new URL(baseUrl)

        // Check if URL is same domain or subdomain
        if (urlObj.hostname === baseUrlObj.hostname || 
            urlObj.hostname.endsWith(`.${mainDomain}`)) {
          return url
        }
      } catch (e) {
        console.error('Invalid URL in redirect:', e)
      }

      return baseUrl
    },
  },

  events: {
    async signIn({ user, account }) {
      console.log('✅ Sign in event:', { 
        email: user.email, 
        provider: account?.provider,
        role: user.role 
      })
    },
  },

  debug: isDevelopment,
}

export { authOptions }