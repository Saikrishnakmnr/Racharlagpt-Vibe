# Racharla Business Agent — controlled release

This feature is isolated from the current Vibe books, legacy website subscriptions, refunds and Razorpay orders.

## Seller fulfilment settings

Shops can enable customer pickup, delivery requests, or both. Payment preferences are independent: pay cash at pickup, pay cash on delivery (only if delivery is supported), or request direct UPI (India only). Only enabled combinations appear to shoppers. No vendor payment is collected or verified by the platform.

## Deployment status

The Business Agent preview is now merged into GitHub `main` (the hosting deployment still requires public URL verification). The live purchase release is **NOT ENABLED** and must remain locked until the captured-payment, webhook and refund tests pass. The existing website renewal capability must remain accessible for customers who bought a legacy plan. Existing product types and orders must never be dropped or repurposed.

### Required production checks

- Server-side fixed price (₹999) and Razorpay captured signature, idempotent activation, refund revocation.
- Separate Business Agent license, merchant inventory, shop identity, and ownership authorization.
- Hosted product images in a private seller-managed bucket with safe public renditions; prevent cross-tenant editing.
- Customer order notes use WhatsApp click-to-chat and require the customer to press Send.
- An exported static HTML catalog is not live-synced to the owner. Hosting and third-party uptime cannot be guaranteed forever.
- Automated retry and customer entitlement recovery without admin intervention.
- Proper support contact, cancellation/refund terms, consumer disclosures, privacy policy, GA4 consent and advertising placement.
- Verify mobile flows including pickup-only and zero payment modes, international phone numbers, out-of-stock products and canceled WhatsApp send.

## Supabase

Additive schema migration `business_agent_isolated_foundation` was already applied to Vibe project `reaxalfzsjhanlfkzotp`. Do not reapply duplicate copies or modify old `orders` / `sites`. All new tables are RLS protected and intended to be used through authenticated APIs only.

## Implementation checkpoint — 2026-11-03

- GitHub staging includes a standalone premium studio and owner-selectable pickup, delivery and payment preferences.
- The customer-view cart prepares itemized WhatsApp orders; payment is not collected or verified.
- The **downloadable offline premium package** (provided separately in ChatGPT) additionally has HTML export and was browser-smoke-tested for pickup-only and delivery-only combinations. This repository branch's smaller standalone app is not a complete replacement for that export/publishing pipeline.
- Vibe navigation on this branch links to the Business Agent preview; old site records and the legacy website route are preserved.
- GA4 and Monetag fields in `config.js` are currently empty placeholders. Do not claim analytics/ads are running without configuration and consent assessment.
- No business-agent Razorpay checkout, automated license issuance, durable public hosted catalog, or refund revocation has been activated. This branch remains **DRAFT / NOT READY TO MERGE**.

## Production deployment snapshot — November 3, 2026

- Supabase Edge Functions `business-agent-api` and `business-agent-webhook` have been deployed to Vibe (`reaxalfzsjhanlfkzotp`).
- Additive tables `business_agent_purchases`, `business_agent_licenses`, `business_agent_shops` and the public, owner-scoped `business-agent-images` bucket are installed.
- `public.rls_auto_enable()` anonymous/authenticated EXECUTE permission has been revoked.
- `BUSINESS_AGENT_SALES_ENABLED` defaults to disabled. **Do not set to true** until webhook subscription, payment test, refund revocation and recovery tests are completed.
- Razorpay webhook URL: `https://reaxalfzsjhanlfkzotp.supabase.co/functions/v1/business-agent-webhook`. Register `payment.captured` and `refund.processed` in Razorpay, with a secret matching server `BUSINESS_AGENT_WEBHOOK_SECRET` or existing `RAZORPAY_WEBHOOK_SECRET`.
- New public shops use `/business-agent/index.html?shop=<slug>` and vendor photos use `business-agent-images` Supabase Storage. Owner operations require valid Supabase Auth bearer session and active license.
- Existing Razorpay checkout and webhook code for other Vibe products have **not** been replaced.
- The branch's static HTML and cloud JS passed syntax and DOM-target checks; there is not yet a documented complete, captured test payment and refund cycle. For launch, an end-to-end hosted browser test, user sign-in test and Razorpay test-mode webhooks are still mandatory.

## Public preview launch checkpoint

- GitHub main now contains the Business Agent entry point, cloud editor, idea-based layouts and downloadable storefront HTML template.
- Vibe old website-sales navigation/pricing was replaced with the new Agent preview; original renewal route and 14 pre-existing orders remain intact.
- Services may select appointment/quotation enquiries without offering delivery, pickup or upfront payment.
- Hosted shop images use the separate `business-agent-images` bucket with authenticated vendor-folder write policies.
- The Supabase backend is ACTIVE and payment collection is still gated OFF.
- Public URL should be verified independently: `https://vibe.racharlagpt.in/business-agent/index.html` (could not externally confirm hosting propagation from this tool session).
- Before enabling sales, add/verify live Razorpay webhook subscription to `https://reaxalfzsjhanlfkzotp.supabase.co/functions/v1/business-agent-webhook` for `payment.captured` and `refund.processed`, using a matching server-side webhook secret. Complete Razorpay test-mode checkout, failed-payment, refund, account recovery and live shop QA. Without that, do not tell customers they can buy today.
- Unresolved pre-existing database advisories include `public.public_vibe_sites` security-definer view and three mutable function search paths; change only after assessing legacy website access. `public.rls_auto_enable()` public execute has been revoked and verified.
