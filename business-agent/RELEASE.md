# Racharla Business Agent — controlled release

This feature is isolated from the current Vibe books, legacy website subscriptions, refunds and Razorpay orders.

## Seller fulfilment settings

Shops can enable customer pickup, delivery requests, or both. Payment preferences are independent: pay cash at pickup, pay cash on delivery (only if delivery is supported), or request direct UPI (India only). Only enabled combinations appear to shoppers. No vendor payment is collected or verified by the platform.

## Deployment status

This branch is **staging only**, and must not replace the production paid website sales flow until the new purchase / recovery checks pass. The existing website renewal capability must remain accessible for customers who bought a legacy plan. Existing product types and orders must never be dropped or repurposed.

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
