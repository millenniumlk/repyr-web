Step-by-step guides for common maintenance tasks:

### 1. Add a New Page
1. Create the page component in `src/pages/YourPage.tsx`
2. Add the route in `src/App.tsx` in the router configuration
3. If it's a protected page, add it inside the ProtectedRoute children
4. If it's a public page (like Terms), add it outside ProtectedRoute
5. If the page has its own header, add its path to MOBILE_HEADER_EXCLUDED_ROUTES in MainLayout.tsx
6. Add a navigation link in MainLayout.tsx navItems array (if it should appear in sidebar)

### 2. Add a New Supabase Table
1. Create the table in Supabase Dashboard → Table Editor
2. Enable RLS (Row Level Security) on the table
3. Create appropriate RLS policies (e.g., users can only read/write their own rows)
4. Add TypeScript types in `src/types/index.ts`
5. Update `docs/DATABASE_SCHEMA.md` with the new table documentation

### 3. Change Subscription Pricing
1. Create new prices in Paddle Dashboard
2. Update price IDs in `src/pages/Subscription.tsx` (plans array)
3. Update price IDs in `supabase/functions/paddle-webhook/index.ts` (tier determination logic)
4. Update `docs/PAYMENT_SYSTEM.md` with new prices and price IDs
5. Test in sandbox before switching to production

### 4. Add a New Subscription Tier
1. Add the tier name to AuthContext.tsx type union: 'Trial' | 'Plus' | 'Pro' | 'NewTier'
2. Add tier detection logic in paddle-webhook edge function
3. Add tier limit logic in diagnostic-ai edge function
4. Add tier display in Settings.tsx ActionRow
5. Add plan card in Subscription.tsx
6. Update SUBSCRIPTION_LIMITS in constants.ts
7. Update plan_limits table in Supabase

### 5. Modify the AI Diagnostic Behavior
1. The system prompt is in `src/hooks/useDiagnosticAI.ts` (lines 21-51)
2. WARNING: Changes to the prompt directly affect diagnosis quality
3. Test changes thoroughly with multiple diagnostic scenarios
4. The prompt rules are numbered — add new rules at the end to avoid confusion
5. Never remove the prompt injection protection or the JSON output format requirement

### 6. Add a New Edge Function
1. Create `supabase/functions/your-function/index.ts`
2. Use the CORS pattern from existing functions (getCorsHeaders helper)
3. Authenticate users with the Authorization header pattern
4. Deploy: `supabase functions deploy your-function`
5. Set any required secrets in Supabase Dashboard
6. Add function configuration to `supabase/config.toml` if needed

### 7. Update Environment Variables
- **For frontend (VITE_*)**: Update in Vercel Dashboard AND local .env file
- **For edge functions**: Update in Supabase Dashboard → Edge Functions → Secrets
- NEVER commit the .env file to Git
- After changing Vercel env vars, trigger a new deployment

### 8. Add a New UI Component
1. Create in `src/components/ui/YourComponent.tsx`
2. Follow the existing pattern: export the component + use CVA for variants if needed
3. Use Tailwind classes matching the existing design system
4. Use the cn() utility from `src/lib/utils.ts` for conditional classes
