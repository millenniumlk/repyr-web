# Repyr Architecture

## Tech Stack
- **Frontend**: React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Framer Motion
- **State Management**: React Context (AuthContext, ToastContext), TanStack React Query for server state
- **Backend**: Supabase (PostgreSQL database, Auth, Edge Functions)
- **Payments**: Paddle (client-side checkout overlay + server-side webhook)
- **AI**: OpenAI GPT-4o (called from Supabase Edge Function, NOT from client)
- **Hosting**: Vercel (static SPA with rewrites)
- **Analytics**: Google Analytics 4 (react-ga4)
- **Icons**: Lucide React
- **UI**: Custom component library (Button, EmptyState, IosAlert, Skeleton, Toast)

## Project File Structure
```
repyr-web/
├── src/
│   ├── App.tsx                    # Router + route definitions + ProtectedRoute
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Global styles + Tailwind
│   ├── components/
│   │   ├── DiagnosticChat.tsx      # The AI chat UI (messages, typing indicator, diagnosis complete card)
│   │   ├── ChatInputBar.tsx        # Fixed bottom input bar with vehicle selector + quick options
│   │   └── ui/                     # Reusable UI primitives
│   │       ├── Button.tsx          # CVA-based button with variants (default, outline, ghost, destructive, secondary)
│   │       ├── EmptyState.tsx      # Empty state placeholder with icon + CTA
│   │       ├── IosAlert.tsx        # iOS-style confirmation dialog
│   │       ├── Skeleton.tsx        # Loading skeleton
│   │       └── Toast.tsx           # Toast notification
│   ├── hooks/
│   │   └── useDiagnosticAI.ts      # Core hook: manages AI chat session, messages, probabilities
│   ├── layouts/
│   │   └── MainLayout.tsx          # Sidebar (desktop) + mobile drawer + header + guest intercept modals
│   ├── lib/
│   │   ├── AuthContext.tsx          # Auth provider: session, user, guest mode, subscription tier
│   │   ├── ToastContext.tsx         # Toast notification context
│   │   ├── constants.ts            # Vehicle categories, subscription limits
│   │   ├── supabase.ts             # Supabase client initialization
│   │   └── utils.ts                # Utility functions (cn for class merging)
│   ├── pages/
│   │   ├── Home.tsx                # Main page: vehicle selector, category chips, diagnostic chat
│   │   ├── Auth.tsx                # Login/Signup page (Google OAuth + email/password)
│   │   ├── AuthCallback.tsx        # OAuth callback handler
│   │   ├── Garage.tsx              # Vehicle list with delete
│   │   ├── AddVehicle.tsx          # Multi-step vehicle add form
│   │   ├── CompleteVehicleProfile.tsx  # Post-signup vehicle profile completion
│   │   ├── History.tsx             # Completed diagnostic sessions, grouped by time
│   │   ├── Settings.tsx            # Settings hub with profile, subscription, legal links
│   │   ├── EditProfile.tsx         # Edit name, avatar, delete account
│   │   ├── Subscription.tsx        # Pricing cards + Paddle checkout
│   │   ├── GuestIntake.tsx         # Guest vehicle intake form
│   │   ├── Notifications.tsx       # Placeholder notifications page
│   │   ├── Terms.tsx               # Terms & conditions
│   │   ├── Privacy.tsx             # Privacy policy
│   │   └── Support.tsx             # Help & support page
│   └── types/
│       └── index.ts                # TypeScript interfaces (Vehicle, ChatMessage, DiagnosticProbability)
├── supabase/
│   ├── config.toml                 # Supabase function configuration
│   └── functions/
│       ├── diagnostic-ai/index.ts  # AI diagnostic edge function (OpenAI + session management + limits)
│       ├── paddle-webhook/index.ts # Paddle payment webhook (signature verification + tier updates)
│       └── paddle-portal/index.ts  # Customer portal session generator
├── .env                            # Environment variables
├── vercel.json                     # Vercel config (security headers + SPA rewrites)
├── package.json                    # Dependencies
└── vite.config.ts                  # Vite configuration
```

## Data Flow Diagrams

1. **Diagnostic Flow**: User → Home.tsx → useDiagnosticAI hook → Supabase Edge Function (diagnostic-ai) → OpenAI API → Response parsed → Chat UI updated
2. **Payment Flow**: User → Subscription.tsx → Paddle Checkout overlay → Paddle webhook → paddle-webhook edge function → updates profiles table → client polls for tier change
3. **Auth Flow**: User → Auth.tsx → Supabase Auth (Google OAuth or email) → AuthCallback.tsx → AuthContext refreshes session

## Key Architectural Decisions
- Session limits are enforced BOTH client-side (UX optimization) AND server-side (authoritative, in diagnostic-ai edge function)
- Subscription tier is ONLY updated by the Paddle webhook (server-side, using service role key). Client NEVER writes tier directly.
- Chat history is stored in the diagnostic_sessions table as a JSONB array
- The AI system prompt includes strict rules about diagnosis behavior (never conclude on uncertain answers, etc.)
- Input sanitization is done before sending to OpenAI to prevent prompt injection
- CORS is restricted to the production domain and localhost
