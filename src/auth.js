// auth.js
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { baseAuthConfig } from './auth.config'
import connectDB from '@/config/db'
import User from '@/models/user'
import {MongooseError} from "mongoose";

// Regex to check if a string is a valid MongoDB ObjectId
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

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
        console.log('AUTH.JS: authorize', { credentials });
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
      console.log('============== AUTH.JS: signIn callback ==============');
      console.log('[SIGNIN] user:', user);
      console.log('[SIGNIN] account:', account);
      console.log('[SIGNIN] profile:', profile);

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
        
        console.log('[SIGNIN] Attached DB info to user object:', user);
        console.log('======================================================');
        return true;
      } catch (error) {
        console.error('[SIGNIN] Error in signIn callback for OAuth:', error);
        return false; // Prevent sign-in on error
      }
    },
    async jwt({ token, user, trigger, session, account }) {
      console.log('================ AUTH.JS: jwt callback =================');
      console.log('[JWT] token received:', token);
      console.log('[JWT] user object received:', user);
      console.log('[JWT] account object received:', account);
      console.log(`[JWT] trigger: ${trigger}`);


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


      console.log('[JWT] Returning final token:', token);
      console.log('======================================================');
      return token;
    },
    async session({ session, token }) {
      console.log('=============== AUTH.JS: session callback ===============');
      console.log('[SESSION] session object received:', session);
      console.log('[SESSION] token object received:', token);

      if (session.user && token) {
        // Expose database ID and role to the client-side session
        session.user.id = token.db_id;
        session.user.role = token.role;
      }
      console.log('[SESSION] Returning final session:', session);
      console.log('======================================================');
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('============== AUTH.JS: redirect callback ==============');
      console.log({ url, baseUrl });
      
      // In development with localhost, handle subdomain redirects properly
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        // Allow redirects to subdomains of localhost in development
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(baseUrl);
          
          // If both origins are localhost-based, allow the redirect
          if (baseUrlObj.hostname === 'localhost' && urlObj.hostname.endsWith('.localhost')) {
            return url;
          }
          
          // If both are localhost subdomains, allow the redirect
          if (baseUrlObj.hostname.endsWith('.localhost') && urlObj.hostname.endsWith('.localhost')) {
            return url;
          }
          
          // If both are the same localhost-based hostname, allow the redirect
          if (baseUrlObj.hostname === urlObj.hostname) {
            return url;
          }
        } catch (e) {
          console.warn('Could not parse URL in redirect callback:', e);
        }
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same domain
      if (new URL(url).origin === new URL(baseUrl).origin) return url
      
      console.log('======================================================');
      return baseUrl
    }
  }
})