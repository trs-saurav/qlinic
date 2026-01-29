# Credential-Based Authentication Fixes

## Problem
OAuth was working, but sign-in and sign-up with credentials (email/password) was not functioning.

## Root Causes Identified & Fixed

### 1. **Missing Credentials Provider ID and Name**
**File**: `src/auth.js`

**Issue**: The Credentials provider was missing the explicit `id` and `name` fields, which NextAuth.js requires to properly route credentials-based authentication requests.

**Fix**:
```javascript
Credentials({
  id: 'credentials',           // ✅ ADDED
  name: 'Credentials',          // ✅ ADDED
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
    role: { label: "Role", type: "text" }
  },
  // ... authorize function
})
```

---

### 2. **Incomplete Credentials Validation**
**File**: `src/auth.js` - Credentials Provider `authorize` function

**Issues**:
- Poor error logging made debugging difficult
- Role validation was too strict (always required exact match)
- Email wasn't being normalized consistently
- Password field selection wasn't properly handled

**Fixes**:
```javascript
async authorize(credentials) {
  try {
    // ✅ Validate required fields
    if (!credentials?.email || !credentials?.password) {
      console.error('[CREDENTIALS] Missing email or password');
      return null;
    }

    await connectDB()

    // ✅ Normalize email consistently
    const user = await User.findOne({ 
      email: credentials.email.toLowerCase().trim() 
    }).select('+password')

    if (!user) {
      console.error('[CREDENTIALS] User not found:', credentials.email);
      return null;
    }

    // ✅ FIXED: Only validate role if provided
    // If role is provided and doesn't match, reject
    if (credentials.role && credentials.role !== user.role) {
      console.error('[CREDENTIALS] Role mismatch');
      return null;
    }

    // ✅ Better password validation
    const isValid = await user.comparePassword(credentials.password)
    if (!isValid) {
      console.error('[CREDENTIALS] Password invalid');
      return null;
    }

    // ✅ Return properly formatted user
    const authorizedUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.fullName || `${user.firstName} ${user.lastName}`,
      role: user.role,
      image: user.profileImage,
    };

    console.log('[CREDENTIALS] ✅ Authorization successful');
    return authorizedUser;
  } catch (error) {
    console.error('[CREDENTIALS] Authorization error:', error.message);
    console.error('[CREDENTIALS] Stack:', error.stack);
    return null
  }
}
```

---

### 3. **Broken SignIn Event for Credentials Users**
**File**: `src/auth.js` - `events.signIn` handler

**Issue**: The signIn event was checking for `account?.provider` and skipping profile creation if not present. For credentials-based auth, there's NO `account` object, so profiles were never being created.

**Root Cause**: Credentials users have profiles created by `/api/user/create` endpoint, but OAuth users need profiles created in the signIn event. The code wasn't distinguishing between these cases.

**Fix**:
```javascript
events: {
  async signIn({ user, account, profile, isNewUser }) {
    const provider = account?.provider || 'credentials'
    console.log(`[SIGNIN_EVENT] Provider: ${provider}`);
    
    // ✅ FIXED: Only create profiles for OAuth users
    // Credentials users have profiles created by /api/user/create endpoint
    if (provider === 'credentials') {
      console.log(`[SIGNIN_EVENT] Credentials user - profile already created by signup API`);
      return;
    }
    
    // OAuth user logic continues...
  }
}
```

---

### 4. **Improved User Creation API**
**File**: `src/app/api/user/create/route.js`

**Improvements**:
- Better error logging for debugging
- Proper user rollback on profile creation failure
- Clear success/failure responses
- Validation of all required fields

```javascript
export async function POST(req) {
  let createdUser = null;
  
  try {
    // ... validation code ...
    
    // Track created user for rollback
    try {
      createdUser = await User.create({
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
        email: email.toLowerCase().trim(),
        password,
        role,
        isProfileComplete: false,
      })
      console.log('[USER_CREATE] User created successfully');
    } catch (createError) {
      throw new Error(`User creation failed: ${createError.message}`)
    }
    
    // Create profile...
    
    return NextResponse.json({
      success: true,
      user: { /* user data */ },
      profile: { /* profile data */ },
    }, { status: 201 })

  } catch (error) {
    // ✅ Rollback user if profile creation failed
    if (createdUser && requestBody?.email) {
      try {
        await User.findByIdAndDelete(createdUser._id)
        console.log('[USER_CREATE] User rolled back successfully');
      } catch (rollbackError) {
        console.error('[USER_CREATE] Rollback failed');
      }
    }
    // ... error response
  }
}
```

---

### 5. **Enhanced Frontend Error Logging**
**Files**: 
- `src/app/(auth)/sign-in/SignInClient.jsx`
- `src/app/(auth)/sign-up/[[...sign-up]]/page.jsx`

**Improvements**:
- Added console logs for debugging credential auth flow
- Better error messages for users
- Request/response logging
- Detailed error handling for different failure scenarios

---

## Authentication Flow (After Fixes)

### Sign-Up Flow:
1. User fills form (email, password, role) → SignUp page
2. `POST /api/user/create` creates user and role-specific profile
3. Frontend calls `signIn('credentials', { email, password, role })`
4. Credentials provider validates credentials
5. JWT callback sets token with user data
6. Session callback exposes role and id
7. User redirected to role-based dashboard

### Sign-In Flow:
1. User enters email/password/selects role → SignIn page
2. Frontend calls `signIn('credentials', { email, password, role })`
3. Credentials provider validates credentials
4. JWT callback sets token with user data
5. Session callback exposes role and id
6. User redirected to role-based dashboard

---

## Testing Checklist

- [ ] Create new patient account via sign-up
- [ ] Sign in as patient with credentials
- [ ] Create new doctor account via sign-up
- [ ] Sign in as doctor with credentials
- [ ] Create new hospital admin account via sign-up
- [ ] Sign in as hospital admin with credentials
- [ ] Test invalid credentials (wrong password)
- [ ] Test invalid credentials (user not found)
- [ ] Test role mismatch (sign in as user on doctor account)
- [ ] Verify profiles are created correctly for each role
- [ ] Check browser console for credential debug logs
- [ ] Verify OAuth still works (sign-up/sign-in with Google/Facebook/Apple)

---

## Environment Variables Needed

Ensure these are set in `.env.local`:
```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3001 (or your domain)

# OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
APPLE_CLIENT_SECRET=...
```

---

## Key Files Modified

1. `src/auth.js` - Credentials provider + signIn event fixes
2. `src/app/api/user/create/route.js` - Better error handling & logging
3. `src/app/(auth)/sign-in/SignInClient.jsx` - Enhanced error logging
4. `src/app/(auth)/sign-up/[[...sign-up]]/page.jsx` - Enhanced error logging

---

## Notes

- The `role` parameter is optional during sign-in (defaults to 'user')
- Email is always normalized to lowercase and trimmed
- Passwords are hashed using bcrypt with salt rounds = 10
- Profiles are created during sign-up, not during sign-in
- OAuth users still get profiles created during their first sign-in
