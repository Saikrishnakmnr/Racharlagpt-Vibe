# Vibe V3 guest-to-login continuity patch

This is the earlier V3 package plus one updated `app.js`. It preserves the original V3 category picker, payment plans, renewal and recovery functions.

## What was verified in the existing V3 app
- Anonymous visitors can browse category previews and fill the website form.
- Previously, the form attempted server photo upload before authentication, and Google redirect could lose all unsaved form details and selected images.
- The original UI has no guest-draft persistence or explicit sign-in resume path.

## Improvements in this package
1. Guest visitors can choose a category, complete details, select photos, choose a plan and preview without login.
2. Form fields and plan/style are saved locally in **sessionStorage** (same browser/tab), and photos are saved in **IndexedDB** when browser support permits.
3. User signs in *only after clicking Pay & Publish*. Media uploading and order creation happen only after a confirmed authenticated user.
4. After email/password or Google sign-in, the app returns to `#websites`, restores the user's entered details and photos where supported, and asks the user to review and click Pay & Publish again. **No automatic payment**.
5. After verified payment and successful publication, the local draft is cleared. If payment/publication fails, the draft remains so the customer can seek order recovery without re-entering it.

## Limitations & security
- Drafts are browser-local, not account-synced. Another device, browser, incognito session, cleared storage, or blocked browser storage will not have them. When IndexedDB is blocked, image files must be reselected.
- Sensitive documents, prescriptions, student records or private customer details should not be uploaded as ordinary business showcase media.
- Do not auto-submit Razorpay after sign-in; users must review the final preview and price.
- This was syntax-checked and reviewed statically. Supabase OAuth redirect, Razorpay transactions, and upload authorization require staging integration tests.

## Install
If the *previous* V3 package has already been installed, replace **only** the website root `app.js` from this patch. If not, follow `VIBE_V3_INSTALL.md` for the full installation, including the SQL migration and other function files, then use the latest `app.js` included here.

## Manual test checklist
- Anonymous browsing and all category previews work, no forced sign-in.
- Type each field, select 2+ images, select Pro 6 months, preview; reload tab: values and photos restore.
- Google OAuth sign-in: returns to website page with fields, plan/style and supported images restored.
- Email/password sign-in: returns to website page; existing values preserved.
- Cancel sign-in: draft remains editable.
- Cancel payment: no charge; draft remains.
- Payment success -> published website: draft removed, order visible in My Orders.
- Paid but publish fails: My Orders allows secure retry; never create a second charge to recover.
- Sign out and sign in as a different account: review the local draft before proceeding; local drafts are not account-bound.
