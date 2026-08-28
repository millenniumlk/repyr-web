# Authentication System

Document the authentication system:

- **Provider**: Supabase Auth
- **Methods**: Google OAuth, Email/Password
- **Auth Pages**:
  - `Auth.tsx`: Login/signup page with toggle between sign in and sign up modes
  - `AuthCallback.tsx`: Handles OAuth redirect callback, cleans up URL hash fragments

- **AuthContext** (`src/lib/AuthContext.tsx`):
  - Provides: `session`, `user`, `isLoading`, `isGuest`, `guestVehicle`, `subscriptionTier`, `setGuestMode`, `refreshSubscriptionTier`
  - On mount: Gets session, validates against server (catches deleted accounts), fetches subscription tier
  - Listens to auth state changes via `onAuthStateChange`
  - `refreshSubscriptionTier`: re-fetches tier from DB (used after payment)
  - Tier normalization: First letter uppercase, rest lowercase. Validates against `['Trial', 'Plus', 'Pro']`

- **Guest Mode**:
  - Users can browse the app and fill in vehicle details without signing up
  - When they try to start a diagnosis, a modal prompts sign-up
  - Guest data is stored in `localStorage` as `pending_guest_chat` with structure: `{ vehicle, symptoms, needsProfileComplete }`
  - After sign-up:
    1. Guest vehicle is automatically inserted into `vehicles` table
    2. Symptoms are auto-filled and diagnosis starts automatically
    3. If vehicle profile is incomplete, redirected to `CompleteVehicleProfile` page

- **Protected Routes**:
  - `ProtectedRoute` component in `App.tsx` wraps all main app routes
  - Redirects to `/auth` if no session and not guest
  - Guest users can access `/` (Home) but restricted from Garage, History, Settings (modal intercept in `MainLayout`)

- **Session Validation**:
  - On app load, `AuthContext` calls `supabase.auth.getUser()` to validate the session server-side
  - If user is deleted (e.g., from another device), session is cleared and user is signed out
  - URL hash fragments (`access_token`) are cleaned up after OAuth redirect

- **Account Deletion**:
  - `EditProfile.tsx` has delete account functionality
  - Signs out user after deletion
