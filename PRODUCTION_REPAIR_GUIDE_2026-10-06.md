# RacharlaGPT Vibe — Production Repair 2026-10-06

## Important

This repair was built from the **current uploaded file** `Racharlagpt-Vibe-main(1).zip`.

The current `config.js` in that file is already correct:

- Supabase: `https://reaxalfzsjhanlfkzotp.supabase.co`
- Razorpay public key: `rzp_live_Tjty7jPBrtNLlQ`

Do **not** replace `config.js` with an older package.

No Razorpay secret, webhook secret, Gemini key, Resend key, Supabase service-role key or ADMIN_TOKEN is included in the frontend package.

---

# 1. What this repair fixes

### Customer Vibe website

- Public `#site/<slug>` becomes a standalone customer website.
- RacharlaGPT Studio navigation, Login and My Orders are hidden on the public site.
- Logo and up to 3 showcase images remain supported.
- Expired sites are not publicly displayed.
- My Orders shows plan and expiry date.
- Renew button is available for the owner's website.

### Refunds

- **No customer-facing refund/request-refund button.**
- The old customer `request-refund` function is now admin-only.
- Refunds are controlled from the private Admin Control Center.
- Admin can create a refund review when a customer contacts support.
- Admin can approve or reject the review.
- Approve calls Razorpay refund server-side.
- Refund processing is recorded in `refunds` and `orders`.

### Payment integrity

- Payment state is separate from delivery state.
- `payment_status=captured` requires server-side Razorpay verification/webhook capture.
- Razorpay webhook events are deduplicated.
- Admin can reconcile a stored payment ID against Razorpay.
- A retry never creates another payment.

### Paid delivery

- Book generation is moved away from the customer's browser.
- Vibe publishing can run from the server even if the customer closes the browser.
- Photo Story and Business Creative orders become ready after captured payment and are downloadable from My Orders using their stored metadata/assets.
- Delivery jobs are durable in `delivery_jobs`.
- Failed jobs can be retried without paying again.

### Book generation

- Gemini output is validated before reading `title`, `body` or `pages`.
- The `undefined.title` class of error is removed.
- Book generation runs in server-side chunks.
- Customer can close the browser while generation continues.

### Admin Control Center

Open:

`https://vibe.racharlagpt.in/#admin`

Enter the `ADMIN_TOKEN` stored in Supabase Secrets.

The token is sent to the protected `admin-api` function and is not placed in `config.js`.

Admin features:

- order ledger
- captured-payment total
- pending delivery count
- refund review count
- refund review creation
- approve refund
- reject refund
- Razorpay payment reconciliation

---

# 2. Files to replace

Replace these files/folders in the GitHub Pages project with the versions in this repair package:

```text
app.js
index.html
styles.css
supabase/config.toml

supabase/functions/complete-order/index.ts
supabase/functions/customer-orders/index.ts
supabase/functions/generate-book/index.ts
supabase/functions/process-delivery/index.ts
supabase/functions/publish-site/index.ts
supabase/functions/razorpay-webhook/index.ts
supabase/functions/renew-site/index.ts
supabase/functions/request-refund/index.ts
supabase/functions/retry-order/index.ts
supabase/functions/verify-payment/index.ts
supabase/functions/admin-api/index.ts
```

Also replace/add:

```text
PRODUCTION_REPAIR_2026-10-06.sql
PRODUCTION_REPAIR_GUIDE_2026-10-06.md
```

Keep your existing current `config.js` because it already points to the new Supabase project.

---

# 3. Database migration — run ONCE

In:

**Supabase → SQL Editor → New query**

run:

```text
PRODUCTION_REPAIR_2026-10-06.sql
```

Do not delete existing orders/sites first.

Do not run the old order-permission repair scripts afterward.

The migration adds:

- `orders.payment_status`
- `orders.payment_error`
- `orders.payment_captured_at`
- `orders.refund_status`
- `orders.refund_processed_at`
- `delivery_jobs`
- `razorpay_events`
- refund review metadata
- indexes and service-role grants

It also queues only existing orders that already have a stored Razorpay payment ID and `payment_status='captured'`.

It does **not** invent payments.

---

# 4. Edge Functions to deploy

Existing functions that changed:

```text
complete-order
customer-orders
generate-book
publish-site
razorpay-webhook
renew-site
request-refund
retry-order
verify-payment
```

New functions:

```text
process-delivery
admin-api
```

If using Supabase CLI:

```bash
supabase functions deploy complete-order
supabase functions deploy customer-orders
supabase functions deploy generate-book
supabase functions deploy process-delivery
supabase functions deploy publish-site
supabase functions deploy razorpay-webhook
supabase functions deploy renew-site
supabase functions deploy request-refund
supabase functions deploy retry-order
supabase functions deploy verify-payment
supabase functions deploy admin-api
```

The project already uses `verify_jwt = false` for these functions because the functions perform their own user/admin/internal authorization.

If using the Supabase Dashboard editor, create `admin-api` and `process-delivery` as new functions and paste the corresponding `index.ts` from this package.

---

# 5. Secrets

You already configured the required production secrets.

Keep these server-side:

```text
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY_1
GEMINI_API_KEY_2   (optional)
GEMINI_MODEL
RESEND_API_KEY
RESEND_FROM_EMAIL
ADMIN_TOKEN
```

The correct Gemini model is:

```text
GEMINI_MODEL=gemini-3.8-flash
```

There is **no new secret required by this repair**. The delivery worker uses the existing `SUPABASE_SERVICE_ROLE_KEY` as its internal function-to-function credential and never exposes it to the browser.

---

# 6. Razorpay webhook

Keep the current webhook URL:

```text
https://reaxalfzsjhanlfkzotp.supabase.co/functions/v1/razorpay-webhook
```

Keep the six selected events:

```text
payment.captured
payment.failed
order.paid
refund.created
refund.processed
refund.failed
```

The repaired webhook now:

- verifies the HMAC signature
- deduplicates webhook event IDs
- records captured payment IDs
- records payment failures
- starts delivery after capture
- updates refund state

---

# 7. Customer refund policy in the UI

There is intentionally **no refund button in My Orders**.

A customer who does not like a digital product cannot click a button and send a refund request from the app.

The customer should contact support using your published support/contact policy.

You decide whether to create a refund review in Admin.

In Admin → Orders:

**Create refund review**

Then Admin → Refund Reviews:

**Approve refund** or **Reject**.

Approve is the only action that calls the Razorpay refund API.

---

# 8. Test sequence before public launch

Use a controlled low-value test order. Do not repeat a real customer payment unnecessarily.

### Vibe

1. Login with Google.
2. Fill Vibe details.
3. Upload logo/showcase images.
4. Pay.
5. Confirm one `orders` row.
6. Confirm `payment_status=captured`.
7. Confirm `delivery_jobs=done`.
8. Confirm one `sites` row.
9. Open `#site/<slug>`.
10. Confirm only the customer's website appears.
11. Confirm My Orders shows expiry.
12. Confirm there is no refund button.

### Book

1. Buy a 10-page book.
2. Confirm payment capture.
3. Close the browser.
4. Wait for delivery.
5. Reopen My Orders.
6. Confirm `delivery_status=ready`.
7. Download the book.
8. Confirm no `undefined.title` error.
9. Confirm ready email.

### Refund

1. Customer does not see a refund button.
2. Admin creates a refund review from the order.
3. Review appears in Admin.
4. Reject test → no Razorpay refund.
5. For a genuine refund, Approve → Razorpay refund API.
6. Confirm `refunds.status=processed` after Razorpay confirmation.

### Failure/retry

1. Simulate a delivery failure.
2. My Orders shows **Retry delivery**.
3. Retry does not create another Razorpay order/payment.

---

# 9. Do not test by paying repeatedly

The most important production rule is:

```text
Payment captured ≠ delivery completed
```

The system now records them separately.

A customer can have:

```text
Payment captured
Delivery processing
```

without being charged again.

---

# 10. Current project configuration confirmation

This uploaded project was checked directly.

Its `config.js` contains:

```text
https://reaxalfzsjhanlfkzotp.supabase.co
```

So the previous statement that the current uploaded file still contained the old Supabase URL was based on an older package, not this current uploaded file. **Do not change the current `config.js` back to the old URL.**
