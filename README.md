# Racharla Business Agent — ₹99/month business website builder

RacharlaGPT Vibe now focuses its public homepage on **Racharla Business Agent**. A local shop can create its own catalog website, receive WhatsApp order requests, update prices and products, confirm payments manually, and track order statuses — from one owner dashboard.

**Current paid-release state:** Preview and code are available; `BUSINESS_AGENT_MONTHLY_SALES_ENABLED` is intentionally unset/disabled until Razorpay live captured-payment, activation, recovery and refund tests pass. **Do not enable live ₹99 charges without those tests.**

## Product URLs

- Sales homepage: `https://vibe.racharlagpt.in/`
- New monthly shop builder: `https://vibe.racharlagpt.in/business-agent/monthly.html`
- Customer shop: `https://vibe.racharlagpt.in/business-agent/monthly.html?shop=<shop-slug>`
- Earlier Vibe product orders and renewals: `https://vibe.racharlagpt.in/legacy.html#orders`
- Old Business Agent builder route `/business-agent/index.html` redirects to the ₹99 app and attempts to carry the existing browser-local draft forward.

## Owner value and admin-controlled promotional pricing

The storefront displays a crossed-out **₹499 planned regular monthly rate** with a prominent **₹99/month Launch Offer**. The planned amount is explicitly labeled **not a former selling price** unless evidence of genuine historical sales supports that wording.

The actual charged monthly amount, comparison amount, comparison description, offer title, detailed offer description and optional expiry date are editable through the protected [Pricing Admin](https://vibe.racharlagpt.in/admin-pricing.html) page.

- Admin verifies access with the same server-side `ADMIN_TOKEN` used by the existing Vibe admin backend. The token is **not embedded or stored** in the public UI.
- The admin changes `business_agent_pricing` using the dedicated `business-agent-pricing-admin` Edge Function. Pricing changes are also tracked in `business_agent_pricing_audit`.
- Current defaults: actual charge 9900 paise (₹99), planned comparison 49900 paise (₹499), reference kind `planned`.
- The public sales page and owner checkout screen fetch the live offer and current price from the API. The actual Razorpay order amount is **always created server-side** from current pricing settings.
- Existing unfinished Razorpay orders preserve their originally quoted price; renewal activation, recovery and refund reconciliation all use the amount recorded with the specific purchase, not a later admin price.
- The `BUSINESS_AGENT_MONTHLY_SALES_ENABLED` gate stays OFF until payment validation and full refund testing are complete, independent of any promotional price change.
- To describe a number as a genuine *former selling price* rather than a proposed future rate, the administrator must explicitly confirm prior actual sale history.
- The expiry date ends the marketing badge automatically. It **does not automatically raise the actual charged price**; the admin must set a new rate deliberately.

## Pricing and cancellation

**₹99 INR for one prepaid calendar month, manually renewed**. The merchant is never automatically debited for another month. They can stop by not renewing. Upon expiry, the public storefront no longer accepts new online orders, but the business details and catalog remain stored for subsequent reactivation. Renewing the same account extends its paid-through date; it does not create a second shop.

Earlier legitimate Business Agent licenses, if any, remain recognized as an entitlement for continuity.

## Included merchant features

- 5-step guided owner flow: business details → catalog → customer payment options → activate month → publish.
- Industry-specific text and brand styling for vegetables, groceries, food, salons, photography, wholesale, etc.
- Up to 200 items; add/edit/pause/delete prices, units, photos, and stock.
- Owner name, full shop address, map link, banner image or branded fallback banner.
- Pickup/delivery/appointments, configurable delivery charge, cash/UPI/merchant QR.
- Secure per-owner catalog and photo storage; published updates visible to online customers.
- Customer searches categories and product names; adds quantities to a cart, accepts sharing terms, confirms fresh pricing and receives an order reference.
- Customer opens WhatsApp with an itemized draft and **manually taps Send**.
- Owner order dashboard tracks references, acceptance, packing, dispatch, completion and manually verified customer payments.
- Customer payments go directly to the merchant. The platform does not process or automatically verify these payments.
- Shared installable PWA shell where supported. This is not a separate native Android/iOS app for each vendor.

## Technical architecture

- Static frontend: `index.html`, `business-agent/monthly.html`, `monthly-core.js`, `monthly-vendor.js`, `monthly-customer.js`, `monthly-orders.js`, `monthly-init.js`.
- Supabase Auth, Postgres and Storage. Important tables: `business_agent_monthly_accounts`, `business_agent_monthly_purchases`, `business_agent_customer_orders`, `business_agent_shops`.
- Edge Functions: `business-agent-monthly-api` and `business-agent-monthly-webhook`.
- Existing Vibe app remains at `legacy.html`, with original Vibe purchase/renewal data unchanged.

The pricing model intentionally uses **manual prepaid renewal**, not Razorpay Subscriptions/auto-debit. For owner fees only, Razorpay is used to create a ₹99 order, verify the captured payment and extend one calendar month. The shop customer's own UPI, QR or cash payment does not pass through Razorpay.

## Launch configuration

Cloud environment needs: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `BUSINESS_AGENT_MONTHLY_WEBHOOK_SECRET`. The webhook needs a matching configured Razorpay subscription for `payment.captured` and `refund.processed` sent to:

`https://reaxalfzsjhanlfkzotp.supabase.co/functions/v1/business-agent-monthly-webhook`

The `BUSINESS_AGENT_MONTHLY_SALES_ENABLED=true` flag must be enabled **only after test-mode and live-mode go/no-go checks** (appropriate keys and webhook environment). This gate defaults to closed.

Recommended QA: Android/iPhone signup, draft retention after Back, account isolation, product photo uploads, invalid/duplicate orders, WhatsApp Send, price changes mid-checkout, manual payment status, delivery fee, payment capture/activation, interruption recovery, full refund, expiry, renewal to same shop and legacy Vibe orders.

## Operational limits and costs

The fixed ₹99 price does **not** guarantee unlimited free provider capacity. Monitor Supabase database usage, image storage, bandwidth, transaction attempts and server limits. Product images are resized before upload; catalog entries have a 200-product limit. Consider implementing cumulative storage quotas and a published data-retention policy before accepting high-volume customers.

For existing earlier Vibe feature documentation, use Git history, earlier README releases and `legacy.html`.

**Status:** Code-level integration is implemented and audited; complete live-provider transactions and real-device PWA testing are not yet verified.
