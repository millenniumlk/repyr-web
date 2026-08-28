# Supabase Edge Functions

This document outlines the 3 Supabase Edge Functions used in the Repyr project.

## 1. diagnostic-ai (`supabase/functions/diagnostic-ai/index.ts`)
- **Purpose**: The core AI engine. Handles diagnostic chat sessions with OpenAI GPT-4o.
- **Authentication**: Requires Authorization header (Supabase auth JWT)
- **CORS**: Restricted to `ALLOWED_ORIGIN` env var and localhost
- **Two flows**:
  1. **New Session** (no `sessionId`, has `vehicleData`):
     1. Authenticates user via JWT
     2. Resolves subscription tier from `profiles` table
     3. Checks if `subscription_expires_at` is past → treats as Trial
     4. Enforces daily session limits: Trial=1, Plus=5, Pro=unlimited
     5. For Plus tier: first-ever session doesn't count against the limit (adjusted count)
     6. Creates new `diagnostic_session` row in DB
     7. Sends initial chat context (system prompt + user vehicle complaint) to OpenAI
     8. Stores chat history and AI response in the session
     9. Returns AI response + new `sessionId`
  2. **Follow-up Message** (has `sessionId`, has `newMessage`):
     1. Authenticates user
     2. Looks up existing session (verifies `user_id` matches for security)
     3. Appends new user message to chat history
     4. Sends full chat history to OpenAI
     5. Updates session with new chat history, status, and probabilities
     6. Returns AI response
- **OpenAI Configuration**: `model='gpt-4o'`, `temperature=0.2`, `response_format=json_object`
- **Error Handling**: Returns 403 for limit reached, 400 for validation errors, 500 for OpenAI failures
- **Security**: User can only access their own sessions (`user_id` check on queries)

## 2. paddle-webhook (`supabase/functions/paddle-webhook/index.ts`)
- **Purpose**: Receives Paddle payment webhook events and updates user subscription tiers
- **Authentication**: HMAC-SHA256 signature verification using `PADDLE_WEBHOOK_SECRET`
- **Replay Protection**: Rejects webhooks with timestamps older than 5 minutes
- **Uses service role key** (admin access to DB, bypasses RLS)
- **Handles events**: `subscription.created`, `subscription.updated`, `subscription.canceled`
- **Logic**:
  1. Verifies HMAC-SHA256 signature
  2. Checks timestamp for replay attacks
  3. Extracts `userId` from `custom_data`, `customerId` from data
  4. Determines tier based on price ID:
     - Plus monthly: `pri_01m0cpr7d6thdhf3hcejg7fhvv`
     - Plus yearly: `pri_01m0cpsc7a4m0v52vctzpt1w7s`
     - Pro monthly: `pri_01m0cpwhyjvx26x1jd6rbjddcg`
     - Pro yearly: `pri_01m0cpyqg00gcqpbv628r7v6zv`
  5. Upserts `profiles` table with tier, `paddle_customer_id`, `subscription_expires_at`
- **CRITICAL**: This is the ONLY trusted source for subscription tier changes. Never modify this logic without understanding the payment flow end-to-end.

## 3. paddle-portal (`supabase/functions/paddle-portal/index.ts`)
- **Purpose**: Generates a Paddle Customer Portal session URL so users can manage billing
- **Authentication**: Requires Supabase auth JWT
- **CORS**: Restricted to `ALLOWED_ORIGIN` and localhost
- **Uses service role key** to look up `paddle_customer_id`
- **Logic**:
  1. Authenticates user
  2. Looks up `paddle_customer_id` from `profiles` table
  3. Calls Paddle API to create portal session
  4. Returns the portal URL
- **Environment-aware**: Uses sandbox or production Paddle API based on `PADDLE_ENV`
