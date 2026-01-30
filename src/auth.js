// auth.js
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { baseAuthConfig } from './auth.config'
import connectDB from '@/config/db'
import User from '@/models/user'

// ✅ TEMPORARY OAUTH ROLE STORE
const oauthRoleStore = new Map();

export function setOAuthRole(email, role) {
  oauthRoleStore.set(email, { role, timestamp: Date.now() });
}

function getAndClearOAuthRole(email) {
  const data = oauthRoleStore.get(email);
  if (data) {
    oauthRoleStore.delete(email);
    return data.role;
  }
  return null;
}

// Clean up store every minute
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [email, data] of oauthRoleStore.entries()) {
      if (now - data.timestamp > 300000) oauthRoleStore.delete(email);
    }
  }, 60000);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...baseAuthConfig,
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",

  // ✅ 1. CROSS-SUBDOMAIN COOKIE SHARING (Fixes the Redirect Loop)
  // This ensures the session is visible to doctor.qlinichealth.com even if started on www.
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? `__Secure-authjs.session-token` 
        : `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" 
          ? ".qlinichealth.com" // Allows sharing across all *.qlinichealth.com
          : ".localhost",      // Local dev support
      },
    },
  },

  providers: [
    ...baseAuthConfig.providers,
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        try {
          await connectDB();
          const user = await User.findOne({ email: credentials.email.toLowerCase().trim() }).select('+password');
          if (!user) return null;
          if (credentials.role && credentials.role !== user.role) return null;
          const isValid = await user.comparePassword(credentials.password);
          if (!isValid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName || `${user.firstName} ${user.lastName}`,
            role: user.role,
            image: user.profileImage,
          };
        } catch (error) {
          return null;
        }
      }
    }),
  ],

  callbacks: {
    // ✅ 2. OAUTH SIGNUP ROLE LOGIC
    async signIn({ user, account, profile, req }) {
      if (account?.provider === 'credentials') return true;
      
      try {
        await connectDB();
        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          // A. Extract role from standard role query param (passed via Navbar signIn)
          const { searchParams } = new URL(req.url, "http://n");
          const roleFromParams = searchParams.get('role');

          // B. Extract role from URL path hint (if passed as redirect param)
          const urlStr = req.url || '';
          const roleFromPath = urlStr.includes('/doctor') ? 'doctor' : 
                               urlStr.includes('/hospital') ? 'hospital_admin' : 
                               urlStr.includes('/user') ? 'user' : null;

          // C. Extract from temporary Map store (OAuth fallback)
          const roleFromStore = getAndClearOAuthRole(user.email);

          // Priority: Direct Parameter > Path Hint > Store > Default
          const finalRole = roleFromParams || roleFromPath || roleFromStore || 'user';

          console.log(`[SIGNUP] Creating OAuth user: ${user.email} with role: ${finalRole}`);

          dbUser = await User.create({
            email: user.email,
            firstName: user.name?.split(' ')[0] || 'User',
            lastName: user.name?.split(' ')[1] || '',
            role: finalRole,
            profileImage: user.image,
            oauthProviders: [{ provider: account.provider, providerId: account.providerAccountId }]
          });
          
          user.isNewUser = true; 
        }

        user.role = dbUser.role;
        user.id = dbUser._id.toString();
        return true;
      } catch (error) {
        console.error('[SIGNIN] OAuth Signup Error:', error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.db_id = user.id;
        token.role = user.role;
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

    // ✅ 3. ALLOW CROSS-SUBDOMAIN REDIRECTS
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      const mainDomain = "qlinichealth.com";
      try {
        const urlObj = new URL(url);
        // Allow if the destination is on the same main domain or its subdomains
        if (urlObj.hostname === mainDomain || urlObj.hostname.endsWith(`.${mainDomain}`)) {
          return url;
        }
      } catch (e) {
        // Fallback for malformed URLs
      }
      return baseUrl;
    }
  },
});