# Vibe Website Studio V3 — Install carefully

## What is included
- Existing products, ordering history, admin console, Razorpay plans and renewals remain in place.
- **18 categories**, including Medical & Pharmacy, Government School, Online Service Centre, Tent House, Supermarket, and Other Business.
- Holographic animated *illustrated* category icons (CSS/emoji; **not photorealistic 3D renders**). Photorealistic icons need licensed/generated assets provided separately.
- New mobile/desktop preview controls, owner-image preview, design style, and category-specific widgets.
- Public data view removes the confidential site management key from public API responses.
- Recovery action appears for captured orders without a delivered website (including a ready order missing its site).

## Deployment order
1. BACKUP the current Supabase database and current GitHub branch. Work on a staging branch/project if available.
2. Review and run `VIBE_V3_MIGRATION.sql` in Supabase SQL Editor. IMPORTANT: run your original `database.sql` and production repair migrations first if those have not already been applied. The migration changes public SELECT permissions; do not skip the new `app.js` upload.
3. Upload/replace `index.html`, `app.js`, `vibe-v3.js`, `vibe-v3.css` in the GitHub site root. Keep your existing `styles.css`, `config.js`, existing assets, other HTML files, and secrets unchanged.
4. Deploy **only** these function source changes: `supabase/functions/publish-site/index.ts` and `supabase/functions/retry-order/index.ts`. Keep all other Edge Functions as they are. Redeploy by your normal Supabase CLI workflow: `supabase functions deploy publish-site` and `supabase functions deploy retry-order`.
5. Reload site with cache bypass. Verify `#websites` category cards (all 18), mobile/desktop, image upload preview, category-specific website display, pricing and renewal.
6. Using only Razorpay **test mode on a separate safe staging environment**, validate order creation, captured payment, publish, paid retry, customer orders, admin reconciliation and renewal. Do not attempt live transactions to test this package.
7. After production deployment, verify anonymous REST GET `/rest/v1/public_vibe_sites?select=*&limit=1` shows no `management_token`; anonymous GET `/rest/v1/sites?select=*&limit=1` must be denied.

## Key limitations
- I have NOT executed a live end-to-end transaction or accessed your private Supabase/Razorpay accounts. Integration tests require configured services.
- Existing Gemini models and API calls were not replaced in this package: this is a deterministic V3 design system, NOT verified AI-generated design from uploaded image content.
- The visual icons are CSS-animated and illustrative. They are not high-fidelity CGI. Real customer photos show in previews and published websites.
- Product orders outside `website` retain their existing logic. Some existing backend conditions may still need separate hardening.
- Rollback: revert the GitHub files and Edge Function versions; before restoring old `app.js`, review the SQL permissions because the old app used the unsafe `sites?select=*` endpoint. Reverting only the front end without the security migration would break public sites.
