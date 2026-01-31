import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { baseAuthConfig } from './auth.config'
import connectDB from '@/config/db'
import User from '@/models/user'
import PatientProfile from '@/models/PatientProfile'
import DoctorProfile from '@/models/DoctorProfile'
import HospitalAdminProfile from '@/models/HospitalAdminProfile'
import { cookies } from 'next/headers'

const isDevelopment = process.env.NODE_ENV === 'development'
const useSecureCookies = process.env.NODE_ENV === 'production'

// ✅ FIX: Use undefined in Dev to prevent browser blocking
const cookieDomain = isDevelopment ? undefined : '.qlinichealth.com'

if (process.env.AUTH_URL?.includes('qlinichealth.com')) delete process.env.AUTH_URL
if (process.env.NEXTAUTH_URL?.includes('qlinichealth.com')) delete process.env.NEXTAUTH_URL

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...baseAuthConfig,
  debug: isDevelopment,
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? '__Secure-' : ''}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        domain: cookieDomain, // undefined in dev allows separate login on doctor.localhost
      },
    },
  },
  providers: [
    ...baseAuthConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        try {
          await connectDB()
          const user = await User.findOne({ email: credentials?.email }).select('+password')
          if (!user) return null
          
          if (credentials.role && credentials.role !== user.role) return null

          const isValid = await user.comparePassword(credentials.password)
          if (!isValid) return null

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName || `${user.firstName} ${user.lastName}`,
            role: user.role,
            image: user.profileImage,
          };
        } catch (error) {
          return null
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, req }) {
      if (account?.provider === 'credentials') return true;
      try {
        await connectDB();
        let dbUser = await User.findOne({ email: user.email });
        let roleToAssign = 'user'; 
        
        try {
          const cookieStore = cookies()
          const roleCookie = cookieStore.get('oauth_role')
          if (roleCookie?.value) roleToAssign = roleCookie.value
          else if (req?.headers) {
            const cookieHeader = req.headers.get('cookie') || ''
            const match = cookieHeader.match(/oauth_role=([^;]+)/);
            if (match) roleToAssign = match[1];
          }
        } catch (e) {
          if (req?.url) {
             const urlRole = new URL(req.url).searchParams.get('role');
             if (urlRole) roleToAssign = urlRole;
          }
        }

        if (dbUser) return true; 

        dbUser = await User.create({
          email: user.email,
          firstName: user.name?.split(' ')[0] || 'User',
          lastName: user.name?.split(' ')[1] || '',
          role: roleToAssign, 
          profileImage: user.image,
          isNewUser: true, 
          oauthProviders: [{ provider: account.provider, providerId: account.providerAccountId }]
        });

        user.role = dbUser.role;
        user.id = dbUser._id.toString();
        user.isNewUser = true;
        return true;
      } catch (error) {
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.db_id = user.id;
        token.role = user.role;
        token.isNewUser = user.isNewUser;
        token.roleLastChecked = Date.now();
      } 
      const fiveMinutes = 5 * 60 * 1000;
      const now = Date.now();
      const shouldRefresh = !token.roleLastChecked || (now - (token.roleLastChecked || 0) > fiveMinutes);

      if (shouldRefresh && token.db_id) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.db_id);
          if (dbUser) {
            token.role = dbUser.role;
            token.roleLastChecked = Date.now();
          }
        } catch (e) {}
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.db_id;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
       if (url.startsWith("/")) return `${baseUrl}${url}`;
       if (new URL(url).origin === baseUrl) return url;
       const isSameRoot = url.includes('qlinichealth.com') || (isDevelopment && url.includes('localhost'));
       if (isSameRoot) return url;
       return baseUrl;
    }
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      const isActuallyNewUser = isNewUser || user?.isNewUser;
      if (!isActuallyNewUser || !account?.provider) return;
      try {
        await connectDB();
        const dbUser = await User.findById(user.id);
        if (!dbUser) return;
        
        if (dbUser.role === 'doctor') {
          await DoctorProfile.create({
            userId: user.id,
            specialization: 'General Medicine',
            qualifications: [],
            experience: 0,
            consultationFee: 0,
          });
        } else if (dbUser.role === 'hospital_admin') {
          await HospitalAdminProfile.create({
            userId: user.id,
            hospitalId: null,
            designation: '',
            department: '',
          });
        } else {
          const year = new Date().getFullYear();
          const randomPart = (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
          const newQlinicId = `QL${year}-${randomPart}`;
          await PatientProfile.create({
            userId: user.id,
            qclinicId: newQlinicId,
            dateOfBirth: null,
            gender: null,
            bloodGroup: null,
            address: {},
          });
        }
      } catch (error) {
        console.error("Profile Creation Error:", error);
      }
    }
  }
})