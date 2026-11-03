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

## Merchant payments and QR implementation — November 3, 2026

- Business owner can enter an INR UPI ID, upload their merchant QR image, and choose whether the customer sees UPI, QR, cash at pickup, cash on delivery, or enquiry-only payment discussions.
- Vendor QR and product photos are uploaded into the scoped `business-agent-images` Supabase bucket on publication; the backend validates payment settings and restricts QR URLs to that bucket.
- Customer cart shows only enabled payment preferences. UPI button opens a `upi://pay` intent **without auto-charging a guessed amount**; the business confirms the final total. Owner QR is displayed with explicit recipient-verification warnings.
- WhatsApp sends an itemized order draft only after the customer presses Send. The platform does not automatically confirm seller receipt or UPI payment status.
- Customer-shop HTML export now embeds eligible image assets up to a bounded size when accessible; external image URLs may still require internet.
- Security hardening: legacy timestamp trigger search paths pinned; `rls_auto_enable()` EXECUTE revoked for anonymous and logged-in roles. Legacy `public_vibe_sites` security-definer view remains unchanged pending compatibility analysis.
- Business Agent Edge Functions deployed: `business-agent-api` version 4 and `business-agent-webhook` version 3 as checked in Supabase. Sales still default to **OFF** via `BUSINESS_AGENT_SALES_ENABLED`.
- Live site external DNS/URL and complete Razorpay captured-payment/refund webhook tests remain **unverified** in this session; do not enable real sales based only on code compilation.

## Final implementation checkpoint — merchant cash/UPI/QR, catalog edits

- Shop owner can update item names, categories, unit prices and optional stock counts; remove, pause or restock items. Customer storefront excludes unavailable items and enforces recorded quantity caps.
- Owner can add a UPI ID or their own merchant QR image, independently enable cash at pickup/delivery, and select an enquiry-only business model. UPI/QR are visible only where vendor settings permit.
- QR image is uploaded to owner-scoped cloud storage, checked for that same owner's folder in the server API, and displayed in hosted and exported customer storefronts.
- Static HTML export embeds eligible image/QR assets for portability (bounded to 18MB total); it does not automatically sync with the hosted shop or verify payments.
- Supabase image bucket write policies now also verify an **active Business Agent license** (read access remains public for product photos/QR intentionally).
- API v6 and webhook v3 deployed as ACTIVE. Direct shop payment is between customer and shop; Razorpay integration is for the one-time Agent license only.
- The product is **not yet certified for paid sales**; `BUSINESS_AGENT_SALES_ENABLED` must remain disabled until Razorpay webhook registration, captured-payment activation and refund/recovery end-to-end tests are performed on an externally accessible live deployment.

## PWA installation and shareable shop links — November 3, 2026

- The vendor dashboard now displays the published shop URL and buttons to copy the link, share through WhatsApp, or use the mobile native share sheet (including posting into eligible social platforms).
- A vendor can send the same public link through WhatsApp, Instagram bio or supported story links, Facebook, SMS or email. Plain Instagram feed captions may not hyperlink URLs.
- The shared `Racharla Shops` web app has a manifest, tested PNG icon dimensions (192 and 512), a network-first service worker, install/dismiss banner, browser-specific installation help, and last-opened-shop restoration in standalone mode.
- The PWA is **shared across vendors**, not individually native-branded or guaranteed installable on all browsers. Customers can bookmark multiple unique shop URLs if needed.
- Hosted catalog checks happen when opened, on refocus after a short interval, on the dedicated Refresh button, and again before generating the WhatsApp order. Changed prices/products cause the in-progress cart to reset rather than silently submitting stale prices. When connection fails, the order is blocked.
- Vendors can add a text offer/announcement, and saving/publishing a shop again makes the new offer available to online customers. The API persists the announcement (deployed as Business Agent API v7).
- Customer-facing notice: **Prices, stock, offers and products may change; refresh before ordering.** Owner confirms final amounts.
- Downloaded standalone shop HTML remains static; its warning tells customers it does **not** sync even after browser Refresh. It includes only the offer at time of export.
- Live domain installation and public hosting propagation still require real external-device verification. Paid checkout remains closed pending Razorpay webhook and end-to-end tests.

Self-service help: `business-agent/OWNER_GUIDE.md`.
