# Multi-vendor data isolation, shop URL collisions and expired storage cleanup

**Implementation audit:** 6 November 2026. Backend: Supabase project `reaxalfzsjhanlfkzotp`. Product: `business-agent/monthly.html`. This is a source/database audit, not an end-to-end test with multiple paid merchants.

## Merchant isolation

- A signed-in owner's user ID comes from a validated Supabase Auth access token, **never** a user ID supplied by a browser form.
- `business_agent_shops.user_id` is unique: one hosted shop record per account under the initial offer. `business_agent_shops.slug` is unique globally. A database trigger prevents transferring a shop to another owner.
- Merchant catalog reads and publishing use the validated `user_id`; order listing and status updates use that same `user_id`.
- A new database trigger rejects customer-order inserts and updates if `business_agent_customer_orders.user_id` does not match the owner of the referenced `shop_id`. It also prevents order ownership being changed.
- The Business Agent tables have RLS enabled and ordinary anonymous/authenticated roles do not have direct access to private shop/order records. Server-only service-role keys are not included in frontend bundles.
- Storage upload, update and delete permissions require an owner-ID-prefixed path such as `<owner-uuid>/product-<random-id>.jpg` and a current entitlement. Shop photos are **publicly viewable** to customers intentionally; private files must not be uploaded into the public shop-images bucket.
- Anonymous free-preview drafts are local to a device. If a different account signs in on a shared phone, the draft **must be explicitly accepted** for import; otherwise the new account starts empty. The shared guest key is cleared after account selection and on logout. Owner-specific offline drafts are keyed by authenticated user ID. Browser-local storage remains unencrypted; merchants should avoid shared public devices.

## Identical shop names — unique website URLs

The display name can repeat. The customer-facing URL slug cannot. Example:

| Merchant display name | Public slug |
|---|---|
| SRR | `srr` |
| SRR | `srr-kirana` |
| SRR | `srr-shop` |
| SRR Medical | `srr-medical` |

- The publishing screen checks slug availability against the authenticated server, offers free alternative slugs and keeps the merchant's draft intact if the chosen slug is already reserved.
- The final `UNIQUE(slug)` database constraint protects concurrent submissions. A race is reported as a URL collision and the owner is asked to choose another suggestion.
- Unpublished and expired shops **also reserve their slugs**, so no stranger receives a previously shared shop URL. URLs are not auto-reassigned on lapse or cleanup.

## Expired catalog cleanup — safety-first, owner opt-in

1. Merchant prepaid access expires; new public orders pause.
2. A **60-day grace period** permits renewal of the same catalog. The monthly owner dashboard displays the deadline.
3. Once the grace expires, the owner can download a JSON backup of the local draft **and last published catalog**, then explicitly request hosted catalog/photo removal by typing `DELETE MY OLD CATALOG`.
4. The server creates a **user-scoped cleanup request** and waits an additional **seven days**; the owner may cancel.
5. Admin logs into the protected `admin-pricing.html` control panel and reviews only eligible requests, checks their specified shop and expiry, then types `DELETE EXPIRED SHOP` for final confirmation.
6. A service-role-only database RPC atomically rechecks expiry, protected legacy license, request status and shop ownership; unpublishes and clears **only that owner's catalog**, and freezes an exact snapshot of that owner's photo paths.
7. The privileged cleanup function deletes only the snapped photo paths, not an entire bucket or a different owner's files. If it fails, the request is marked failed for admin review/retry.
8. The shop row, owner identity, unique slug, payment/license records and customer-order history remain, because order rows still reference the shop ID.
9. A new renewal cancels a pending cleanup request. A renewal **after** cleanup requires a fresh catalog.

**Not yet automated:** The system does NOT silently purge all inactive accounts. Owners who never request cleanup can still consume storage. A future default retention purge would require a verifiable notice/delivery workflow, export window, privacy/legal review and usage monitoring. The code currently provides opt-in admin-reviewed cleanup, not guaranteed zero-storage accumulation.

**Backup limitation:** The JSON file includes the last published catalog and its image URLs. Those image URLs no longer work after hosting cleanup. Owners must retain original product photos separately; do not call the JSON file a complete archive of binary images.

## Required release acceptance tests

- Test two distinct **authenticated** merchants using the same phone and different phones: no cross-account catalog, order history, QR, phone or private admin data.
- Simulate two merchants claiming `srr`: only one wins, the other receives suggestions; `srr-kirana` succeeds if unclaimed.
- Verify owner A's API token cannot list, save or modify owner B's shop/orders or upload to B's storage folder.
- After expiry and the grace, request and cancel cleanup, renew during the seven-day window, and confirm cleanup is blocked after renewal.
- With an explicitly authorized **test** account, verify the admin cleanup removes only its captured file paths, preserves receipts/customer order IDs, and cannot touch a legacy license or active paid shop.
- Test interrupted image cleanup and retry; verify no newly uploaded files are removed after a late renewal.
- Confirm the new monthly Razorpay purchase, refund, expiry and renewal flow on actual phones before accepting production payments.

**Current release flag:** `BUSINESS_AGENT_MONTHLY_SALES_ENABLED` is intentionally disabled until payment end-to-end tests pass.
