# BuildTrack — User Flow

## 1. Registration → Dashboard Flow

```
User Registration
      │
      ▼
Account Created (password hashed with bcrypt, stored in `users` table)
      │
      ▼
User Login (email + password)
      │
      ▼
JWT Generated (contains user_id, email, role; signed with SECRET_KEY)
      │
      ▼
Role Identified (decoded from JWT / fetched user record)
      │
      ▼
Redirect to Role Dashboard
      (ADMIN → /dashboard/admin, PROJECT_MANAGER → /dashboard/project-manager,
       SITE_ENGINEER → /dashboard/site-engineer, CONTRACTOR → /dashboard/contractor,
       WORKER → /dashboard/worker, CLIENT → /dashboard/client)
      │
      ▼
Access Protected Routes (authGuard verifies session, roleGuard verifies permission)
      │
      ▼
Profile Management (view/update full name, phone number, profile image)
      │
      ▼
Logout (JWT discarded client-side; redirected to /auth/login)
```

## 2. Password Reset Flow

```
User clicks "Forgot password?" on the Login page
      │
      ▼
Enters their email on /auth/forgot-password
      │
      ▼
POST /api/v1/auth/forgot-password
      │
      ▼
Backend generates a short-lived JWT reset token (type=password_reset, 30 min expiry)
      │
      ├── Production: token is emailed to the user (SMTP integration point — not yet wired up)
      └── Development (Milestone 1): token is returned directly in the API response
      │
      ▼
User is taken to /auth/reset-password (token pre-filled from the dev response / email link)
      │
      ▼
User enters a new password + confirmation
      │
      ▼
POST /api/v1/auth/reset-password — backend validates token type + expiry, updates
the user's hashed_password
      │
      ▼
User is redirected to /auth/login to sign in with the new password
```

## 3. Unauthorized Access Flow

```
Authenticated user navigates to a route outside their role's permissions
      │
      ▼
roleGuard checks route data.roles against the current user's role
      │
      ▼
Redirect to /unauthorized — a clear "403 Access Denied" screen with a
button back to the user's own dashboard
```

## 4. Session Persistence Flow

```
Page is refreshed / reopened
      │
      ▼
AuthService reads the JWT + cached user object from localStorage
      │
      ▼
If a token exists → user is treated as authenticated; guards allow protected routes
      │
      ▼
If an API call returns 401 (expired/invalid token) → session is cleared and the
user is redirected to /auth/login
```
