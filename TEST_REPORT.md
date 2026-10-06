# RacharlaGPT Vibe — final static QA report

Date: 2026-10-04

## Passed
- JavaScript syntax check with Node `--check`.
- HTML parsed successfully with BeautifulSoup.
- All in-app hash navigation targets referenced by the main navigation exist.
- `vibe.racharlagpt.in` is the packaged custom domain in `CNAME` and `config.js`.
- Brand logo asset exists in HD form and the favicon/brand mark is gold on navy.
- Supabase Edge Function folders include create-order, verify-payment, generate-book, upload-source, download-book, refund-order, health and publish-site.
- Database schema includes orders, refunds, admin controls, templates and public Vibe sites with RLS.
- Book preview no longer calls Gemini before payment; this protects free API quota from public preview abuse.
- Paid book generation remains server-side and payment verification is required before generation.
- Book themes include automatic selection plus multiple manual themes.
- Business creative packs now generate 1/5/10 distinct styled creative pages in the browser-based launch workflow.
- Vibe website pricing is enforced server-side: Normal ₹199/1m, ₹499/6m, ₹1,500/1y; Pro ₹399/1m, ₹999/6m, ₹2,000/1y.
- Public Vibe sites are read-only through an RLS policy that also requires `expires_at > now()`. Renewal uses a private management token and a one-time claimed renewal order.
- Local HTTP server returned 200 for `index.html` and the HD logo asset.

## Manual production checks still required after deployment
- Enter your real Supabase project URL + publishable key in `config.js`.
- Set Razorpay public key in `config.js` and secret in Supabase Edge Function Secrets.
- Set Gemini keys in Supabase Edge Function Secrets.
- Run the complete `database.sql` in the target Supabase project.
- Deploy all Edge Functions, including `publish-site`.
- Configure `vibe.racharlagpt.in` in GitHub Pages and DNS.
- Test a Razorpay test-mode payment, captured-status verification and refund in the Razorpay test environment.
- Test a paid book with a source PDF and a 100-page request.
- Test all six Vibe plans, open the generated `#site/<slug>` URL, verify the returned expiry date, then test a renewal and an expired-site case.
- Replace placeholder legal business details before public launch.

## Honest limitation
A real Razorpay payment, real Gemini generation, Supabase storage and DNS cannot be verified inside this offline build sandbox without the owner's live credentials. The package therefore does not fake a successful payment or claim those live services were tested here.


## Additional offline checks for Vibe expiry/renewal release
- Node `--check` passed for `app.js`.
- HTML parsed successfully; all six Vibe plan radio values and displayed prices were found.
- Static HTTP server returned 200 for `index.html` and `app.js`.
- New `renew-site` Edge Function file is present.
- All nine Edge Function folders have `index.ts`; brace-balance checks passed.
- No Razorpay secret, Supabase service-role key or Gemini API key is embedded in browser `app.js`/`index.html`.
- Server-side Vibe price tables match the frontend: Normal ₹199/₹499/₹1,500 and Pro ₹399/₹999/₹2,000.
- Expiry is enforced at the Supabase RLS/public-read layer and again by the public-site query.
- Renewal extends from the later of current expiry or today and claims the paid renewal order once.


## Commercial auth + migration QA (2026-10-05)
- Email/password signup and login UI is present.
- Google OAuth button uses Supabase `signInWithOAuth({ provider: "google" })`.
- Forgot-password uses `resetPasswordForEmail()` with a production-root redirect.
- Password recovery uses the `PASSWORD_RECOVERY` auth event and `updateUser({ password })`.
- A singleton Supabase browser client is used instead of repeatedly creating clients.
- OAuth/password recovery does not rely on hash fragments for callback routing.
- Fresh-database migration order was corrected so `public.sites` is created before `service_role` grants and media-column upgrades.
- Edge Function TypeScript was parsed with TypeScript; remaining diagnostics are the expected missing `Deno` global types in the generic local compiler, with no syntax/type diagnostics beyond that environment issue.
- `app.js` passes Node syntax checking.
- `index.html` parses successfully.
- Local HTTP smoke test returned HTTP 200 for index, app.js, config.js and the HD brand logo.
- No browser secret values were added.
