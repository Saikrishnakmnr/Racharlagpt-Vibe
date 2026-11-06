# Business Agent operator checklist — November 2026

## Merchant decline / no stock
A merchant must inspect inventory before accepting any request. For an unavailable order, choose **Decline / Cancel** and prepare a positive WhatsApp reply:
"Thank you for choosing our store. Unfortunately, these items are out of stock today, so we cannot fulfill this order. Please try again later or message us for available alternatives. We would be happy to serve you next time."
Customer must not be marked as paid/refunded automatically; owner checks actual payment.

## Monthly renewal and retention
A month's entitlement is determined by the stored `paid_through` timestamp, never by phone date. When expired, public ordering is unavailable while the account remains. The intended grace period is **60 days from paid_through**. Within the grace period, a merchant can renew and continue with their existing storefront. After the grace period, the merchant must prepare a new catalog, while billing records are kept.

A database policy and a `requires_new_shop` flag have been added, but **the renewal countdown and opt-in fresh-start backup controls are implemented; automatic deletion of expired Storage media is not yet implemented or tested**. Do not advertise automatic deletion or reactivation until tests verify behavior. Before irreversible cleanup, provide owner notices, an export option, and retain transaction records under applicable law.

## Admin controls
A separate `business_agent_operations` database record now exists with `new_enrollment_enabled`, `renewal_enabled`, `public_orders_enabled`, `retention_days` and `maintenance_message`. Current defaults are enabled/60 days. The switches are now exposed in the protected `admin-pricing.html` dashboard and enforced in the monthly API for new checkout orders and new customer-order creation. Already-paid public catalogs remain visible when only enrollment is paused. Full physical hosting outages cannot be prevented by an app switch.

Desired operator states:
- **Normal:** accept signups, prepaid monthly payment/renewals, public shop orders.
- **New-sales pause:** stop new payment enrollment, but honor all existing prepaid customers and renewals.
- **Customer orders maintenance:** stop incoming order creation while preserving access to existing orders and catalog details. Explain that customers can contact the shop directly.
- **Renewals pause:** rare administrative maintenance; warn users that renewing is temporarily unavailable.
- **Full infrastructure incident:** no guaranteed service if Supabase, hosting or DNS is down. A maintenance switch alone cannot keep offline shops working during an outage.

## PG/hostel and school requests
Do not add a full hostel/PG room and bed-management module to the initial ₹99 kirana-focused plan. It needs room-sharing variants, occupancy, room dates, safety policies, food inclusions, electricity terms and deposit rules. A separate niche version can be developed after the core retail order/renewal workflow is validated.

## Cost and provider constraints
Supabase Free published limits include approximately 500 MB database, 1 GB file storage, 5 GB uncached egress and 5 GB cached egress, with projects subject to inactivity pausing. Limits can change. Track storage, functions, bandwidth and daily users. The app does not call a generative AI model for every shop operation: its business-design generator is a local keyword/rule-based preset, not a free unlimited AI API.

## Pending tests
- Real payment captured, webhook verification, interrupted recovery, expiry, renewal in grace period, late renewal, refund.
- Owner decline order and customer manual WhatsApp Send, payment receipt, pending and fulfilled order statuses.
- Admin enrollment-pause and preservation of existing customers.
- Warn 30/7/1 days before deletion; export, cleanup, privacy and data-retention requests.
- Two phones; switching merchant accounts; customer stale-price checkout; retained previous Vibe purchases.

## Implemented since initial review

- Protected pricing admin now edits enrollments, renewals, customer ordering, maintenance message and retention days (minimum 60).
- Monthly backend enforces checkout and ordering flags separately and exposes read-only maintenance state.
- Business owner sees expiry/restart guidance and can download a JSON catalog record before explicitly resetting an old draft. The backup may reference hosted image URLs, so merchants should retain original photos separately.
- Late renewal marks the old hosted shop unpublished and requires owner acknowledgement plus a fresh publish. No silent deletion of the prior catalog occurs at payment capture.
- Cancelling out-of-stock orders opens a positive WhatsApp message draft. The owner manually sends it. A paid order cancellation prompts a reminder that merchant refunds are separate.
- The customer price and catalog sync remains online and requires the owner to publish updates; no claim of automatic WhatsApp API delivery is made.

**Pending before paid release:** actual payment/expiry/late-renewal tests, notification before storage deletion, verified full media cleanup, phone/browser tests, and provider capacity monitoring.
