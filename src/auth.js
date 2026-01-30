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
  // In your auth.js cookies configuration:
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
      // ✅ FIX: Make sure domain is correct for localhost
      domain: process.env.NODE_ENV === "production" 
        ? ".qlinichealth.com" 
        : undefined, // Don't set domain for localhost to avoid issues
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
      
      // ✅ FIX: Allow sign-in regardless of role mismatch
      // Role checking should be done at the UI/application level, not auth level
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
    // In your auth.js callbacks.signIn function, add better error handling:
// In your auth.js callbacks.signIn function:
// In your auth.js callbacks:
// In your auth.js callbacks.signIn function:
async signIn({ user, account, profile, req }) {
  if (account?.provider === 'credentials') return true;
  
  try {
    await connectDB();
    let dbUser = await User.findOne({ email: user.email });

    if (!dbUser) {
      console.log('[OAuth] Processing new user:', user.email);
      
      // Extract role using multiple methods with proper fallbacks
      let finalRole = 'user';
      
      // Method 1: Check URL parameters (most reliable for OAuth)
      try {
        if (req.url) {
          const urlObj = new URL(req.url, 'http://localhost');
          finalRole = urlObj.searchParams.get('role') || finalRole;
          
          // Special handling for OAuth callbacks
          if (req.url.includes('oauth=1')) {
            console.log('[OAuth] Detected OAuth callback flow');
          }
        }
      } catch (urlError) {
        console.log('[OAuth] URL parsing error:', urlError);
      }
      
      // Method 2: Check cookies (set by frontend)
      if (finalRole === 'user') {
        try {
          const cookieHeader = req.headers?.get('cookie') || '';
          const cookieMatch = cookieHeader.match(/oauth_role=([^;]+)/);
          if (cookieMatch) {
            finalRole = cookieMatch[1];
            console.log('[OAuth] Found role in cookie:', finalRole);
          }
        } catch (cookieError) {
          console.log('[OAuth] Cookie parsing error:', cookieError);
        }
      }
      
      // Method 3: Check server-side store (fallback)
      if (finalRole === 'user') {
        const roleFromStore = getAndClearOAuthRole(user.email);
        if (roleFromStore) {
          finalRole = roleFromStore;
          console.log('[OAuth] Found role in server store:', finalRole);
        }
      }

      console.log(`[OAuth] Creating user ${user.email} with role: ${finalRole}`);

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
    console.log(`[OAuth] User processed successfully: ${user.email} (${user.role})`);
    return true;
  } catch (error) {
    console.error('[SIGNIN] OAuth Signup Error:', error);
    return false;
  }
},

// Simplified redirect callback:
async redirect({ url, baseUrl }) {
  // Handle OAuth errors
  if (url?.includes('/api/auth/error')) {
    return `${baseUrl}/sign-in?error=oauth-failed`;
  }
  
  // Handle relative URLs
  if (url?.startsWith("/")) {
    return `${baseUrl}${url}`;
  }
  
  // Allow our domain redirects
  try {
    const urlObj = new URL(url);
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "qlinichealth.com";
    
    if (urlObj.hostname === mainDomain || urlObj.hostname.endsWith(`.${mainDomain}`)) {
      return url;
    }
    
    if (urlObj.hostname.includes('localhost')) {
      return url;
    }
  } catch (e) {
    console.log('[Auth Redirect] URL parsing error:', e);
  }
  
  return baseUrl;
}


,

// Update your redirect callback:
async redirect({ url, baseUrl }) {
  console.log('[Auth Redirect] URL:', url, 'BaseUrl:', baseUrl);
  
  // Handle OAuth callback errors
  if (url?.includes('/api/auth/error')) {
    return `${baseUrl}/sign-in?error=oauth-failed`;
  }
  
  // Handle relative URLs
  if (url?.startsWith("/")) {
    return `${baseUrl}${url}`;
  }
  
  // Handle OAuth success redirects
  if (url?.includes('sign-in') && url?.includes('oauth=true')) {
    return url; // Allow OAuth callback URLs
  }
  
  // Handle subdomain redirects
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "qlinichealth.com";
  try {
    const urlObj = new URL(url);
    
    // Allow our domain redirects
    if (urlObj.hostname === mainDomain || urlObj.hostname.endsWith(`.${mainDomain}`)) {
      return url;
    }
    
    // Allow localhost for development
    if (urlObj.hostname.includes('localhost')) {
      return url;
    }
  } catch (e) {
    console.log('[Auth Redirect] URL parsing error:', e);
  }
  
  return baseUrl;
}
,


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
  // In your auth.js callbacks.redirect function:
async redirect({ url, baseUrl }) {
  // Handle error redirects
  if (url.includes('/api/auth/error')) {
    return `${baseUrl}/sign-in?error=oauth-failed`;
  }
  
  // Handle relative URLs
  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }
  
  // Handle subdomain redirects
  const mainDomain = "qlinichealth.com";
  try {
    const urlObj = new URL(url);
    
    // If it's our domain, allow the redirect
    if (urlObj.hostname === mainDomain || urlObj.hostname.endsWith(`.${mainDomain}`)) {
      return url;
    }
    
    // If it's a localhost development URL, allow it
    if (urlObj.hostname.includes('localhost')) {
      return url;
    }
  } catch (e) {
    // If URL parsing fails, fallback to baseUrl + path
    if (url.startsWith('http')) {
      try {
        const path = new URL(url).pathname;
        return `${baseUrl}${path}`;
      } catch {
        return baseUrl;
      }
    }
    return baseUrl;
  }
  
  // Default fallback
  return baseUrl;
}

  },
});