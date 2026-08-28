# Repyr Project Rules

Read `AI_INSTRUCTIONS.md` in the project root before making any changes.
For detailed documentation, read the relevant files in the `docs/` folder.

## Quick Reference

- **Stack**: React 19 + TypeScript + Tailwind CSS 4 + Supabase + Vite 8
- **AI**: OpenAI GPT-4o via Supabase Edge Function (NOT client-side)
- **Payments**: Paddle (webhook is ONLY trusted source for tier changes)
- **Hosting**: Vercel

## Critical Rules

1. NEVER write `subscription_tier` from client code — only the Paddle webhook can
2. NEVER expose SUPABASE_SERVICE_ROLE_KEY or OPENAI_API_KEY to the client
3. NEVER modify the AI system prompt without explicit approval
4. NEVER remove input sanitization in useDiagnosticAI.ts
5. NEVER remove server-side session limit check in diagnostic-ai edge function
6. NEVER cascade-delete diagnostic_sessions when deleting vehicles
7. NEVER change Paddle price IDs without updating both Subscription.tsx AND paddle-webhook
8. NEVER remove HMAC verification or replay protection in paddle-webhook
9. Always scope DB queries to user_id (prevents IDOR)
10. Use existing UI components (Button, IosAlert, Toast, EmptyState, Skeleton)

## File Placement

- Pages → `src/pages/`
- Components → `src/components/` or `src/components/ui/`
- Hooks → `src/hooks/`
- Types → `src/types/index.ts`
- Constants → `src/lib/constants.ts`
- Edge functions → `supabase/functions/[name]/index.ts`
- Routes → `src/App.tsx`

## Styling

- Tailwind CSS only (no inline styles, no CSS modules)
- Use CSS variables: text-foreground, bg-card, text-primary, bg-muted, etc.
- Cards: rounded-[20px], Buttons: rounded-full, Modals: rounded-3xl
- Animations: Framer Motion (AnimatePresence + motion.div)
- Icons: Lucide React
