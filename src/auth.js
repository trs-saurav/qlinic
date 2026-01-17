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
      async authorize(credentials) {
        try {
          await connectDB()

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

          // Update last login
          if (typeof user.updateLastLogin === 'function') {
            await user.updateLastLogin()
          } else {
            await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })
          }

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
          console.error('❌ Error in authorize:', error)
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