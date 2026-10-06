# RacharlaGPT Vibe — Full Replacement Release

## Upload

Replace the old GitHub Pages files with the contents of this folder. Keep `CNAME` as `vibe.racharlagpt.in`.

## Supabase

Run the complete `database.sql` in the existing project. It is written to upgrade the existing schema and also works on a clean install. Then deploy every folder under `supabase/functions/` and use `supabase/config.toml`.

Required Edge Function secrets:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY_1`
- `GEMINI_API_KEY_2` (optional fallback)
- `GEMINI_MODEL=gemini-3.8-flash`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ADMIN_TOKEN`

Do not commit secret values.

## Razorpay webhook

Use the deployed URL:

`https://<project-ref>.supabase.co/functions/v1/razorpay-webhook`

Create your own long random webhook secret in Razorpay Dashboard → Webhooks → Add New Webhook. Put the exact same secret in the Supabase secret `RAZORPAY_WEBHOOK_SECRET`. This is **not** the Razorpay API secret.

Use the payment/refund events supported by your Razorpay account, including `payment.captured` and the refund event you use for reconciliation.

## Google login

Follow `AUTH_SETUP.md`. Google must be enabled in Supabase Auth; frontend code cannot enable the provider by itself.

## Resend

Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` as Edge Function secrets. Payment receipt and delivery emails are sent server-side and use deterministic idempotency keys.

Password-reset mail is controlled by Supabase Auth SMTP, not the Edge Function Resend key.

## Customer recovery

A paid order never requires another payment because generation/delivery failed. My Orders exposes retry/recovery actions. The Order ID is a reference; the private recovery/download token is treated as a credential.

## Vibe website media

Customers may upload:

- 1 optional logo/shop image
- Up to 3 optional showcase images

These are placed in the public `site-assets` bucket because the customer intentionally selected them for the public website.
