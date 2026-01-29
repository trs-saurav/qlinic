# Authentication Setup - Official NextAuth.js Pattern

## ✅ Implementation Complete

This application uses the **official NextAuth.js v5 pattern** for handling both credential-based and OAuth authentication with role-based user profiles.

---

## Architecture Overview

### 1. Provider Profile Callbacks (`auth.config.js`)
- **Purpose**: Map OAuth provider data to user attributes
- **Implementation**: Each provider (Google, Facebook, Apple) has a `profile()` callback
- **Behavior**: Returns `{ ...profile, role: profile.role ?? "user" }`
- **Default Role**: Assigns `"user"` role if not provided by the OAuth provider

### 2. SignIn Callback (`auth.js`)
- **Purpose**: Handle user authentication and database operations
- **For Credentials**: Validates email, password, and role match
- **For OAuth**: 
  - Checks if user exists in database
  - Creates new user if first-time sign-in
  - Attaches role to user object for JWT/session callbacks
  - Returns `true` to allow sign-in

### 3. JWT Callback (`auth.js`)
- **Purpose**: Store role in JWT token
- **Behavior**:
  - Stores `role` from user object when signing in
  - Implements 5-minute cache refresh to keep role in sync with database
  - Refreshes from database if cache expires
  - Returns token with role attached

### 4. Session Callback (`auth.js`)
- **Purpose**: Expose role to client-side session
- **Behavior**: Copies `token.role` → `session.user.role`
- **Result**: Client can access `session.user.role` after authentication

### 5. Events Hook - signIn (`auth.js`)
- **Purpose**: Create role-specific profiles for new users
- **Triggers On**: New OAuth user creation
- **Behavior**:
  - Creates `DoctorProfile` for role=`"doctor"`
  - Creates `HospitalAdminProfile` for role=`"hospital_admin"`
  - Creates `PatientProfile` for role=`"user"` (default)
- **Non-blocking**: Errors don't fail signin, profile can be created later

---

## User Flow

### OAuth Sign-Up (Google/Facebook/Apple)
```
1. User clicks "Sign up with Google"
2. Google OAuth → Provider profile callback → role: "user" (default)
3. auth.js signIn callback → Create user in DB with role
4. JWT callback → Store role in token
5. events.signIn hook → Create PatientProfile (default role)
6. Session callback → Expose role to client
7. Redirect to /user (role-based routing via middleware)
```

### Credentials Sign-Up
```
1. User fills form with email, password, role selection
2. Frontend calls /api/user/create with role
3. User logs in with credentials provider (role required)
4. JWT & Session callbacks → Role in session
5. Redirect to /doctor, /hospital, or /user
```

---

## File Structure

| File | Purpose |
|------|---------|
| `src/auth.config.js` | OAuth provider configs with profile callbacks |
| `src/auth.js` | Main auth config: signIn, JWT, session, events, redirect |
| `src/app/(auth)/sign-up/page.jsx` | Sign-up form with OAuth and credentials options |
| `src/app/api/user/create/route.js` | Create user account (credentials-based) |
| `src/middleware.js` | Route protection and role-based subdomain routing |
| `src/models/user.js` | User model with role enum |
| `src/models/PatientProfile.js` | Patient-specific profile |
| `src/models/DoctorProfile.js` | Doctor-specific profile |
| `src/models/HospitalAdminProfile.js` | Hospital admin-specific profile |

---

## Key Configuration

### Role Enum
```javascript
// In User model
role: {
  type: String,
  enum: ['user', 'doctor', 'hospital_admin'],
  default: 'user'
}
```

### JWT Strategy
```javascript
session: {
  strategy: 'jwt',
}
```

### Role Cache (5 minutes)
```javascript
// JWT callback refreshes role from DB every 5 minutes
const fiveMinutes = 5 * 60 * 1000;
const shouldRefresh = !token.roleLastChecked || 
                      (Date.now() - token.roleLastChecked > fiveMinutes);
```

---

## Testing the Flow

### OAuth Test
1. Go to `/sign-up`
2. Click "Sign up with Google"
3. Complete Google login
4. User created with `role: "user"` (default)
5. PatientProfile auto-created
6. Redirected to `/user`

### Credentials Test
1. Go to `/sign-up`
2. Fill form with email, password, and select role (doctor/hospital_admin/user)
3. Account created via `/api/user/create`
4. Auto-login triggers credentials provider
5. Corresponding profile created (DoctorProfile/HospitalAdminProfile/PatientProfile)
6. Redirected to role-specific page

---

## No Temporary Workarounds

✅ **Removed**: RoleSelection database model  
✅ **Removed**: /api/auth/role-selection endpoint  
✅ **Removed**: In-memory role storage  
✅ **Removed**: URL parameter role hacks  
✅ **Kept**: Official NextAuth.js callbacks only

---

## Session Object (Client-Side)

```javascript
const session = await getSession();
// session.user contains:
{
  id: "6597c5e1a1b2c3d4e5f6g7h8",  // Database _id
  email: "user@example.com",
  role: "doctor",                    // ✅ Role attached
  name: "John Doe",
  image: "https://..."
}
```

---

## Notes

- **Role Persistence**: Roles are stored in JWT token and refreshed from DB every 5 minutes
- **OAuth Default**: All OAuth sign-ups default to `role: "user"` unless changed via admin dashboard
- **Profile Auto-Creation**: Profiles are created automatically via events.signIn hook
- **No User Input**: OAuth users cannot select role at signup (role assigned post-signup if needed)
- **Subdomain Routing**: Middleware redirects to appropriate subdomain based on role

---

**Last Updated**: Message 26 - Final Implementation  
**Status**: ✅ Production Ready
