# Payment System

Comprehensive payment system documentation:

- **Payment Provider**: Lemon Squeezy (merchant of record)
- **Plans**:

| Plan | Monthly | Yearly | Sessions/Day | Follow-ups | Vehicles |
|------|---------|--------|-------------|------------|----------|
| Trial | Free | Free | 1 | 2 | Unlimited |
| Plus | $6.99 | $67.99 | 5 | 2 | 2 |
| Pro | $12.99 | $124.99 | Unlimited | 5 | 10 |

- **Lemon Squeezy Variant IDs** (CRITICAL - do not change without updating webhook & `Subscription.tsx`):
  - Plus Monthly: `2068458`
  - Plus Yearly: `2068450`
  - Pro Monthly: `2068462`
  - Pro Yearly: `2068467`

- **Payment Flow** (step by step):
  1. User clicks 'Start 7-Day Free Trial' on `Subscription.tsx`
  2. `LemonSqueezy.Url.Open()` is called with the variant ID checkout URL and user email + `userId` in `custom` checkout data.
  3. Lemon Squeezy overlay appears for payment.
  4. On `Checkout.Success` event, client starts polling `profiles` table every 2 seconds.
  5. Lemon Squeezy sends webhook to `lemonsqueezy-webhook` edge function.
  6. Edge function verifies HMAC-SHA256 signature using `LEMON_SQUEEZY_WEBHOOK_SECRET`, determines tier from variant ID, and upserts `profiles` table with the tier, `ls_customer_id`, `ls_subscription_id`, and `subscription_expires_at`.
  7. Client poll detects tier change, refreshes `AuthContext`, navigates to home or complete-profile.
  8. If webhook doesn't arrive within 30 seconds, user is still navigated with a toast notification.

- **Subscription Management**:
  - Active subscribers see 'Manage Billing' button → redirects directly to the generic Lemon Squeezy billing portal URL (`https://repyr.lemonsqueezy.com/billing`).
  - Users can update payment, change plan, or cancel via Lemon Squeezy portal.
  - When cancelled: tier stays active until `subscription_expires_at`, then treated as Trial.

- **Session Limit Enforcement** (dual enforcement):
  1. Client-side (`Home.tsx`): Counts sessions in last 24h, shows upgrade prompt if limit reached. This is a UX optimization only.
  2. Server-side (`diagnostic-ai` edge function): Authoritative check. Counts sessions and returns 403 if limit exceeded. Cannot be bypassed.
  - For Plus tier: The user's very first diagnostic session ever is excluded from the count (bonus session)

- **Tier Expiration Logic**:
  Both `AuthContext.tsx` and `diagnostic-ai` edge function check: if `subscription_expires_at < now`, treat tier as 'Trial' regardless of stored value.
