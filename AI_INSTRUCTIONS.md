# Repyr — AI Maintenance Instructions

> **Read this file FIRST before making any changes to this project.**
> This file gives you everything you need to understand the codebase and make safe, consistent changes.

---

## What Is Repyr?

Repyr is an **AI-powered vehicle diagnostic web application**. Users describe their car symptoms, and an AI diagnostician (GPT-4o) asks targeted follow-up questions to identify the exact failing component with confidence scores and localized repair cost estimates.

- **Live URL**: https://repyrai.com
- **Users**: Car owners who want quick, affordable preliminary diagnostics before visiting a mechanic

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 6, Vite 8, Tailwind CSS 4 |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **State** | React Context (Auth, Toast) + TanStack React Query |
| **Database** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **Payments** | Paddle (checkout overlay + webhook) |
| **AI Engine** | OpenAI GPT-4o (called from Supabase Edge Function, NOT from client) |
| **Hosting** | Vercel (static SPA) |
| **Analytics** | Google Analytics 4 |

---

## Project Structure

```
repyr-web/
├── src/
│   ├── App.tsx                    # Router + route definitions + ProtectedRoute
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Global styles + Tailwind
│   ├── components/
│   │   ├── DiagnosticChat.tsx      # AI chat UI (messages, probabilities, diagnosis card)
│   │   ├── ChatInputBar.tsx        # Fixed bottom input bar + quick options
│   │   └── ui/                     # Button, EmptyState, IosAlert, Skeleton, Toast
│   ├── hooks/
│   │   └── useDiagnosticAI.ts      # Core hook: AI chat session, messages, probabilities
│   ├── layouts/
│   │   └── MainLayout.tsx          # Sidebar + mobile drawer + header
│   ├── lib/
│   │   ├── AuthContext.tsx          # Auth provider: session, user, guest, subscription tier
│   │   ├── ToastContext.tsx         # Toast notifications
│   │   ├── constants.ts            # Vehicle categories, subscription limits
│   │   ├── supabase.ts             # Supabase client
│   │   └── utils.ts                # cn() class merge utility
│   ├── pages/                      # 15 page components (Home, Auth, Garage, History, etc.)
│   └── types/
│       └── index.ts                # Vehicle, ChatMessage, DiagnosticProbability interfaces
├── supabase/
│   └── functions/
│       ├── diagnostic-ai/          # AI diagnostic edge function (OpenAI + session limits)
│       ├── paddle-webhook/         # Payment webhook (signature verification + tier updates)
│       └── paddle-portal/          # Customer billing portal session
├── docs/                           # Detailed documentation (read as needed)
├── .env                            # Environment variables (NEVER commit)
├── vercel.json                     # Vercel config (security headers + SPA rewrites)
└── package.json                    # Dependencies
```

---

## Database Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts: id, email, full_name, avatar_url, subscription_tier, paddle_customer_id, subscription_expires_at |
| `vehicles` | User's vehicles: make, model, year, mileage, fuel_type, transmission, location |
| `diagnostic_sessions` | Diagnostic chats: vehicle info (denormalized), chat_history (jsonb), status, final_probabilities |
| `plan_limits` | Per-plan session limits (Plus=5, Pro=unlimited) |
| `user_daily_usage` | View showing sessions used/remaining per user today |

---

## Subscription Tiers

| Tier | Cost | Sessions/Day |
|------|------|-------------|
| Trial | Free | 1 |
| Plus | $6.99/mo | 5 |
| Pro | $12.99/mo | Unlimited |

---

## ⚠️ CRITICAL RULES — DO NOT VIOLATE

### 1. Payment System
- **NEVER** write `subscription_tier` directly from client code
- The Paddle webhook (`paddle-webhook` edge function) is the **ONLY** trusted source for tier changes
- **NEVER** change Paddle price IDs without updating both `Subscription.tsx` AND `paddle-webhook/index.ts`
- **NEVER** remove the HMAC signature verification or replay protection in `paddle-webhook`

### 2. Security
- **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` to the client
- **NEVER** remove input sanitization in `useDiagnosticAI.ts` (prevents prompt injection)
- **NEVER** remove the server-side session limit check in `diagnostic-ai` edge function
- Always scope database queries to `user_id` to prevent IDOR attacks
- **NEVER** remove CORS restrictions in edge functions

### 3. AI Diagnostic Engine
- **NEVER** modify the AI system prompt in `useDiagnosticAI.ts` without explicit approval
- **NEVER** remove the JSON output format requirement from the system prompt
- The AI must identify the EXACT failing component — never generic categories

### 4. Data Integrity
- **NEVER** cascade-delete `diagnostic_sessions` when deleting vehicles (sessions must be preserved for limit enforcement)
- When deleting a vehicle, set `vehicle_id = null` on associated sessions (this is already implemented)

---

## Key Patterns to Follow

| Pattern | How |
|---------|-----|
| New page | Create in `src/pages/`, add route in `App.tsx`, wrap in `<ProtectedRoute>` if auth required |
| New component | Create in `src/components/` or `src/components/ui/` |
| Data fetching | Use TanStack React Query with `queryKey: ['table_name', user?.id]` |
| Mutations | Direct Supabase call + `queryClient.invalidateQueries()` |
| Styling | Tailwind CSS only. Use existing CSS variables (text-foreground, bg-card, etc.) |
| Icons | Import from `lucide-react` |
| Buttons | Use existing `<Button>` component with variants: default, outline, ghost, destructive, secondary |
| Confirmation dialogs | Use existing `<IosAlert>` component |
| Toast notifications | Use `useToast()` hook from ToastContext |
| Animations | Use Framer Motion (motion.div with AnimatePresence) |

---

## Detailed Documentation

For deeper information, read these files in the `docs/` folder:

| Document | When to read |
|----------|-------------|
| `docs/PROJECT_OVERVIEW.md` | Understanding the full app and user flows |
| `docs/ARCHITECTURE.md` | Understanding how all pieces connect |
| `docs/DATABASE_SCHEMA.md` | Adding/modifying database tables |
| `docs/ENVIRONMENT_VARIABLES.md` | Setting up environment variables |
| `docs/EDGE_FUNCTIONS.md` | Modifying or adding Supabase edge functions |
| `docs/PAYMENT_SYSTEM.md` | Anything related to subscriptions, pricing, Paddle |
| `docs/AUTH_SYSTEM.md` | Anything related to login, signup, guest mode |
| `docs/AI_DIAGNOSTIC_ENGINE.md` | Modifying the AI diagnostic behavior |
| `docs/DEPLOYMENT.md` | Deploying to Vercel or Supabase |
| `docs/CODING_RULES.md` | Complete coding standards and conventions |
| `docs/COMMON_TASKS.md` | Step-by-step guides for frequent changes |
| `docs/UI_DESIGN_SYSTEM.md` | UI patterns, colors, animations, layout conventions |

---

## Environment Variables

### Client (.env)
| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics ID |
| `VITE_PADDLE_TOKEN` | Paddle client token |
| `VITE_PADDLE_ENV` | `sandbox` or `production` |

### Server (Supabase Edge Function Secrets)
| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI API access |
| `PADDLE_WEBHOOK_SECRET` | Webhook signature verification |
| `PADDLE_API_KEY` | Paddle server API access |
| `PADDLE_ENV` | `sandbox` or `production` |
| `ALLOWED_ORIGIN` | CORS allowed origin (https://repyrai.com) |

---

*Last updated: August 2026*
