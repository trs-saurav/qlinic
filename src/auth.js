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
    async signIn({ user, account, profile }) {


      if (account?.provider === 'credentials') {
        console.log('[SIGNIN] Credentials provider sign-in complete.');
        return true;
      }
      
      // For OAuth providers
      try {
        await connectDB();
        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          console.log('[SIGNIN] OAuth user not found. Creating new user...');
          dbUser = await User.create({
            email: user.email,
            firstName: user.name?.split(' ')[0] || 'User',
            lastName: user.name?.split(' ')[1] || '',
            role: 'user', // Default role for new OAuth users
            profileImage: user.image,
            oauthProviders: [{ provider: account.provider, providerId: account.providerAccountId }]
          });
           console.log('[SIGNIN] New user created:', dbUser);
        } else {
           console.log('[SIGNIN] Existing OAuth user found:', dbUser);
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
    async jwt({ token, user, trigger, session, account }) {


      // This block only runs on the initial sign-in
      if (user) {
        console.log('[JWT] Initial sign-in. Attaching info from user object to token...');
        // The user object is from the `signIn` callback or the provider.
        // We MUST use the `id` we attached in the `signIn` callback.
        token.db_id = user.id;
        token.role = user.role;
        console.log('[JWT] Token after initial update:', token);
      }

      if (trigger === 'update' && session?.role) {
         console.log('[JWT] Session update triggered. Updating role...');
        token.role = session.role;
        console.log('[JWT] Token after session update:', token);
      }

      // This block runs on every request to keep role fresh.
      // CRITICAL FIX: Check if token.db_id is a valid ObjectId before querying the DB.
      if (token.db_id && objectIdRegex.test(token.db_id)) {
        console.log(`[JWT] Refreshing role. Searching user by ID: ${token.db_id}`);
        try {
            // Ensure database is connected before querying
            await connectDB();
            const dbUser = await User.findById(token.db_id);
            if (dbUser) {
              token.role = dbUser.role;
              console.log(`[JWT] Role refreshed from DB. New role: ${dbUser.role}`);
            } else {
              console.log(`[JWT] User with ID ${token.db_id} not found in DB.`);
            }
        } catch(e) {
            if (e instanceof MongooseError) {
                console.log(`[JWT] Mongoose error while refreshing role: ${e.message}`)
            } else {
                console.log(`[JWT] UNKNOWN error while refreshing role: ${e.message}`)
            }
        }
      } else {
        console.log(`[JWT] Did not refresh role. ID is missing or invalid: "${token.db_id}"`);
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