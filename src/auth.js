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
      // [NextAuth.js signIn Callback]
      // Docs: https://authjs.dev/reference/nextjs#signin
      // Determines if user is allowed to sign in. Return true to allow, false to deny.
      
      if (account?.provider === 'credentials') {
        return true;
      }
      
      // For OAuth providers
      try {
        await connectDB();

        let dbUser = await User.findOne({ email: user.email });

        // ✅ Role Extraction from Subdomain or URL Parameter
        let roleFromRequest = 'user'; // Default role
        if (req?.headers) {
            const host = req.headers.get('host');
            // 1. Check for subdomain (highest priority)
            if (host.startsWith('doctor.')) {
                roleFromRequest = 'doctor';
            } else if (host.startsWith('hospital.')) {
                roleFromRequest = 'hospital_admin';
            }
            // 2. Fallback to URL parameter if no subdomain match
            else if (req.url) {
                try {
                    const url = new URL(req.url, `http://${host}`);
                    // Check for userRole (from frontend) or role (generic)
                    const urlRole = url.searchParams.get('userRole') || url.searchParams.get('role');
                    if (urlRole && ['user', 'doctor', 'hospital_admin'].includes(urlRole)) {
                        roleFromRequest = urlRole;
                    }
                } catch (e) {
                }
            }

            // 3. Fallback to cookie if no role from subdomain or URL
            if (roleFromRequest === 'user') {
                const cookieHeader = req.headers.get('cookie');
                if (cookieHeader) {
                    const match = cookieHeader.match(/oauth_role=([^;]+)/);
                    if (match) {
                        roleFromRequest = match[1];
                    }
                }
            }
        }
        
        const finalRole = dbUser?.role || roleFromRequest;
        
        if (dbUser && roleFromRequest !== dbUser.role) {
          dbUser.role = roleFromRequest;
          await dbUser.save();
        }
        
        if (!dbUser) {
          dbUser = await User.create({
            email: user.email,
            firstName: user.name?.split(' ')[0] || 'User',
            lastName: user.name?.split(' ')[1] || '',
            role: finalRole, // Use the determined role
            profileImage: user.image,
            oauthProviders: [{ provider: account.provider, providerId: account.providerAccountId }]
          });
        }

        user.role = dbUser.role;
        user.id = dbUser._id.toString();
        
        return true;
      } catch (error) {
  
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      // [NextAuth.js JWT Callback]
      // Docs: https://authjs.dev/reference/nextjs#jwt
      // This callback is called whenever JWT is created or updated
      // Store user data in the token that will be persisted on the client
      
      if (user) {
        token.db_id = user.id;
        token.role = user.role;
        token.isNewUser = user.isNewUser; // ✅ Preserve isNewUser flag
        token.roleLastChecked = Date.now();
      } else if (token.db_id) {
        const dbUser = await User.findById(token.db_id);
        if (dbUser && dbUser.role !== token.role) {
          token.role = dbUser.role;
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
        }
      }
      return token;
    },
    async session({ session, token }) {
      // [NextAuth.js Session Callback]
      // Docs: https://authjs.dev/reference/nextjs#session
      // This callback is called whenever session is checked on client
      // Expose token data to session object for client-side access
      
      if (session.user && token) {
        // Expose database ID and role to the client-side session
        const previousRole = session.user.role;
        session.user.id = token.db_id;
        session.user.role = token.role;
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // [NextAuth.js Redirect Callback]
      // Docs: https://authjs.dev/reference/nextjs#redirect
      // Controls where users are redirected after sign-in
      // IMPORTANT: URL validation is critical - malicious redirects can cause security issues
      
      try {
        // Remove temporary query parameters that were used for role transfer if present
        let cleanedUrl = url;
        if (url.includes('oauth_role=') || url.includes('state_param=')) {
          try {
            const urlObj = url.startsWith('http') ? new URL(url) : new URL(url, baseUrl);
            urlObj.searchParams.delete('oauth_role');
            urlObj.searchParams.delete('state_param');
            cleanedUrl = urlObj.toString().replace(baseUrl, '').replace(/^https?:\/\/[^\/]+/, '');
          } catch (e) {
            cleanedUrl = url;
          }
        }
        
        // If it's a relative URL (starts with /), just return it as-is
        if (cleanedUrl.startsWith('/')) {
          return cleanedUrl;
        }

        // Ensure URLs are properly formatted with protocol before parsing
        const normalizedUrl = cleanedUrl.startsWith('http') ? cleanedUrl : `${baseUrl.split('://')[0]}://${cleanedUrl}`;
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
            return normalizedUrl;
          }
          
          // Allow redirect from localhost subdomain to another localhost subdomain
          if (baseUrlObj.hostname.endsWith('.localhost') && urlObj.hostname.endsWith('.localhost')) {
            return normalizedUrl;
          }
          
          // Allow redirect from localhost subdomain to same subdomain
          if (baseUrlObj.hostname === urlObj.hostname) {
            return normalizedUrl;
          }
          
          // Allow redirect from localhost subdomain to main localhost
          if (baseUrlObj.hostname.endsWith('.localhost') && urlObj.hostname === 'localhost') {
            return normalizedUrl;
          }
        } else {
          // Production environment - handle real domain subdomains
          const cleanMainDomain = mainDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
          
          // Allow redirect between subdomains of the same main domain
          if (urlObj.hostname === cleanMainDomain || 
              baseUrlObj.hostname === urlObj.hostname ||
              (urlObj.hostname.endsWith('.' + cleanMainDomain) && 
               baseUrlObj.hostname.endsWith('.' + cleanMainDomain))) {
            return normalizedUrl;
          }
          
          // Allow redirect from main domain to subdomain
          if (baseUrlObj.hostname === cleanMainDomain && 
              urlObj.hostname.endsWith('.' + cleanMainDomain)) {
            return normalizedUrl;
          }
          
          // Allow redirect from subdomain to main domain
          if (baseUrlObj.hostname.endsWith('.' + cleanMainDomain) && 
              urlObj.hostname === cleanMainDomain) {
            return normalizedUrl;
          }
        }
      } catch (e) {
        // Fallback to original behavior
        if (url.startsWith("/")) return `${baseUrl}${url}`
        return baseUrl;
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Fallback: allow same origin
      try {
        const normalizedUrl = url.startsWith('http') ? url : `${baseUrl.split('://')[0]}://${url}`;
        const normalizedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        if (new URL(normalizedUrl).origin === new URL(normalizedBaseUrl).origin) {
          return normalizedUrl;
        }
      } catch (e) {
      }

      return baseUrl
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // [NextAuth.js Events - signIn]
      // Docs: https://authjs.dev/reference/nextjs#events
      // Called when user signs in. isNewUser is true for new OAuth/credentials users
      
      // Use either the isNewUser parameter or the flag we set in signIn callback
      const isActuallyNewUser = isNewUser || user?.isNewUser;
      
      // Only run for new users
      if (!isActuallyNewUser) {
        return;
      }
      
      if (!account?.provider) {
        return;
      }
      
      try {
        await connectDB();
        
        // Verify user exists in database with correct role before creating profile
        const dbUser = await User.findById(user.id);
        if (!dbUser) {
          return; // Exit early if user doesn't exist
        }
        
        // Create role-specific profile based on user.role
        if (dbUser.role === 'doctor') {
          try {
            await DoctorProfile.create({
              userId: user.id,
              specialization: 'General Medicine',
              qualifications: [],
              experience: 0,
              consultationFee: 0,
            });
          } catch (doctorError) {
            throw doctorError;
          }
        } else if (dbUser.role === 'hospital_admin') {
          try {
            await HospitalAdminProfile.create({
              userId: user.id,
              hospitalId: null,
              designation: '',
              department: '',
            });
          } catch (adminError) {
            throw adminError;
          }
        } else {
          try {
            const year = new Date().getFullYear();
            const randomPart = (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
            const newQlinicId = `QL${year}-${randomPart}`;

            await PatientProfile.create({
              userId: user.id,
              qclinicId: newQlinicId, // Fix: Match DB index name (qclinicId instead of qlinicId)
              dateOfBirth: null,
              gender: null,
              bloodGroup: null,
              address: {},
            });
          } catch (patientError) {
            throw patientError;
          }
        }
      } catch (error) {
        // Don't fail the signin, profile can be created later via manual endpoint
      }
    }
  },
})
