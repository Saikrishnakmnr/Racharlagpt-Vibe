# RacharlaGPT Vibe — Commercial Release 2026-10-05

This release is a coordinated frontend + Supabase database + Edge Function upgrade. Do not delete the existing Supabase project or orders.

## Customer flow
Browse all studios without login → choose product → sign up/log in at purchase → email is saved on the order → Razorpay → server verification + webhook → delivery → Resend payment receipt → Resend ready email → My Orders.

## Vibe website media
Customers can optionally upload 1 logo/shop image and up to 3 public showcase images. These are stored in the public `site-assets` bucket because the customer intentionally chose them for a public website.

## Supabase upgrade
1. Run `database.sql` in the existing project. It is written as an upgrade and uses `ADD COLUMN IF NOT EXISTS` for new fields.
2. Deploy every function under `supabase/functions/`.
3. Set secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `GEMINI_API_KEY_1`, optional `GEMINI_API_KEY_2`, `GEMINI_MODEL=gemini-3.8-flash`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Configure Razorpay webhook to the deployed `razorpay-webhook` function. Subscribe to `payment.captured` and refund events used by your account.
5. Enable Supabase Auth email/password **and Google**. Configure the production Site URL as `https://vibe.racharlagpt.in` and the exact production redirect URL as `https://vibe.racharlagpt.in/`.
6. Configure Supabase Auth SMTP for production password-reset emails.
7. Replace GitHub Pages files with this package.

## Important
- Never put Gemini, Razorpay secret, Resend or Supabase service-role keys in frontend files.
- Test in Razorpay Test Mode before LIVE.
- Existing paid orders should be recovered, not repaid.
- GA4 and Monetag remain optional and can be added later.


## Authentication added in this release

The customer account UI now includes Email + Password, **Continue with Google**, Forgot password, secure reset-password, persistent sessions, and account-linked My Orders. A single Supabase Auth client is reused to avoid duplicate session listeners and related browser warnings.
