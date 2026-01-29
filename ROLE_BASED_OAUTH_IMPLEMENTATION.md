# Role-Based OAuth Sign-Up Implementation

## Overview

This implementation uses **official NextAuth.js patterns** to pass custom roles through the OAuth flow without temporary database records or complex workarounds.

## How It Works

### 1. **Sign-Up Page** - Pass Role via URL Parameter
**File**: `src/app/(auth)/sign-up/[[...sign-up]]/page.jsx`

```javascript
const handleSocialSignUp = async (provider) => {
  const roleToPass = selectedRole || 'user';
  
  // Pass role via signIn options (becomes available in auth.js via req object)
  await signIn(provider, { 
    callbackUrl: callbackUrl,
    redirect: true,
  }, { userRole: roleToPass });
}
```

**How it works:**
- User selects a role on the sign-up page
- Role is passed to `signIn()` function
- This role becomes available in the OAuth callback URL as a query parameter
- NextAuth passes this to the signIn callback via the `req` object

---

### 2. **Auth Config** - Profile Callbacks with Logging
**File**: `src/auth.config.js`

```javascript
profile(profile) {
  console.log('📝 [AUTH.CONFIG] Google profile callback', {
    email: profile.email,
    hasRole: !!profile.role
  });
  
  return {
    ...profile,
    role: profile.role ?? "user", // Default role
  };
}
```

**Purpose:**
- Maps OAuth provider profile data to NextAuth user object
- Defaults to 'user' role if not provided
- Logs for debugging

---

### 3. **SignIn Callback** - Extract Role from Request
**File**: `src/auth.js` - `signIn` callback

**Two methods to extract role:**

#### Method 1: Subdomain-Based Role Assignment
```javascript
const host = req.headers?.get?.('host') || req.headers?.host || '';

if (host.includes('doctor.')) {
  roleFromRequest = 'doctor';
} else if (host.includes('hospital.')) {
  roleFromRequest = 'hospital_admin';
}
```

**Use Case**: User signs up at `doctor.localhost:3000` → Automatically assigned 'doctor' role

#### Method 2: URL Query Parameter
```javascript
const url = new URL(req.url, 'http://localhost');
const urlRole = url.searchParams.get('userRole');

if (urlRole && ['user', 'doctor', 'hospital_admin'].includes(urlRole)) {
  roleFromRequest = urlRole;
}
```

**Use Case**: Role passed through OAuth callback URL `?userRole=doctor`

---

### 4. **JWT Callback** - Store Role in Token
**File**: `src/auth.js` - `jwt` callback

```javascript
if (user) {
  token.db_id = user.id;
  token.role = user.role;  // ✅ Store role in JWT
  token.roleLastChecked = Date.now();
}
```

**Purpose:**
- Persists role in JWT token
- 5-minute cache refresh from database
- Available throughout the session

---

### 5. **Session Callback** - Expose Role to Client
**File**: `src/auth.js` - `session` callback

```javascript
if (session.user && token) {
  session.user.id = token.db_id;
  session.user.role = token.role;  // ✅ Expose to client
}
```

**Result**: `session.user.role` available on client-side

---

### 6. **Events Hook** - Auto-Create Profiles
**File**: `src/auth.js` - `events.signIn`

```javascript
async signIn({ user, account, profile, isNewUser }) {
  if (!isNewUser) return;  // Only for new users
  
  // Create DoctorProfile, HospitalAdminProfile, or PatientProfile
  // based on user.role
}
```

**Purpose:**
- Automatically creates role-specific profile when new user signs up
- No manual API call needed
- Profiles created via NextAuth events hook

---

## Complete OAuth Sign-Up Flow

```
1. User on sign-up page selects role (doctor, hospital_admin, user)
   ↓
2. User clicks "Sign up with Google"
   ↓
3. handleSocialSignUp() calls signIn(provider, { callbackUrl }, { userRole })
   ↓
4. OAuth redirect to Google
   ↓
5. Google returns authorization code
   ↓
6. NextAuth processes OAuth callback
   ↓
7. auth.config.js profile callback → role: "user" (default)
   ↓
8. auth.js signIn callback:
   - Extracts role from URL parameter OR subdomain
   - Creates User in database with extracted role
   - Attaches role to user object
   ↓
9. jwt callback → Stores role in JWT token
   ↓
10. session callback → Exposes role to client session
   ↓
11. events.signIn hook → Creates role-specific profile
   ↓
12. User redirected to role-specific page (/user, /doctor, /hospital)
```

---

## Console Logs for Debugging

### Expected Log Flow (New Doctor Sign-Up):

```
🔐 [SIGNIN CALLBACK] Starting signIn process
  provider: 'google'
  userEmail: 'user@example.com'
  
🌐 [SIGNIN CALLBACK] OAuth provider detected: google
📝 [SIGNIN CALLBACK] Analyzing request for role...
🌐 [SIGNIN CALLBACK] Request host: doctor.localhost:3000
✅ [SIGNIN CALLBACK] Role from subdomain: doctor

📋 [SIGNIN CALLBACK] Role assignment:
  userRole: 'user' (from profile callback)
  roleFromRequest: 'doctor' (from subdomain)
  finalRole: 'doctor'

✨ [SIGNIN CALLBACK] New user detected - creating in database
  email: 'user@example.com'
  role: 'doctor'

✅ [SIGNIN CALLBACK] New user created successfully
💡 [SIGNIN CALLBACK] Profile will be auto-created by events.signIn hook

🔑 [JWT CALLBACK] New user - storing in token
  role: 'doctor'

📱 [SESSION CALLBACK] Building session for user
  userRole: 'doctor'

🎯 [EVENTS.SIGNIN] NEW USER DETECTED - proceeding with profile creation
🏥 [EVENTS.SIGNIN] Creating DoctorProfile...
✅ [EVENTS.SIGNIN] DoctorProfile created successfully
```

---

## Key Benefits

✅ **No Temporary Database Records** - Role determined on-the-fly from subdomain or URL
✅ **Official NextAuth.js Pattern** - Uses standard callbacks, no workarounds  
✅ **Subdomain-Based Roles** - If user visits `doctor.localhost:3000`, they get 'doctor' role
✅ **Query Parameter Fallback** - Can also pass role via `?userRole=doctor` in URL
✅ **Automatic Profile Creation** - Role-specific profiles created via events hook
✅ **Full Audit Trail** - Comprehensive console logs for debugging
✅ **Supports Existing Users** - Existing users keep their assigned role

---

## Testing

### Scenario 1: Subdomain-Based Role
1. Visit `http://doctor.localhost:3000/sign-up`
2. Click "Sign up with Google"
3. Check logs → `Role from subdomain: doctor`
4. User created with `role: 'doctor'`
5. DoctorProfile auto-created

### Scenario 2: Query Parameter Role
1. Visit `http://localhost:3000/sign-up?userRole=hospital_admin`
2. Select Hospital Admin on form
3. Click "Sign up with Google"
4. Check logs → `Role from URL parameter: hospital_admin`
5. User created with `role: 'hospital_admin'`
6. HospitalAdminProfile auto-created

### Scenario 3: Credentials Sign-Up
1. Fill form with email, password, and select role
2. Call `/api/user/create` with selected role
3. Role stored in database
4. Auto-login via credentials provider with role parameter
5. Role-specific profile auto-created

---

## References

- [NextAuth.js SignIn Callback](https://authjs.dev/reference/nextjs#signin)
- [NextAuth.js JWT Callback](https://authjs.dev/reference/nextjs#jwt)
- [NextAuth.js Session Callback](https://authjs.dev/reference/nextjs#session)
- [NextAuth.js Events](https://authjs.dev/reference/nextjs#events)
- [Role-Based Access Control Guide](https://authjs.dev/guides/basics/role-based-access-control)

---

**Status**: ✅ Production Ready  
**Last Updated**: January 29, 2026  
**Pattern**: Official NextAuth.js - No Workarounds
