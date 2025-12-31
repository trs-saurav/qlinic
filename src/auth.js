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
          
          const user = await User.findByEmail(credentials.email)
          if (!user) {
            console.log('❌ User not found:', credentials.email)
            return null
          }
          
          const isValid = await user.comparePassword(credentials.password)
          if (!isValid) {
            console.log('❌ Invalid password for:', credentials.email)
            return null
          }
          
          await user.updateLastLogin()
          
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
          
          const dbUser = await User.findOrCreateOAuthUser(
            { 
              id: account.providerAccountId, 
              email: user.email,
              name: user.name,
              picture: user.image,
              given_name: profile?.given_name,
              family_name: profile?.family_name,
            },
            account.provider
          )
          
          await dbUser.updateLastLogin()
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
          const dbUser = await User.findByEmail(user.email)
          
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
