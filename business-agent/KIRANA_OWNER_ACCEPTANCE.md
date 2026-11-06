# Kirana-shop owner / customer acceptance review — 6 November 2026

## Test context and evidence boundary

I inspected the live GitHub `main` implementation and Supabase schema/counts. I also tried opening `https://vibe.racharlagpt.in` and `/business-agent/monthly.html`, but the domain did not resolve in the testing environment. No real ₹99 transaction was attempted, no test license was granted, no real customer PII was submitted, and no fake order was inserted. Supabase currently shows **0 monthly purchases, 0 monthly accounts, 0 published shops, 0 Business Agent customer orders, and 14 older Vibe orders**.

**Therefore the entire signup → Razorpay → active shop → customer WhatsApp order → delivery journey has NOT been end-to-end validated on live phones.** Source checks and database inspection are valuable but do not prove browser/production success.

## Real merchant walkthrough — simulated, not a transaction

1. First visit: read the ₹99 prepaid monthly offer; ₹499 is a *planned regular rate*, not a genuine former selling price.
2. Shop identity: business name, full street address, country-code WhatsApp, category Kirana, optional storefront banner; no photo uses a branded default banner.
3. Products: add rice by kg, oil by litre/pack, sugar by kg, biscuits by pack; set price and optional stock and photo. The user can edit, hide, delete and restock items.
4. Customer choices: enable pickup and local delivery, delivery fee; enable owner UPI/QR/cash. Recheck the beneficiary UPI ID and QR.
5. Monthly activation: payment is **currently deliberately disabled** until capture, recovery, refund, renewal and expiry scenarios pass real gateway tests. Do not advertise successful activation yet.
6. Publishing: with active entitlement, click Save & publish, assign a slug, open customer URL `/business-agent/monthly.html?shop=slug`, copy or share through WhatsApp/Instagram bio.
7. Customer: open hosted URL, see name, address, Maps link, banner and products. Direct WhatsApp enquiry link works without cart. Add products, enter phone and address if delivery, choose cash/UPI/QR; consent to share order details.
8. Price check: before creating order, the client fetches the hosted catalog; if prices/products changed it clears the cart and asks buyer to reselect. Server independently calculates current amount and delivery fee. On failure, customer must retry online.
9. Order: the platform stores an order reference, then navigates to a WhatsApp draft. Customer must tap **Send**. Unsent order references can exist; owner should verify the WhatsApp message before packing.
10. Seller: open Orders; review reference/items/customer/delivery address and manually accept, pack, mark ready/out for delivery, completed or cancelled. Added one-tap customer WhatsApp contact for confirming details or sending manual updates.
11. Payment: customer funds flow to the owner directly; bank/UPI receipt **must be verified manually** before tapping Confirm Payment. No automatic reconciliation or courier integration.
12. Tomorrow's price change: owner edits the product in Catalog. It is saved **locally only** until Publish latest prices to customers succeeds. The new sync banner warns of an unpublished draft, and the customer storefront fetches fresh prices when it opens/refreshes.
13. Phone change: owner logs in and can explicitly **Restore last published catalog**. Confirming the restoration replaces unsynced local edits; it does not silently overwrite the owner's work.
14. Month end: public shop ordering pauses; hosted data remains saved for future manual renewal. Auto-debit is not used.

## Features verified in the source

- Owner onboarding, optional photos/banners, product CRUD, stock, delivery fee, payment choices and live publish route
- Owner per-account browser draft, explicit sync warning, one-tap catalog publish, safe restore from published shop, share/copy public URL
- Customer direct WhatsApp enquiry link, cart with price/fee estimate, current-catalog check, server validation, stable order ID and manual WhatsApp Send
- Owner order ledger and manual order/payment-status controls, new direct WhatsApp message to customer
- Public ordering gated by a current monthly entitlement (or recognized earlier legitimate license)
- HTML/JS structure and exact DOM IDs checked; no missing IDs or duplicate IDs

## Important known limitations / defects before full sales

- **P0:** ₹99 payment remains gated. Provider callback, capture, refund, expiry and renewal flows have not passed paid end-to-end tests. No live purchase is verified.
- **P0:** Public website availability/domain deployment was not verified from testing environment; test DNS/HTTPS/JS loading on Android, iPhone and desktop before accepting money.
- **P1:** Stock is not automatically reserved or deducted after orders. Multiple customers can request the final item; owner must manually confirm stock and adjust catalog.
- **P1:** Owner dashboard does not receive background WhatsApp messages or automatically send order acceptance/status replies. Owner must read WhatsApp and manually use the status tools.
- **P1:** Merchant-side payment verification is manual. UPI screenshots and taps do not prove receipt.
- **P1:** Local unpublished drafts are device-specific. They can be lost if browser storage is cleared; last published cloud copy can be restored, but unpublished edits cannot.
- **P1:** Delivery charge is configurable, but there is no built-in radius/area eligibility, courier booking, driver tracking, ETA or refunds for customer purchases.
- **P1:** There is no opening-hours/holiday schedule or out-of-hours order block. Seller must communicate availability.
- **P2:** PWA is a shared Racharla Shops install, not an independently branded native app per store; install behavior varies by browser.
- **P2:** Multi-phone concurrent editing can still cause last-write-wins conflicts; no optimistic catalog versioning or merge UI yet.

## Required actual-device acceptance test

Perform with an operator-controlled test merchant (not a real charge until test mode is configured), two phones and a browser: registration, all five steps, photos, UPI/cash, paid activation, publish, direct customer URL, product order through WhatsApp manual Send, owner order status, delivery and payment confirmation, stale-price refusal, deletion of sold-out item, restore on second phone, expiry/renewal and refund/recovery. Validate that earlier Vibe records remain unchanged. Do not assert these tests passed until each is performed and recorded.
