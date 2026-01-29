// auth.js
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { baseAuthConfig } from './auth.config'
import connectDB from '@/config/db'
import User from '@/models/user'
import PatientProfile from '@/models/PatientProfile'
import DoctorProfile from '@/models/DoctorProfile'
import HospitalAdminProfile from '@/models/HospitalAdminProfile'
import {MongooseError} from "mongoose";

// Regex to check if a string is a valid MongoDB ObjectId
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ✅ TEMPORARY OAUTH ROLE STORE
// Stores role by email for OAuth users during signup flow
// Format: { "email@example.com": { role: "doctor", timestamp: 1234567890 } }
const oauthRoleStore = new Map();

// Cleanup expired entries every 5 minutes (300 seconds TTL)
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of oauthRoleStore.entries()) {
    if (now - data.timestamp > 300000) { // 5 minutes
      oauthRoleStore.delete(email);
    }
  }
}, 60000); // Check every minute

// Function to store role temporarily during OAuth signup
export function setOAuthRole(email, role) {
  oauthRoleStore.set(email, { role, timestamp: Date.now() });
}

// Function to retrieve and clear role after OAuth user creation
function getAndClearOAuthRole(email) {
  const data = oauthRoleStore.get(email);
  if (data) {
    oauthRoleStore.delete(email);
    return data.role;
  }
  return 'user'; // Default fallback
}

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
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    ...baseAuthConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        // [NextAuth.js Credentials Provider]
        // Docs: https://authjs.dev/getting-started/authentication/credentials
        // This function validates user credentials and returns user object if valid
        
        try {

          
          await connectDB()

          
          const user = await User.findOne({ email: credentials?.email }).select('+password')


          if (!user) {
  
            return null;
          }

          if (credentials.role !== user.role) {
  
            return null;
          }

          const isValid = await user.comparePassword(credentials.password)
          if (!isValid) {
  
            return null;
          }


          const authorizedUser = {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName || `${user.firstName} ${user.lastName}`,
            role: user.role,
            image: user.profileImage,
          };

          return authorizedUser;
        } catch (error) {
    
          return null
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, req }) {
      if (account?.provider === 'credentials') {
        console.log(`[SIGNIN] ✅ Credentials provider sign-in for: ${user.email}`);
        return true;
      }
      
      // For OAuth providers
      try {
        console.log(`[SIGNIN] Starting OAuth sign-in - Provider: ${account?.provider}, Email: ${user.email}`);
        
        await connectDB();
        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          // ✅ FIXED: Get role from temporary store (set by frontend before OAuth redirect)
          // Try by exact email first, then by temporary keys
          let roleFromStore = getAndClearOAuthRole(user.email);
          
          console.log(`[SIGNIN] Store lookup by email "${user.email}": ${roleFromStore === 'user' ? 'not found, checking temp keys...' : roleFromStore}`);
          
          // If not found by email, try to find by temporary role keys from recent signups
          if (roleFromStore === 'user') {
            // Look through recent entries (created in last 30 seconds)
            const now = Date.now();
            console.log(`[SIGNIN] Current store keys: [${Array.from(oauthRoleStore.keys()).join(', ')}]`);
            
            for (const [key, data] of oauthRoleStore.entries()) {
              if (key.startsWith('temp-') && now - data.timestamp < 30000) {
                // Found a recent temp key, use it and clear it
                const tempRole = data.role;
                console.log(`[SIGNIN] Found matching temp key: ${key} with role: ${tempRole}`);
                oauthRoleStore.delete(key);
                roleFromStore = tempRole;
                break;
              }
            }
          }
          
          console.log(`[SIGNIN] Creating new OAuth user with role: ${roleFromStore}`);
          
          dbUser = await User.create({
            email: user.email,
            firstName: user.name?.split(' ')[0] || 'User',
            lastName: user.name?.split(' ')[1] || '',
            role: roleFromStore, // ✅ Use role from store
            profileImage: user.image,
            oauthProviders: [{ provider: account.provider, providerId: account.providerAccountId }]
          });
          
          console.log(`[SIGNIN] ✅ New OAuth user created - Email: ${user.email}, ID: ${dbUser._id}, Role: ${roleFromStore}`);
        } else {
          console.log(`[SIGNIN] ✅ Existing OAuth user - Email: ${user.email}, Role: ${dbUser.role}`);
        }

        // Set user properties that will be passed to JWT callback
        user.role = dbUser.role;
        user.id = dbUser._id.toString();
        
        console.log(`[SIGNIN] ✅ OAuth sign-in successful - Setting user role: ${user.role}`);
        return true;
      } catch (error) {
        console.error('[SIGNIN] ❌ Error in signIn callback for OAuth:', error);
        console.error('[SIGNIN] Error stack:', error.stack);
        // Return false to prevent sign-in on critical errors
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      // [NextAuth.js JWT Callback]
      // Docs: https://authjs.dev/reference/nextjs#jwt
      // This callback is called whenever JWT is created or updated
      // Store user data in the token that will be persisted on the client
      
      if (user) {
        console.log(`[JWT] Initial sign-in - Setting token with user:`, { id: user.id, email: user.email, role: user.role });
        token.db_id = user.id;
        token.role = user.role;
        token.isNewUser = user.isNewUser;
        token.roleLastChecked = Date.now();
      } else if (token.db_id) {
        // Existing token update - refresh role from DB
        try {
          await connectDB();
          const dbUser = await User.findById(token.db_id);
          if (dbUser && dbUser.role !== token.role) {
            console.log(`[JWT] Role changed in DB - updating token from ${token.role} to ${dbUser.role}`);
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error(`[JWT] Error refreshing role from DB:`, error.message);
        }
      }

      // ✅ Only check DB every 5 minutes
      const fiveMinutes = 5 * 60 * 1000;
      const now = Date.now();
      const timeSinceLastCheck = now - (token.roleLastChecked || 0);
      const shouldRefresh = !token.roleLastChecked || (timeSinceLastCheck > fiveMinutes);

      if (shouldRefresh && token.db_id) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.db_id);
          if (dbUser) {
            token.role = dbUser.role;
            token.roleLastChecked = Date.now();
          }
        } catch (e) {
          console.error(`[JWT] Error during periodic role refresh:`, e.message);
        }
      }
      
      console.log(`[JWT] Token updated - Role: ${token.role}, ID: ${token.db_id}`);
      return token;
    },
    async session({ session, token }) {
      // [NextAuth.js Session Callback]
      // Docs: https://authjs.dev/reference/nextjs#session
      // This callback is called whenever session is checked on client
      // Expose token data to session object for client-side access
      
      if (session.user && token) {
        session.user.id = token.db_id;
        session.user.role = token.role;
        console.log(`[SESSION] Session created - Email: ${session.user.email}, Role: ${session.user.role}`);
      } else {
        console.log(`[SESSION] ⚠️ Session missing user or token`);
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // [NextAuth.js Redirect Callback]
      // Docs: https://authjs.dev/reference/nextjs#redirect
      // Controls where users are redirected after sign-in
      
      console.log(`[REDIRECT] Called - URL: ${url}, BaseURL: ${baseUrl}`);
      
      try {
        // Handle relative URLs (most common case for OAuth redirects)
        if (url.startsWith('/')) {
          console.log(`[REDIRECT] ✅ Relative URL, returning as-is: ${url}`);
          return url;
        }

        // If URL is from same origin, allow it
        if (url.startsWith(baseUrl)) {
          const relativeUrl = url.slice(baseUrl.length);
          console.log(`[REDIRECT] ✅ Same origin URL, returning relative: ${relativeUrl}`);
          return relativeUrl;
        }

        // Check if it's a valid localhost/development URL
        const isDevelopment = process.env.NODE_ENV === 'development';
        if (isDevelopment) {
          try {
            const urlObj = new URL(url);
            const baseUrlObj = new URL(baseUrl);
            
            // Allow redirects between localhost and localhost subdomains
            if ((urlObj.hostname === 'localhost' || urlObj.hostname.endsWith('.localhost')) &&
                (baseUrlObj.hostname === 'localhost' || baseUrlObj.hostname.endsWith('.localhost'))) {
              console.log(`[REDIRECT] ✅ Development localhost redirect allowed: ${url}`);
              return url;
            }
          } catch (e) {
            console.error(`[REDIRECT] Parse error during localhost check:`, e.message);
          }
        }

        // Check for same domain redirects in production
        const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'qlinichealth.com';
        const cleanMainDomain = mainDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
        
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(baseUrl);
          
          // Allow redirects within same domain or subdomains
          if (urlObj.hostname === cleanMainDomain || 
              baseUrlObj.hostname === urlObj.hostname ||
              urlObj.hostname.endsWith('.' + cleanMainDomain)) {
            console.log(`[REDIRECT] ✅ Same domain redirect allowed: ${url}`);
            return url;
          }
        } catch (e) {
          console.error(`[REDIRECT] Parse error during domain check:`, e.message);
        }

        console.log(`[REDIRECT] ⚠️ URL not allowed, falling back to baseUrl: ${baseUrl}`);
      } catch (e) {
        console.error(`[REDIRECT] Unexpected error:`, e.message);
      }

      // Default fallback - return baseUrl or root
      return baseUrl;
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // [NextAuth.js Events - signIn]
      // Docs: https://authjs.dev/reference/nextjs#events
      // Called when user signs in. isNewUser is true for new OAuth/credentials users
      
      console.log(`[SIGNIN_EVENT] User signed in - Email: ${user?.email}, IsNew: ${isNewUser}, Provider: ${account?.provider}`);
      
      // Use either the isNewUser parameter or the flag we set in signIn callback
      const isActuallyNewUser = isNewUser || user?.isNewUser;
      
      // Only run for new users
      if (!isActuallyNewUser) {
        console.log(`[SIGNIN_EVENT] Existing user, skipping profile creation`);
        return;
      }
      
      if (!account?.provider) {
        console.log(`[SIGNIN_EVENT] No provider info, skipping profile creation`);
        return;
      }
      
      try {
        await connectDB();
        
        console.log(`[SIGNIN_EVENT] Creating profile for new user - ID: ${user.id}, Role: ${user.role}`);
        
        // Verify user exists in database with correct role before creating profile
        const dbUser = await User.findById(user.id);
        if (!dbUser) {
          console.error(`[SIGNIN_EVENT] ❌ User not found in DB with ID: ${user.id}`);
          return; // Exit early if user doesn't exist
        }
        
        console.log(`[SIGNIN_EVENT] ✅ Found user in DB - Role: ${dbUser.role}`);
        
        // Create role-specific profile based on user.role
        if (dbUser.role === 'doctor') {
          try {
            const doctorProfile = await DoctorProfile.create({
              userId: user.id,
              specialization: 'General Medicine',
              qualifications: [],
              experience: 0,
              consultationFee: 0,
            });
            console.log(`[SIGNIN_EVENT] ✅ Doctor profile created`);
          } catch (doctorError) {
            console.error(`[SIGNIN_EVENT] ❌ Doctor profile creation failed:`, doctorError.message);
            throw doctorError;
          }
        } else if (dbUser.role === 'hospital_admin') {
          try {
            const adminProfile = await HospitalAdminProfile.create({
              userId: user.id,
              hospitalId: null,
              designation: '',
              department: '',
            });
            console.log(`[SIGNIN_EVENT] ✅ Hospital admin profile created`);
          } catch (adminError) {
            console.error(`[SIGNIN_EVENT] ❌ Hospital admin profile creation failed:`, adminError.message);
            throw adminError;
          }
        } else {
          try {
            const year = new Date().getFullYear();
            const randomPart = (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
            const newQlinicId = `QL${year}-${randomPart}`;

            const patientProfile = await PatientProfile.create({
              userId: user.id,
              qclinicId: newQlinicId,
              dateOfBirth: null,
              gender: null,
              bloodGroup: null,
              address: {},
            });
            console.log(`[SIGNIN_EVENT] ✅ Patient profile created - ID: ${newQlinicId}`);
          } catch (patientError) {
            console.error(`[SIGNIN_EVENT] ❌ Patient profile creation failed:`, patientError.message);
            throw patientError;
          }
        }
      } catch (error) {
        console.error(`[SIGNIN_EVENT] ❌ Profile creation error:`, error);
        // Don't fail the signin, profile can be created later via manual endpoint
      }
    }
  },
})