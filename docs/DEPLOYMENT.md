### Frontend Deployment (Vercel)
- **Hosting**: Vercel
- **Build Command**: `tsc -b && vite build`
- **Output Directory**: `dist/`
- **Framework Preset**: Vite
- **Node Version**: 18+
- **Environment Variables**: Set in Vercel Dashboard → Settings → Environment Variables
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_GA_MEASUREMENT_ID
  - VITE_PADDLE_TOKEN
  - VITE_PADDLE_ENV
- **vercel.json Configuration**:
  - Security headers: X-Frame-Options DENY, HSTS, nosniff, CSP
  - SPA rewrite: all routes → /index.html
- **Domain**: repyrai.com

### Backend Deployment (Supabase)
- **Edge Functions**: Deployed via Supabase CLI or Dashboard
  - `supabase functions deploy diagnostic-ai`
  - `supabase functions deploy paddle-webhook`
  - `supabase functions deploy paddle-portal`
- **Secrets**: Set via Supabase Dashboard → Edge Functions → Secrets
  - OPENAI_API_KEY
  - PADDLE_WEBHOOK_SECRET
  - PADDLE_API_KEY
  - PADDLE_ENV
  - ALLOWED_ORIGIN
- **Database**: Managed via Supabase Dashboard (no migration files in repo)
- **RLS**: Row Level Security should be enabled on all tables

### Deployment Checklist
1. Ensure all environment variables are set in Vercel
2. Ensure all secrets are set in Supabase
3. Run `npm run build` locally to verify no TypeScript errors
4. Push to main branch (Vercel auto-deploys from Git)
5. Deploy edge functions if changed
6. Test Paddle webhook in sandbox before switching to production
7. Verify CORS origin matches the production domain
