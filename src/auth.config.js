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


export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
async authorize(credentials, request) {
  console.log('\n' + '='.repeat(80))
  console.log('🔐 SERVER-SIDE DEBUG - AUTHORIZE FUNCTION CALLED')
  console.log('='.repeat(80))
  console.log('⏰ Timestamp:', new Date().toISOString())
  console.log('')
  
  // ============ REQUEST DEBUG ============
  console.log('📡 Request information:')
  console.log('   URL:', request?.url || 'N/A')
  console.log('   Method:', request?.method || 'N/A')
  if (request?.url) {
    try {
      const url = new URL(request.url)
      console.log('   Parsed URL:')
      console.log('      - Protocol:', url.protocol)
      console.log('      - Hostname:', url.hostname)
      console.log('      - Port:', url.port)
      console.log('      - Pathname:', url.pathname)
      console.log('      - Search:', url.search)
    } catch (e) {
      console.log('   Could not parse URL:', e.message)
    }
  }
  console.log('')
  
  // ============ CREDENTIALS DEBUG ============
  console.log('📥 Credentials received:')
  console.log('   credentials object exists?', !!credentials)
  console.log('   credentials type:', typeof credentials)
  
  if (credentials) {
    console.log('   All keys in credentials:', Object.keys(credentials))
    console.log('')
    console.log('   Detailed breakdown:')
    console.log('      email:', credentials.email)
    console.log('      email type:', typeof credentials.email)
    console.log('      email exists?', credentials.email !== undefined)
    console.log('')
    console.log('      password:', credentials.password ? '***' + credentials.password.slice(-3) : 'MISSING')
    console.log('      password type:', typeof credentials.password)
    console.log('      password exists?', credentials.password !== undefined)
    console.log('      password length:', credentials.password?.length || 0)
    console.log('')
    console.log('      role:', credentials.role, '<-- CHECK THIS VALUE')
    console.log('      role type:', typeof credentials.role)
    console.log('      role exists?', credentials.role !== undefined)
    console.log('      role is null?', credentials.role === null)
    console.log('      role is empty string?', credentials.role === '')
    console.log('      role is falsy?', !credentials.role)
  } else {
    console.log('   ⚠️ Credentials object is null or undefined!')
  }
  console.log('')
  console.log('='.repeat(80))
  console.log('')
  
  try {
    await connectDB()
    console.log('✅ Database connected')

    // ============ USER LOOKUP DEBUG ============
    console.log('')
    console.log('🔍 Looking up user in database...')
    console.log('   Searching for email:', credentials?.email)
    
    const user = await User.findOne({ email: credentials?.email }).select('+password')
    
    if (!user) {
      console.log('❌ User not found in database')
      console.log('   Searched email:', credentials?.email)
      console.log('🔐 ========== AUTHORIZE END (USER NOT FOUND) ==========')
      console.log('')
      return null
    }

    console.log('✅ User found in database!')
    console.log('   User ID:', user._id)
    console.log('   User email:', user.email)
    console.log('   User role:', user.role, '<-- USER\'S ACTUAL ROLE')
    console.log('   User has password?', !!user.password)
    console.log('')

    // ============ ROLE VALIDATION DEBUG ============
    console.log('🎭 ROLE VALIDATION STARTING...')
    console.log('='.repeat(80))
    
    const requestedRole = credentials?.role
    
    console.log('📊 Role comparison data:')
    console.log('   Requested role:', requestedRole)
    console.log('   User database role:', user.role)
    console.log('   Types match?', typeof requestedRole === typeof user.role)
    console.log('   Values match?', requestedRole === user.role)
    console.log('   Strict equality?', requestedRole === user.role)
    console.log('   Loose equality?', requestedRole == user.role)
    console.log('')
    
    // Check 1: Role must be provided
    console.log('🔍 Check 1: Is role provided?')
    if (!requestedRole) {
      console.log('   ❌ FAIL - No role provided')
      console.log('   requestedRole value:', requestedRole)
      console.log('   requestedRole type:', typeof requestedRole)
      console.log('   Rejecting sign-in - returning null')
      console.log('🔐 ========== AUTHORIZE END (NO ROLE PROVIDED) ==========')
      console.log('')
      return null
    }
    console.log('   ✅ PASS - Role is provided:', requestedRole)
    console.log('')
    
    // Check 2: Role must match
    console.log('🔍 Check 2: Does requested role match user role?')
    if (requestedRole !== user.role) {
      console.log('   ❌ FAIL - Role mismatch detected')
      console.log('   Requested:', `"${requestedRole}"`)
      console.log('   User has:', `"${user.role}"`)
      console.log('   Comparison result:', requestedRole === user.role)
      console.log('   Character codes comparison:')
      console.log('      Requested:', requestedRole.split('').map(c => c.charCodeAt(0)))
      console.log('      User role:', user.role.split('').map(c => c.charCodeAt(0)))
      console.log('   Rejecting sign-in - returning null')
      console.log('🔐 ========== AUTHORIZE END (ROLE MISMATCH) ==========')
      console.log('')
      return null
    }
    console.log('   ✅ PASS - Roles match!')
    console.log('')
    
    console.log('✅ Role validation passed completely!')
    console.log('='.repeat(80))
    console.log('')

    // ============ PASSWORD VALIDATION DEBUG ============
    console.log('🔑 PASSWORD VALIDATION STARTING...')
    console.log('   Comparing provided password with stored hash...')
    
    const isValid = await user.comparePassword(credentials.password)
    
    if (!isValid) {
      console.log('   ❌ FAIL - Invalid password')
      console.log('🔐 ========== AUTHORIZE END (INVALID PASSWORD) ==========')
      console.log('')
      return null
    }
    console.log('   ✅ PASS - Password is valid')
    console.log('')

    // ============ SUBDOMAIN VALIDATION DEBUG ============
    if (request?.url) {
      console.log('🌐 SUBDOMAIN VALIDATION STARTING...')
      const url = new URL(request.url)
      const hostname = url.hostname
      
      let subdomain = null
      if (hostname.includes('.localhost')) {
        const parts = hostname.split('.')
        if (parts.length >= 2) {
          subdomain = parts[0]
        }
      } else if (hostname.includes('.')) {
        const parts = hostname.split('.')
        if (parts.length >= 2) {
          subdomain = parts[0]
        }
      }
      
      console.log('   Extracted subdomain:', subdomain || 'None')
      
      const subdomainToRole = {
        'user': 'user',
        'doctor': 'doctor',
        'admin': 'admin',
        'hospital': 'hospital_admin',
      }
      const subdomainRole = subdomain ? subdomainToRole[subdomain] : null
      
      console.log('   Mapped subdomain role:', subdomainRole || 'None')
      console.log('   User actual role:', user.role)
      
      if (subdomainRole && user.role !== subdomainRole) {
        console.log('   ❌ FAIL - Subdomain mismatch')
        console.log('      Subdomain:', subdomain)
        console.log('      Expected role:', subdomainRole)
        console.log('      User has:', user.role)
        console.log('🔐 ========== AUTHORIZE END (SUBDOMAIN MISMATCH) ==========')
        console.log('')
        return null
      }
      console.log('   ✅ PASS - Subdomain validation passed')
      console.log('')
    }

    // ============ UPDATE LAST LOGIN ============
    console.log('📝 Updating last login...')
    if (typeof user.updateLastLogin === 'function') {
      await user.updateLastLogin()
      console.log('   ✅ Last login updated (method)')
    } else {
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })
      console.log('   ✅ Last login updated (direct)')
    }
    console.log('')

    // ============ SUCCESS ============
    console.log('🎉 AUTHORIZATION SUCCESSFUL!')
    console.log('   User:', user.email)
    console.log('   Role:', user.role)
    console.log('   Returning user object to create session')
    console.log('🔐 ========== AUTHORIZE END (SUCCESS) ==========')
    console.log('')

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.fullName || `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      image: user.profileImage || user.image,
    }
  } catch (error) {
    console.error('💥 EXCEPTION IN AUTHORIZE FUNCTION')
    console.error('   Error message:', error.message)
    console.error('   Error name:', error.name)
    console.error('   Stack trace:', error.stack)
    console.log('🔐 ========== AUTHORIZE END (ERROR) ==========')
    console.log('')
    return null
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