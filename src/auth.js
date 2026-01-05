import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import Apple from 'next-auth/providers/apple'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import  connectDB  from '@/config/db'  // ✅ Named import
import User from '@/models/user'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
      async authorize(credentials) {
        try {
          await connectDB()
          
          // Select password explicitly since it's select: false in the schema
          const user = await User.findOne({ email: credentials.email }).select('+password')
          if (!user) {
            console.log('❌ User not found:', credentials.email)
            return null
          }
          
          const isValid = await user.comparePassword(credentials.password)
          if (!isValid) {
            console.log('❌ Invalid password for:', credentials.email)
            return null
          }
          
          // Update last login if you have this method, else do a direct update
          if (typeof user.updateLastLogin === 'function') {
            await user.updateLastLogin()
          } else {
            user.lastLogin = new Date()
            await user.save()
          }
          
          console.log('✅ Login successful:', user.email)
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            role: user.role,
            image: user.profileImage,
          }
        } catch (error) {
          console.error('❌ Error in authorize:', error)
          return null
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider !== 'credentials') {
          await connectDB()

          // Try to find user by linked OAuth provider first
          let dbUser = await User.findOne({
            oauthProviders: {
              $elemMatch: { provider: account.provider, providerId: account.providerAccountId }
            }
          })

          // Fallback: find by email
          if (!dbUser && user?.email) {
            dbUser = await User.findOne({ email: user.email })
          }

          // Create if not exists
          if (!dbUser) {
            const [given, family] = [profile?.given_name, profile?.family_name]
            dbUser = new User({
              email: user.email,
              firstName: given || user.name?.split(' ')?.[0] || '',
              lastName: family || user.name?.split(' ')?.slice(1).join(' ') || '',
              profileImage: user.image || '',
              role: 'user', // default base role
              oauthProviders: [
                { provider: account.provider, providerId: account.providerAccountId }
              ],
            })
            await dbUser.save()
          } else {
            // Ensure the current provider is linked
            const exists = dbUser.oauthProviders?.some(p => p.provider === account.provider && p.providerId === account.providerAccountId)
            if (!exists) {
              dbUser.oauthProviders = dbUser.oauthProviders || []
              dbUser.oauthProviders.push({ provider: account.provider, providerId: account.providerAccountId })
            }
            // Update basic profile info
            if (user.image && dbUser.profileImage !== user.image) dbUser.profileImage = user.image
            if (user.name) {
              const [first, ...rest] = user.name.split(' ')
              if (first && !dbUser.firstName) dbUser.firstName = first
              if (rest.length && !dbUser.lastName) dbUser.lastName = rest.join(' ')
            }
            await dbUser.save()
          }

          // Update last login
          if (typeof dbUser.updateLastLogin === 'function') {
            await dbUser.updateLastLogin()
          } else {
            dbUser.lastLogin = new Date()
            await dbUser.save()
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
})
