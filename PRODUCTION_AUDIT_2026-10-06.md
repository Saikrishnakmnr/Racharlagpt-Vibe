# Production Audit — Current Uploaded Project

Source audited: `Racharlagpt-Vibe-main(1).zip`

## Confirmed current configuration

`config.js` points to:

```text
https://reaxalfzsjhanlfkzotp.supabase.co
```

The browser contains the Razorpay public key only. Server secrets are read from Supabase Edge Function environment variables.

## Defects found and repaired

| Area | Previous defect | Repair |
|---|---|---|
| Public Vibe site | Customer site rendered inside Studio shell | Public-site mode hides Studio header/footer/navigation and renders the business page standalone |
| My Orders | Vibe expiry was not joined/displayed | `customer-orders` now returns the matching site and expiry; UI shows plan + expiry |
| Refund | Customer saw Request refund on every order | Customer refund UI removed completely |
| Refund backend | `request-refund` was customer-callable | Function is now admin-only |
| Admin | Browser page was only a placeholder | Real token-protected Admin Control Center added |
| Refund review | No admin workflow | Admin can create/reject/approve reviews; approve calls Razorpay refund server-side |
| Payment state | Payment and delivery were mixed in `status` | Separate `payment_status` and delivery state |
| Webhook | No event deduplication | `razorpay_events` idempotency table |
| Webhook | Capture only changed order state | Capture now starts server delivery |
| Book | Browser performed paid generation | `process-delivery` performs server-side chunk generation |
| Book | `undefined.title` class of crash | Gemini output normalized and validated |
| Delivery | Browser closure could interrupt delivery | Durable `delivery_jobs` + background function processing |
| Retry | Retry did not reset durable job | Retry requeues/reset job without charging again |
| Vibe publish | Browser was primary delivery mechanism | Server worker can publish after payment; browser remains a fast-path/fallback |
| Photo/creative | Delivery depended on open browser | Captured orders become ready; My Orders can recreate/download from stored metadata/assets |
| Complete order | Customer could mark an order ready with recovery token | Completion endpoint is now internal-only |
| Reconciliation | No admin payment reconciliation | Admin can query Razorpay payment status for an order |

## Known intentional behavior

- Customer refund requests are not shown in the customer UI.
- Refund review is a support/admin operation.
- A public Vibe site does not show Studio login/navigation.
- `config.js` is intentionally left unchanged because the current uploaded version already contains the new Supabase URL.

## Validation performed

- `node --check app.js` passes.
- TypeScript syntax/type parse was checked with a Deno global shim; no TypeScript errors beyond the intentionally external Deno runtime were reported.
- No browser secret was added.
- The repair package retains the existing ready-made templates and zero-cost browser creative approach.
