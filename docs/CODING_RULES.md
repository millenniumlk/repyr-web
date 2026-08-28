Write strict coding rules that any AI MUST follow when editing this project:

### Technology Rules
- Use React 19 with functional components and hooks only
- Use TypeScript for all files (.tsx for components, .ts for logic)
- Use Tailwind CSS 4 for all styling — NO inline styles, NO CSS modules, NO styled-components
- Use Framer Motion for all animations
- Use Lucide React for all icons
- Use TanStack React Query for all data fetching from Supabase (queryKey pattern: ['table_name', user?.id])
- Use the existing Button component (src/components/ui/Button.tsx) — never create new button components
- Use the existing IosAlert component for confirmation dialogs
- Use the existing Toast system (useToast hook from ToastContext)

### File Organization Rules
- New pages go in src/pages/
- New reusable components go in src/components/ or src/components/ui/
- New hooks go in src/hooks/
- New types go in src/types/index.ts
- New utility functions go in src/lib/utils.ts
- New constants go in src/lib/constants.ts
- New edge functions go in supabase/functions/[function-name]/index.ts

### Routing Rules
- All new routes must be added to the router in src/App.tsx
- Protected routes must be wrapped in <ProtectedRoute>
- Public routes (like Terms, Privacy) go outside ProtectedRoute

### Styling Conventions
- Border radius: rounded-[20px] for cards, rounded-full for buttons and chips, rounded-3xl for modals
- Shadows: shadow-soft-card for cards, shadow-button-primary for primary buttons
- Colors: Use CSS variables (text-foreground, text-muted-foreground, bg-card, bg-muted, text-primary, bg-primary)
- Font weights: font-medium for body, font-bold for headings, font-black for logo
- Tracking: tracking-tight for headings, tracking-widest for labels
- Mobile header is hidden on routes in MOBILE_HEADER_EXCLUDED_ROUTES array in MainLayout.tsx

### DO NOT Rules (CRITICAL)
- DO NOT modify the subscription tier logic in AuthContext.tsx or diagnostic-ai edge function without understanding the full payment flow
- DO NOT write subscription_tier directly from client code — only the Paddle webhook can do this
- DO NOT modify the AI system prompt in useDiagnosticAI.ts without explicit user approval — it controls diagnosis quality
- DO NOT remove the input sanitization in useDiagnosticAI.ts — it prevents prompt injection
- DO NOT expose SUPABASE_SERVICE_ROLE_KEY or OPENAI_API_KEY on the client side
- DO NOT change Paddle price IDs without updating the webhook function
- DO NOT cascade delete diagnostic_sessions when deleting vehicles — sessions must be preserved for limit enforcement
- DO NOT remove the server-side session limit check in diagnostic-ai — the client-side check is UX only
- DO NOT modify CORS headers in edge functions without understanding the security implications
- DO NOT remove the HMAC signature verification or replay protection in paddle-webhook
- DO NOT bypass the ProtectedRoute wrapper for pages that require authentication

### Data Access Patterns
- Always scope queries to user_id to prevent IDOR (e.g., .eq('user_id', user.id))
- Use supabase client from src/lib/supabase.ts — never create new clients
- Use React Query for reads (useQuery), direct supabase calls for writes
- Invalidate relevant query keys after mutations (queryClient.invalidateQueries)

### Naming Conventions
- Components: PascalCase (e.g., AddVehicle.tsx)
- Hooks: camelCase with 'use' prefix (e.g., useDiagnosticAI.ts)
- Constants: UPPER_SNAKE_CASE
- Variables/functions: camelCase
- CSS class names: Tailwind utility classes only
