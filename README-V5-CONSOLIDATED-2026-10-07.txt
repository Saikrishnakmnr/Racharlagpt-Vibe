RacharlaGPT Vibe — V5 Consolidated Repair + Image Studio
2026-10-07

This is the consolidated replacement patch. It contains the V4 Image Studio frontend plus ALL backend repair functions from the 2026-10-06 production repair, so the V3 backend fixes are not silently omitted.

IMPORTANT:
- Do NOT delete all existing Supabase functions.
- Replace only the functions included in this patch if you need to bring the backend to the consolidated repair state.
- Keep asset-urls, download-book, health, upload-site-assets, upload-source unless separately updating them.
- config.js is intentionally absent; keep the current production config.js.
- supabase/config.toml is included because admin-api and process-delivery must have verify_jwt=false and perform their own server-side token checks.
- Keep the existing Razorpay webhook URL and events.
- Do not make a payment just to test the UI.

Included backend repair functions:
admin-api
complete-order
create-order
customer-orders
generate-book
process-delivery
publish-site
razorpay-webhook
refund-order
renew-site
request-refund
retry-order
verify-payment

Frontend:
app.js
index.html
styles.css

Database:
PRODUCTION_REPAIR_2026-10-06.sql

V5 additions:
- Admin navigation link is present in desktop/mobile navigation.
- My Orders displays the private website management key and provides Copy key.
- Pro Vibe public pages receive a distinct premium class/style.
- V4 Image Studio marketplace gallery/search/sort/categories/live personalization remains included.
- Book preview undefined-title crash guard remains included.
- No customer self-service refund button.

Deployment:
1. If the repair migration has not succeeded, run the included SQL once. It adds the new columns/tables and preserves refund history while closing redundant active refund duplicates as rejected history.
2. Deploy the included backend function folders as replacements/creations according to their names. Do not delete unrelated existing functions.
3. Replace frontend app.js, index.html, styles.css.
4. Keep current config.js and all existing secrets.
5. Test Admin, Book Preview, Image Studio preview, My Orders, Vibe preview, and website renewal UI before making one controlled payment test.
