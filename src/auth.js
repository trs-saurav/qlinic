// auth.js

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import Apple from 'next-auth/providers/apple'
import Credentials from 'next-auth/providers/credentials'
import { authOptions as baseAuthOptions } from './auth.config'
import connectDB from '@/config/db'
import User from '@/models/user'

export const authOptions = {
  ...baseAuthOptions,
  providers: [
    Google({
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

    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),

    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),

    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
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

    })
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      return url;
    },

    async signIn({ user, account, profile }) {
      try {
        // Only handle OAuth providers (not credentials)
        if (account?.provider !== 'credentials') {
          await connectDB()

          // Find user by OAuth provider
          let dbUser = await User.findOne({
            oauthProviders: {
              $elemMatch: { 
                provider: account.provider, 
                providerId: account.providerAccountId 
              }
            }
          })

          // Fallback: find by email
          if (!dbUser && user?.email) {
            dbUser = await User.findOne({ email: user.email })
          }

          // ✅ Get role from URL query parameter (passed from sign-in page)
          // The sign-in page should add ?role=user to the OAuth redirect
          let role = 'user'; // Default role for OAuth users

          // Create new user if doesn't exist
          if (!dbUser) {
            const [given, family] = [profile?.given_name, profile?.family_name]
            dbUser = new User({
              email: user.email,
              firstName: given || user.name?.split(' ')?.[0] || '',
              lastName: family || user.name?.split(' ')?.slice(1).join(' ') || '',
              profileImage: user.image || '',
              role: role,
              oauthProviders: [
                { provider: account.provider, providerId: account.providerAccountId }
              ],
            })
            await dbUser.save()
            console.log('✅ Created new OAuth user:', user.email, 'Role:', role)
          } else {
            // Update existing user
            const providerExists = dbUser.oauthProviders?.some(
              p => p.provider === account.provider && p.providerId === account.providerAccountId
            )

            if (!providerExists) {
              dbUser.oauthProviders = dbUser.oauthProviders || []
              dbUser.oauthProviders.push({ 
                provider: account.provider, 
                providerId: account.providerAccountId 
              })
            }

            // Update profile image if changed
            if (user.image && dbUser.profileImage !== user.image) {
              dbUser.profileImage = user.image
            }

            // Update name fields if missing
            if (user.name) {
              const [first, ...rest] = user.name.split(' ')
              if (first && !dbUser.firstName) dbUser.firstName = first
              if (rest.length && !dbUser.lastName) dbUser.lastName = rest.join(' ')
            }

            await dbUser.save()
            console.log('✅ Updated existing OAuth user:', user.email)
          }

          // Update last login
          if (typeof dbUser.updateLastLogin === 'function') {
            await dbUser.updateLastLogin()
          } else {
            await User.findByIdAndUpdate(dbUser._id, { lastLogin: new Date() })
          }
        }

        return true
      } catch (error) {
        console.error('❌ Error in signIn callback:', error)
        return false
      }
    },

    async jwt({ token, user, trigger, session }) {
      try {
        if (user) {
          await connectDB()
          const dbUser = await User.findOne({ email: user.email })

          if (dbUser) {
            token.id = dbUser._id.toString()
            token.role = dbUser.role
            token.firstName = dbUser.firstName
            token.lastName = dbUser.lastName
            token.permissions = dbUser.adminPermissions
            token.isActive = dbUser.isActive
          }
        }

        if (trigger === 'update' && session) {
          token.role = session.role
        }

        return token
      } catch (error) {
        console.error('❌ Error in JWT callback:', error)
        return token
      }
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.firstName = token.firstName
        session.user.lastName = token.lastName
        session.user.permissions = token.permissions
        session.user.isActive = token.isActive
      }
      return session
    }
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/sign-in',
    error: '/auth/error',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)