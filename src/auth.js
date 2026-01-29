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
          console.log('📋 [CREDENTIALS] authorize() called', {
            email: credentials?.email,
            hasPassword: !!credentials?.password,
            role: credentials?.role,
            timestamp: new Date().toISOString()
          });
          
          await connectDB()
          console.log('✅ [CREDENTIALS] Database connected');
          
          const user = await User.findOne({ email: credentials?.email }).select('+password')
          console.log('🔍 [CREDENTIALS] User lookup result:', {
            found: !!user,
            userRole: user?.role,
            expectedRole: credentials?.role
          });

          if (!user) {
            console.warn('❌ [CREDENTIALS] User not found:', credentials?.email);
            return null;
          }

          if (credentials.role !== user.role) {
            console.warn('❌ [CREDENTIALS] Role mismatch:', {
              expected: credentials?.role,
              actual: user?.role
            });
            return null;
          }

          const isValid = await user.comparePassword(credentials.password)
          if (!isValid) {
            console.warn('❌ [CREDENTIALS] Password validation failed for:', credentials?.email);
            return null;
          }

          console.log('✅ [CREDENTIALS] Authorization successful for:', credentials?.email);
          const authorizedUser = {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName || `${user.firstName} ${user.lastName}`,
            role: user.role,
            image: user.profileImage,
          };
          console.log('🎯 [CREDENTIALS] Returning authorized user:', { 
            id: authorizedUser.id, 
            email: authorizedUser.email, 
            role: authorizedUser.role 
          });
          return authorizedUser;
        } catch (error) {
          console.error('❌ [CREDENTIALS] FATAL ERROR in authorize():', {
            message: error.message,
            stack: error.stack,
            email: credentials?.email
          });
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
      
      console.log('🔐 [SIGNIN CALLBACK] Starting signIn process', {
        provider: account?.provider,
        userEmail: user?.email,
        isNewUser: !account?.providerAccountId,
        timestamp: new Date().toISOString()
      });

      if (account?.provider === 'credentials') {
        console.log('✅ [SIGNIN CALLBACK] Credentials provider - allowing sign-in for:', user?.email);
        return true;
      }
      
      // For OAuth providers
      try {
        console.log('🌐 [SIGNIN CALLBACK] OAuth provider detected:', account?.provider);
        
        await connectDB();
        console.log('✅ [SIGNIN CALLBACK] Database connected');
        
        let dbUser = await User.findOne({ email: user.email });
        console.log('🔍 [SIGNIN CALLBACK] Database lookup:', {
          found: !!dbUser,
          email: user.email,
          existingRole: dbUser?.role
        });

        // ✅ Extract role from multiple sources (cookie, localStorage, subdomain)
        // Role is set by client during handleSocialSignUp
        let roleFromRequest = 'user'; // Default
        
        console.log('📝 [SIGNIN CALLBACK] Analyzing request for role...');
        
        // Method 1: Try to get role from cookie (most reliable for server-side)
        let cookieHeader = '';
        if (req?.headers) {
          if (typeof req.headers.get === 'function') {
            cookieHeader = req.headers.get('cookie') || '';
          } else if (typeof req.headers === 'object') {
            cookieHeader = req.headers.cookie || '';
          }
        }
        
        if (cookieHeader) {
          console.log('🍪 [SIGNIN CALLBACK] Parsing cookies...');
          const cookies = cookieHeader.split(';').map(c => c.trim());
          
          // Look for oauth_role cookie (new approach)
          const oauthRoleCookie = cookies.find(c => c.startsWith('oauth_role='));
          if (oauthRoleCookie) {
            const extractedRole = oauthRoleCookie.split('=')[1];
            if (extractedRole && ['user', 'doctor', 'hospital_admin'].includes(extractedRole)) {
              roleFromRequest = extractedRole;
              console.log('✅ [SIGNIN CALLBACK] Role from oauth_role cookie:', extractedRole);
            }
          } else {
            console.log('⚠️  [SIGNIN CALLBACK] oauth_role cookie not found');
          }
        } else {
          console.log('⚠️  [SIGNIN CALLBACK] No cookie header in request');
        }
        
        // Method 2: Extract from subdomain as fallback
        const host = req?.headers?.get?.('host') || req?.headers?.host || '';
        console.log('🌐 [SIGNIN CALLBACK] Request host:', host);
        
        if (host && roleFromRequest === 'user') {
          // Only override if we didn't find a cookie
          if (host.includes('doctor.')) {
            roleFromRequest = 'doctor';
            console.log('✅ [SIGNIN CALLBACK] Role from subdomain: doctor');
          } else if (host.includes('hospital.') || host.includes('hospital-admin.')) {
            roleFromRequest = 'hospital_admin';
            console.log('✅ [SIGNIN CALLBACK] Role from subdomain: hospital_admin');
          }
        }
        
        // ✅ Use role from cookie/subdomain or OAuth profile
        const roleFromOAuth = user.role || roleFromRequest || 'user';
        
        console.log('📋 [SIGNIN CALLBACK] Role assignment:', {
          userRole: user?.role,
          roleFromRequest: roleFromRequest,
          finalRole: roleFromOAuth,
          provider: account?.provider
        });
        
        // For existing users, keep their current role
        if (dbUser) {
          console.log('👤 [SIGNIN CALLBACK] Existing user found - keeping role:', {
            email: dbUser.email,
            currentRole: dbUser.role,
            oauthRole: roleFromOAuth
          });
          // Don't modify existing user's role
        }

        if (!dbUser) {
          console.log('✨ [SIGNIN CALLBACK] New user detected - creating in database', {
            email: user.email,
            role: roleFromOAuth,
            provider: account?.provider,
            providerAccountId: account?.providerAccountId
          });
          
          try {
            dbUser = await User.create({
              email: user.email,
              firstName: user.name?.split(' ')[0] || 'User',
              lastName: user.name?.split(' ')[1] || '',
              role: roleFromOAuth,
              profileImage: user.image,
              oauthProviders: [{ provider: account.provider, providerId: account.providerAccountId }]
            });
            console.log('✅ [SIGNIN CALLBACK] New user created successfully:', {
              id: dbUser._id.toString(),
              email: dbUser.email,
              role: dbUser.role
            });
            console.log('💡 [SIGNIN CALLBACK] Marking as new user for profile creation');
            
            // ✅ Flag this as a new user so events.signIn can create profiles
            user.isNewUser = true;
          } catch (createError) {
            console.error('❌ [SIGNIN CALLBACK] Failed to create user:', {
              email: user.email,
              error: createError.message
            });
            return false;
          }
        } else {
           console.log('👤 [SIGNIN CALLBACK] Existing OAuth user found:', {
             email: dbUser.email,
             role: dbUser.role
           });
           user.isNewUser = false;
        }

        // ✅ Attach role to user object for JWT/session
        user.role = dbUser?.role || roleFromOAuth;
        user.id = dbUser?._id?.toString() || user.id;
        
        console.log('🎯 [SIGNIN CALLBACK] Returning user to JWT callback:', {
          id: user.id,
          email: user.email,
          role: user.role,
          provider: account?.provider
        });
        
        return true;
      } catch (error) {
        console.error('❌ [SIGNIN CALLBACK] FATAL ERROR in OAuth signIn:', {
          provider: account?.provider,
          email: user?.email,
          message: error.message,
          stack: error.stack
        });
        return false; // Prevent sign-in on error
      }
    },
    async jwt({ token, user, trigger, session }) {
      // [NextAuth.js JWT Callback]
      // Docs: https://authjs.dev/reference/nextjs#jwt
      // This callback is called whenever JWT is created or updated
      // Store user data in the token that will be persisted on the client
      
      console.log('🔑 [JWT CALLBACK] Called with trigger:', trigger, {
        hasUser: !!user,
        hasSession: !!session,
        isNewUser: user?.isNewUser,
        tokenId: token.sub,
        currentRole: token.role
      });

      if (user) {
        console.log('👤 [JWT CALLBACK] New user - storing in token:', {
          userId: user.id,
          email: user.email,
          role: user.role,
          isNewUser: user.isNewUser
        });
        
        token.db_id = user.id;
        token.role = user.role;
        token.isNewUser = user.isNewUser; // ✅ Preserve isNewUser flag
        token.roleLastChecked = Date.now();
        
        console.log('✅ [JWT CALLBACK] Token updated with user data:', {
          db_id: token.db_id,
          role: token.role,
          isNewUser: token.isNewUser,
          timestamp: token.roleLastChecked
        });
      }

      if (trigger === 'update' && session?.role) {
        console.log('🔄 [JWT CALLBACK] Session update triggered - updating role:', {
          newRole: session.role,
          oldRole: token.role
        });
        
        token.role = session.role;
        token.roleLastChecked = Date.now();
        
        console.log('✅ [JWT CALLBACK] Token role updated from session');
      }

      // ✅ Only check DB every 5 minutes
      const fiveMinutes = 5 * 60 * 1000;
      const now = Date.now();
      const timeSinceLastCheck = now - (token.roleLastChecked || 0);
      const shouldRefresh = !token.roleLastChecked || (timeSinceLastCheck > fiveMinutes);

      if (shouldRefresh && token.db_id) {
        if (!objectIdRegex.test(token.db_id)) {
          console.warn('⚠️  [JWT CALLBACK] Invalid MongoDB ObjectId format:', token.db_id);
          return token;
        }
        
        console.log('🔄 [JWT CALLBACK] Role cache expired - refreshing from database', {
          lastChecked: token.roleLastChecked,
          timeSinceLastCheck: `${(timeSinceLastCheck / 1000 / 60).toFixed(2)} minutes`,
          userId: token.db_id
        });
        
        try {
          await connectDB();
          const dbUser = await User.findById(token.db_id);
          
          if (dbUser) {
            console.log('✅ [JWT CALLBACK] User found in database:', {
              email: dbUser.email,
              currentRole: dbUser.role,
              tokenRole: token.role,
              roleChanged: dbUser.role !== token.role
            });
            
            token.role = dbUser.role;
            token.roleLastChecked = Date.now();
            
            console.log('✅ [JWT CALLBACK] Token role synced with database:', {
              role: token.role,
              nextRefreshIn: '5 minutes'
            });
          } else {
            console.warn('⚠️  [JWT CALLBACK] User not found in database:', token.db_id);
          }
        } catch (e) {
          console.error('❌ [JWT CALLBACK] Error refreshing role from database:', {
            userId: token.db_id,
            error: e.message,
            stack: e.stack
          });
          console.log('💡 [JWT CALLBACK] Keeping cached role:', token.role);
        }
      } else if (!shouldRefresh) {
        console.log('⏱️  [JWT CALLBACK] Using cached role (refresh in', 
          `${((fiveMinutes - timeSinceLastCheck) / 1000 / 60).toFixed(2)} minutes)`);
      }

      return token;
    },

    async session({ session, token }) {
      // [NextAuth.js Session Callback]
      // Docs: https://authjs.dev/reference/nextjs#session
      // This callback is called whenever session is checked on client
      // Expose token data to session object for client-side access
      
      console.log('📱 [SESSION CALLBACK] Building session for user:', {
        email: session?.user?.email,
        tokenRole: token?.role,
        tokenId: token?.db_id,
        timestamp: new Date().toISOString()
      });

      if (session.user && token) {
        // Expose database ID and role to the client-side session
        const previousRole = session.user.role;
        session.user.id = token.db_id;
        session.user.role = token.role;
        
        console.log('✅ [SESSION CALLBACK] Session populated with token data:', {
          userId: session.user.id,
          userRole: session.user.role,
          previousRole: previousRole,
          roleChanged: previousRole !== session.user.role
        });
        
        if (!token.role) {
          console.warn('⚠️  [SESSION CALLBACK] WARNING - Token has no role!', {
            email: session.user.email,
            tokenKeys: Object.keys(token)
          });
        }
      } else {
        console.warn('⚠️  [SESSION CALLBACK] Missing session.user or token:', {
          hasSessionUser: !!session?.user,
          hasToken: !!token,
          sessionEmail: session?.user?.email
        });
      }
    
      return session;
    },
    async redirect({ url, baseUrl }) {
      // [NextAuth.js Redirect Callback]
      // Docs: https://authjs.dev/reference/nextjs#redirect
      // Controls where users are redirected after sign-in
      // IMPORTANT: URL validation is critical - malicious redirects can cause security issues
      
      console.log('🔀 [REDIRECT CALLBACK] Processing redirect', {
        requestUrl: url,
        baseUrl: baseUrl,
        timestamp: new Date().toISOString()
      });
      
      try {
        // Remove oauth_role query parameter if present (was used for debugging)
        let cleanedUrl = url;
        if (url.includes('oauth_role=')) {
          console.log('🧹 [REDIRECT CALLBACK] Cleaning up oauth_role parameter');
          try {
            const urlObj = url.startsWith('http') ? new URL(url) : new URL(url, baseUrl);
            urlObj.searchParams.delete('oauth_role');
            cleanedUrl = urlObj.toString().replace(baseUrl, '').replace(/^https?:\/\/[^\/]+/, '');
            console.log('✅ [REDIRECT CALLBACK] oauth_role parameter removed');
          } catch (e) {
            console.warn('⚠️  [REDIRECT CALLBACK] Error parsing URL for oauth_role cleanup:', e.message);
            cleanedUrl = url;
          }
        }
        
        // If it's a relative URL (starts with /), just return it as-is
        if (cleanedUrl.startsWith('/')) {
          console.log('✅ [REDIRECT CALLBACK] Relative URL allowed:', cleanedUrl);
          return cleanedUrl;
        }

        console.log('🔍 [REDIRECT CALLBACK] Processing absolute URL');
        
        // Ensure URLs are properly formatted with protocol before parsing
        const normalizedUrl = cleanedUrl.startsWith('http') ? cleanedUrl : `${baseUrl.split('://')[0]}://${cleanedUrl}`;
        const normalizedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        
        const urlObj = new URL(normalizedUrl);
        const baseUrlObj = new URL(normalizedBaseUrl);
        
        console.log('📋 [REDIRECT CALLBACK] URL components:', {
          targetHostname: urlObj.hostname,
          baseHostname: baseUrlObj.hostname,
          environment: process.env.NODE_ENV
        });
        
        const isDevelopment = process.env.NODE_ENV === 'development';
        const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || (isDevelopment ? 'localhost' : 'qlinichealth.com');
        
        // In development with localhost, handle subdomain redirects properly
        if (isDevelopment) {
          console.log('🏗️  [REDIRECT CALLBACK] Development mode - localhost subdomain checks');
          
          // Handle localhost subdomain redirects in development
          // Allow redirect to subdomain if base URL is localhost and target is a localhost subdomain
          if (baseUrlObj.hostname === 'localhost' && urlObj.hostname.endsWith('.localhost')) {
            console.log('✅ [REDIRECT CALLBACK] Allowing: localhost → subdomain.localhost');
            return normalizedUrl;
          }
          
          // Allow redirect from localhost subdomain to another localhost subdomain
          if (baseUrlObj.hostname.endsWith('.localhost') && urlObj.hostname.endsWith('.localhost')) {
            console.log('✅ [REDIRECT CALLBACK] Allowing: subdomain.localhost → subdomain.localhost');
            return normalizedUrl;
          }
          
          // Allow redirect from localhost subdomain to same subdomain
          if (baseUrlObj.hostname === urlObj.hostname) {
            console.log('✅ [REDIRECT CALLBACK] Allowing: same hostname');
            return normalizedUrl;
          }
          
          // Allow redirect from localhost subdomain to main localhost
          if (baseUrlObj.hostname.endsWith('.localhost') && urlObj.hostname === 'localhost') {
            console.log('✅ [REDIRECT CALLBACK] Allowing: subdomain.localhost → localhost');
            return normalizedUrl;
          }
        } else {
          // Production environment - handle real domain subdomains
          console.log('🌐 [REDIRECT CALLBACK] Production mode - domain validation');
          
          // Remove protocol and www from main domain for comparison
          const cleanMainDomain = mainDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
          
          console.log('🔐 [REDIRECT CALLBACK] Domain validation against:', cleanMainDomain);
          
          // Allow redirect between subdomains of the same main domain
          if (urlObj.hostname === cleanMainDomain || 
              baseUrlObj.hostname === urlObj.hostname ||
              (urlObj.hostname.endsWith('.' + cleanMainDomain) && 
               baseUrlObj.hostname.endsWith('.' + cleanMainDomain))) {
            console.log('✅ [REDIRECT CALLBACK] Allowing: subdomain redirect in production');
            return normalizedUrl;
          }
          
          // Allow redirect from main domain to subdomain
          if (baseUrlObj.hostname === cleanMainDomain && 
              urlObj.hostname.endsWith('.' + cleanMainDomain)) {
            console.log('✅ [REDIRECT CALLBACK] Allowing: main domain → subdomain');
            return normalizedUrl;
          }
          
          // Allow redirect from subdomain to main domain
          if (baseUrlObj.hostname.endsWith('.' + cleanMainDomain) && 
              urlObj.hostname === cleanMainDomain) {
            console.log('✅ [REDIRECT CALLBACK] Allowing: subdomain → main domain');
            return normalizedUrl;
          }
          
          console.warn('❌ [REDIRECT CALLBACK] Domain validation FAILED:', {
            targetHostname: urlObj.hostname,
            baseHostname: baseUrlObj.hostname,
            mainDomain: cleanMainDomain
          });
        }
      } catch (e) {
        console.error('❌ [REDIRECT CALLBACK] Exception during redirect processing:', {
          error: e.message,
          stack: e.stack,
          url: url,
          baseUrl: baseUrl
        });
        // Fallback to original behavior
        if (url.startsWith("/")) return `${baseUrl}${url}`
        return baseUrl;
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        console.log('✅ [REDIRECT CALLBACK] Fallback: relative URL');
        return `${baseUrl}${url}`;
      }
      
      // Fallback: allow same origin
      try {
        const normalizedUrl = url.startsWith('http') ? url : `${baseUrl.split('://')[0]}://${url}`;
        const normalizedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        if (new URL(normalizedUrl).origin === new URL(normalizedBaseUrl).origin) {
          console.log('✅ [REDIRECT CALLBACK] Fallback: same origin allowed');
          return normalizedUrl;
        }
      } catch (e) {
        console.warn('⚠️  [REDIRECT CALLBACK] Could not parse URL in fallback redirect check:', e.message);
      }

      console.warn('⚠️  [REDIRECT CALLBACK] All validations failed - redirecting to baseUrl');
      return baseUrl
    }
  },
  
  // ✅ NEW: Events hook to create profiles when new user is created
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // [NextAuth.js Events - signIn]
      // Docs: https://authjs.dev/reference/nextjs#events
      // Called when user signs in. isNewUser is true for new OAuth/credentials users
      
      console.log('🎯 [EVENTS.SIGNIN] Event triggered', {
        email: user?.email,
        isNewUserParam: isNewUser,
        isNewUserFlag: user?.isNewUser,
        provider: account?.provider,
        timestamp: new Date().toISOString()
      });
      
      // Use either the isNewUser parameter or the flag we set in signIn callback
      const isActuallyNewUser = isNewUser || user?.isNewUser;
      
      // Only run for new users
      if (!isActuallyNewUser) {
        console.log('ℹ️  [EVENTS.SIGNIN] Existing user - skipping profile creation', {
          email: user?.email,
          isNewUserParam: isNewUser,
          isNewUserFlag: user?.isNewUser
        });
        return;
      }
      
      if (!account?.provider) {
        console.warn('⚠️  [EVENTS.SIGNIN] No provider info - skipping profile creation');
        return;
      }
      
      console.log('✨ [EVENTS.SIGNIN] NEW USER DETECTED - proceeding with profile creation', {
        email: user?.email,
        role: user?.role,
        provider: account?.provider
      });
      
      try {
        await connectDB();
        console.log('✅ [EVENTS.SIGNIN] Database connected for profile creation');
        
        console.log('📋 [EVENTS.SIGNIN] Creating profile based on role:', {
          email: user.email,
          userId: user.id,
          role: user.role,
          provider: account.provider
        });
        
        // Create role-specific profile based on user.role
        if (user.role === 'doctor') {
          console.log('🏥 [EVENTS.SIGNIN] Creating DoctorProfile...');
          
          try {
            const doctorProfile = await DoctorProfile.create({
              userId: user.id,
              specialization: 'General Medicine',
              qualifications: [],
              experience: 0,
              consultationFee: 0,
            });
            console.log('✅ [EVENTS.SIGNIN] DoctorProfile created successfully:', {
              id: doctorProfile._id,
              userId: doctorProfile.userId
            });
          } catch (doctorError) {
            console.error('❌ [EVENTS.SIGNIN] Failed to create DoctorProfile:', {
              userId: user.id,
              error: doctorError.message
            });
            throw doctorError;
          }
        } else if (user.role === 'hospital_admin') {
          console.log('🏢 [EVENTS.SIGNIN] Creating HospitalAdminProfile...');
          
          try {
            const adminProfile = await HospitalAdminProfile.create({
              userId: user.id,
              hospitalId: null,
              designation: '',
              department: '',
            });
            console.log('✅ [EVENTS.SIGNIN] HospitalAdminProfile created successfully:', {
              id: adminProfile._id,
              userId: adminProfile.userId
            });
          } catch (adminError) {
            console.error('❌ [EVENTS.SIGNIN] Failed to create HospitalAdminProfile:', {
              userId: user.id,
              error: adminError.message
            });
            throw adminError;
          }
        } else {
          console.log('👤 [EVENTS.SIGNIN] Creating PatientProfile (default role)...');
          
          try {
            const patientProfile = await PatientProfile.create({
              userId: user.id,
              dateOfBirth: null,
              gender: null,
              bloodGroup: null,
              address: {},
            });
            console.log('✅ [EVENTS.SIGNIN] PatientProfile created successfully:', {
              id: patientProfile._id,
              userId: patientProfile.userId
            });
          } catch (patientError) {
            console.error('❌ [EVENTS.SIGNIN] Failed to create PatientProfile:', {
              userId: user.id,
              error: patientError.message
            });
            throw patientError;
          }
        }
        
        console.log('🎉 [EVENTS.SIGNIN] All profiles created successfully for:', {
          email: user.email,
          role: user.role
        });
      } catch (error) {
        console.error('❌ [EVENTS.SIGNIN] FATAL ERROR creating profile:', {
          email: user.email,
          userId: user.id,
          role: user.role,
          error: error.message,
          stack: error.stack
        });
        // Don't fail the signin, profile can be created later via manual endpoint
        console.log('💡 [EVENTS.SIGNIN] Sign-in allowed to proceed - profile creation can be retried');
      }
    }
  }
})