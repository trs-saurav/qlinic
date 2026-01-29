// auth.js
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { baseAuthConfig } from './auth.config'
import connectDB from '@/config/db'
import User from '@/models/user'
import {MongooseError} from "mongoose";

// Regex to check if a string is a valid MongoDB ObjectId
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// [Fix for Isolated Sessions]
// If AUTH_URL is set to the main domain in environment variables, it forces all OAuth callbacks
// to redirect to the main domain (e.g. www.qlinichealth.com).
// This breaks authentication for subdomains (user., doctor.) because cookies are host-only.
// We delete these variables to force Auth.js to use the request's host header (trustHost: true).
if (process.env.AUTH_URL?.includes('qlinichealth.com')) delete process.env.AUTH_URL
if (process.env.NEXTAUTH_URL?.includes('qlinichealth.com')) delete process.env.NEXTAUTH_URL

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...baseAuthConfig,
  trustHost: true,
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

          if (!user || credentials.role !== user.role) {
             console.log('AUTH.JS: User not found or Role mismatch');
             return null;
          }

          const isValid = await user.comparePassword(credentials.password)
          if (!isValid) return null

          console.log('AUTH.JS: Credentials verified');
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName || `${user.firstName} ${user.lastName}`,
            role: user.role,
            image: user.profileImage,
          }
        } catch (error) {
          console.error('AUTH.JS: Authorize error:', error);
          return null
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, req }) {


      if (account?.provider === 'credentials') {
        console.log('[SIGNIN] Credentials provider sign-in complete.');
        return true;
      }
      
      // For OAuth providers
      try {
        await connectDB();
        let dbUser = await User.findOne({ email: user.email });

        // Extract role from cookie if available
        let roleFromCookie = 'user'; // default
        if (req?.headers?.cookie) {
          const cookies = req.headers.cookie.split(';');
          const roleToken = cookies.find(c => c.trim().startsWith('oauth_role_token='));
          if (roleToken) {
            try {
              const tokenValue = roleToken.split('=')[1];
              const decoded = JSON.parse(decodeURIComponent(tokenValue));
              if (decoded.role && ['user', 'doctor', 'hospital_admin'].includes(decoded.role)) {
                roleFromCookie = decoded.role;
                console.log('[SIGNIN] Role from cookie:', roleFromCookie);
              }
            } catch (e) {
              console.error('[SIGNIN] Failed to parse role cookie:', e);
            }
          }
        }

        if (!dbUser) {
          console.log('[SIGNIN] OAuth user not found. Creating new user with role:', roleFromCookie);
          dbUser = await User.create({
            email: user.email,
            firstName: user.name?.split(' ')[0] || 'User',
            lastName: user.name?.split(' ')[1] || '',
            role: roleFromCookie,  // ✅ Use role from cookie
            profileImage: user.image,
            oauthProviders: [{ provider: account.provider, providerId: account.providerAccountId }]
          });
          console.log('[SIGNIN] New user created with role:', roleFromCookie);
          
          // Create role-specific profile for OAuth users
          if (roleFromCookie === 'doctor') {
            const DoctorProfile = require('@/models/DoctorProfile').default;
            await DoctorProfile.create({
              userId: dbUser._id,
              specialization: 'General Medicine',
              qualifications: [],
              experience: 0,
              consultationFee: 0,
            });
          } else if (roleFromCookie === 'hospital_admin') {
            const HospitalAdminProfile = require('@/models/HospitalAdminProfile').default;
            await HospitalAdminProfile.create({
              userId: dbUser._id,
              hospitalId: null,
              designation: '',
              department: '',
            });
          } else {
            const PatientProfile = require('@/models/PatientProfile').default;
            await PatientProfile.create({
              userId: dbUser._id,
              dateOfBirth: null,
              gender: null,
              bloodGroup: null,
              address: {},
            });
          }
        } else {
           console.log('[SIGNIN] Existing OAuth user found:', dbUser.email);
        }

        // IMPORTANT: Attach database ID and role to the user object
        // This is passed to the JWT callback.
        user.role = dbUser.role;
        user.id = dbUser._id.toString(); // Must be a string
        
        return true;
      } catch (error) {
        console.error('[SIGNIN] Error in signIn callback for OAuth:', error);
        return false; // Prevent sign-in on error
      }
    },
    async jwt({ token, user, trigger, session }) {
  if (user) {
    token.db_id = user.id;
    token.role = user.role;
    token.roleLastChecked = Date.now(); // ✅ Add timestamp
  }

  if (trigger === 'update' && session?.role) {
    token.role = session.role;
    token.roleLastChecked = Date.now();
  }

  // ✅ Only check DB every 5 minutes
  const fiveMinutes = 5 * 60 * 1000;
  const shouldRefresh = !token.roleLastChecked || 
                        (Date.now() - token.roleLastChecked > fiveMinutes);

  if (shouldRefresh && token.db_id && objectIdRegex.test(token.db_id)) {
    console.log('[JWT] Role cache expired. Refreshing...');
    try {
      await connectDB();
      const dbUser = await User.findById(token.db_id);
      if (dbUser) {
        token.role = dbUser.role;
        token.roleLastChecked = Date.now();
        console.log(`[JWT] Role refreshed: ${dbUser.role}`);
      }
    } catch (e) {
      console.error('[JWT] Refresh error:', e.message);
    }
  }

  return token;
},

    async session({ session, token }) {


      if (session.user && token) {
        // Expose database ID and role to the client-side session
        session.user.id = token.db_id;
        session.user.role = token.role;
      }
    
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        // If it's a relative URL (starts with /), just return it as-is
        if (url.startsWith('/')) {
          console.log(`[REDIRECT] Relative URL, allowing: ${url}`);
          return url;
        }

        // Ensure URLs are properly formatted with protocol before parsing
        const normalizedUrl = url.startsWith('http') ? url : `${baseUrl.split('://')[0]}://${url}`;
        const normalizedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        
        const urlObj = new URL(normalizedUrl);
        const baseUrlObj = new URL(normalizedBaseUrl);
        
        const isDevelopment = process.env.NODE_ENV === 'development';
        const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || (isDevelopment ? 'localhost' : 'qlinichealth.com');
        
        // In development with localhost, handle subdomain redirects properly
        if (isDevelopment) {
          // Handle localhost subdomain redirects in development
          // Allow redirect to subdomain if base URL is localhost and target is a localhost subdomain
          if (baseUrlObj.hostname === 'localhost' && urlObj.hostname.endsWith('.localhost')) {
            console.log(`[REDIRECT] Allowing redirect from localhost to subdomain: ${normalizedUrl}`);
            return normalizedUrl;
          }
          
          // Allow redirect from localhost subdomain to another localhost subdomain
          if (baseUrlObj.hostname.endsWith('.localhost') && urlObj.hostname.endsWith('.localhost')) {
            console.log(`[REDIRECT] Allowing redirect between localhost subdomains: ${normalizedUrl}`);
            return normalizedUrl;
          }
          
          // Allow redirect from localhost subdomain to same subdomain
          if (baseUrlObj.hostname === urlObj.hostname) {
            console.log(`[REDIRECT] Allowing redirect to same hostname: ${normalizedUrl}`);
            return normalizedUrl;
          }
          
          // Allow redirect from localhost subdomain to main localhost
          if (baseUrlObj.hostname.endsWith('.localhost') && urlObj.hostname === 'localhost') {
            console.log(`[REDIRECT] Allowing redirect from subdomain to localhost: ${normalizedUrl}`);
            return normalizedUrl;
          }
        } else {
          // Production environment - handle real domain subdomains
          // Remove protocol and www from main domain for comparison
          const cleanMainDomain = mainDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
          
          // Allow redirect between subdomains of the same main domain
          if (urlObj.hostname === cleanMainDomain || 
              baseUrlObj.hostname === urlObj.hostname ||
              (urlObj.hostname.endsWith('.' + cleanMainDomain) && 
               baseUrlObj.hostname.endsWith('.' + cleanMainDomain))) {
            console.log(`[REDIRECT] Allowing redirect in production: ${normalizedUrl}`);
            return normalizedUrl;
          }
          
          // Allow redirect from main domain to subdomain
          if (baseUrlObj.hostname === cleanMainDomain && 
              urlObj.hostname.endsWith('.' + cleanMainDomain)) {
            console.log(`[REDIRECT] Allowing redirect from main domain to subdomain: ${normalizedUrl}`);
            return normalizedUrl;
          }
          
          // Allow redirect from subdomain to main domain
          if (baseUrlObj.hostname.endsWith('.' + cleanMainDomain) && 
              urlObj.hostname === cleanMainDomain) {
            console.log(`[REDIRECT] Allowing redirect from subdomain to main domain: ${normalizedUrl}`);
            return normalizedUrl;
          }
        }
      } catch (e) {
        console.warn('Could not parse URL in redirect callback:', e);
        // Fallback to original behavior
        if (url.startsWith("/")) return `${baseUrl}${url}`
        return baseUrl;
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      
      // Fallback: allow same origin
      try {
        const normalizedUrl = url.startsWith('http') ? url : `${baseUrl.split('://')[0]}://${url}`;
        const normalizedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        if (new URL(normalizedUrl).origin === new URL(normalizedBaseUrl).origin) return normalizedUrl
      } catch (e) {
        console.warn('Could not parse URL in fallback redirect check:', e);
      }
      
      return baseUrl
    }
  }
})