import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import Apple from 'next-auth/providers/apple'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import connectDB from '@/config/db'
import User from '@/models/user'
import { cookies } from 'next/headers'

export const authOptions = {
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: 'consent', access_type: 'offline', response_type: 'code' } }
    }),
    Facebook({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET }),
    Apple({ clientId: process.env.APPLE_CLIENT_ID, clientSecret: process.env.APPLE_CLIENT_SECRET }),
    Credentials({
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        try {
          await connectDB()
          const user = await User.findOne({ email: credentials.email }).select('+password')
          if (!user || !(await user.comparePassword(credentials.password))) return null
          
          if (typeof user.updateLastLogin === 'function') await user.updateLastLogin()
          else await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })
          
          return { id: user._id.toString(), email: user.email, name: user.fullName, role: user.role, image: user.profileImage }
        } catch (error) { return null }
      }
    })
  ],
  
  callbacks: {
    async redirect({ url, baseUrl }) {
      return url;
    },
    
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider !== 'credentials') {
          await connectDB()

          let dbUser = await User.findOne({
            oauthProviders: { $elemMatch: { provider: account.provider, providerId: account.providerAccountId } }
          })

          if (!dbUser && user?.email) {
            dbUser = await User.findOne({ email: user.email })
          }

          // Read role from cookie
          let role = 'user';
          try {
            const cookieStore = await cookies();
            const tokenCookie = cookieStore.get('oauth_role_token');

            if (tokenCookie?.value) {
              const parsed = JSON.parse(tokenCookie.value);
              const validRoles = ['user', 'doctor', 'hospital_admin', 'admin', 'sub_admin'];
              
              if (validRoles.includes(parsed.role)) {
                role = parsed.role;
              }
            }
          } catch (e) {
            // Cookie parsing failed, defaulting to 'user'
          }

          if (!dbUser) {
            const [given, family] = [profile?.given_name, profile?.family_name]
            dbUser = new User({
              email: user.email,
              firstName: given || user.name?.split(' ')?.[0] || '',
              lastName: family || user.name?.split(' ')?.slice(1).join(' ') || '',
              profileImage: user.image || '',
              role: role, 
              oauthProviders: [{ provider: account.provider, providerId: account.providerAccountId }],
            })
            await dbUser.save()
          } else {
            const exists = dbUser.oauthProviders?.some(p => p.provider === account.provider && p.providerId === account.providerAccountId)
            if (!exists) {
              dbUser.oauthProviders = dbUser.oauthProviders || []
              dbUser.oauthProviders.push({ provider: account.provider, providerId: account.providerAccountId })
            }
            if (user.image && dbUser.profileImage !== user.image) dbUser.profileImage = user.image
            
            // Note: We intentionally do NOT update the role of existing users
            await dbUser.save()
          }
          
          if (typeof dbUser.updateLastLogin === 'function') await dbUser.updateLastLogin()
          else await User.findByIdAndUpdate(dbUser._id, { lastLogin: new Date() })
        }
        return true
      } catch (error) {
        console.error('Sign in error:', error)
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
        if (trigger === 'update' && session) token.role = session.role
        return token
      } catch (error) {
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
  
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/sign-in', error: '/auth/error' },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
