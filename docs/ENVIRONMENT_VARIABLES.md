# Environment Variables

## Client-Side (.env file, prefixed with VITE_)
| Variable | Description | Where to get it |
|----------|-------------|------------------|
| VITE_SUPABASE_URL | Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anonymous/public key | Supabase Dashboard → Settings → API → anon/public key |
| VITE_GA_MEASUREMENT_ID | Google Analytics 4 Measurement ID | Google Analytics → Admin → Data Streams → Measurement ID |
| VITE_PADDLE_TOKEN | Paddle client-side token | Paddle Dashboard → Developer Tools → Client-side tokens |
| VITE_PADDLE_ENV | Paddle environment ('sandbox' or 'production') | Set manually based on whether testing or live |

## Server-Side (Supabase Edge Function secrets)
| Variable | Description | Where to get it |
|----------|-------------|------------------|
| SUPABASE_URL | Auto-provided by Supabase | Automatically available in edge functions |
| SUPABASE_ANON_KEY | Auto-provided by Supabase | Automatically available in edge functions |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key (admin access, NEVER expose to client) | Supabase Dashboard → Settings → API → service_role key |
| OPENAI_API_KEY | OpenAI API key for GPT-4o | OpenAI Dashboard → API Keys |
| PADDLE_WEBHOOK_SECRET | Paddle webhook signing secret | Paddle Dashboard → Developer Tools → Notifications → Webhook Secret |
| PADDLE_API_KEY | Paddle server-side API key | Paddle Dashboard → Developer Tools → API Keys |
| PADDLE_ENV | 'production' or 'sandbox' | Set in Supabase Dashboard → Edge Functions → Secrets |
| ALLOWED_ORIGIN | Production domain (https://repyrai.com) | Set in Supabase Dashboard → Edge Functions → Secrets |

> [!WARNING]
> - **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` to the client.
> - The `.env` file is in `.gitignore` and should **NEVER** be committed to version control.
> - Edge function secrets should be set via the Supabase Dashboard, not in the client `.env` file.
