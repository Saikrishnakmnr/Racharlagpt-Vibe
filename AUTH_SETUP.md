# RacharlaGPT Vibe — Customer Auth Setup

## Customer experience

- Browsing is public; no login is required to view studios or templates.
- Purchasing requires a customer account.
- Login methods: Email + Password and **Continue with Google**.
- **Forgot password?** sends a Supabase Auth reset email.
- After a reset link is opened, the SPA shows a secure new-password form.
- My Orders is account-based and shows the customer's own orders only.

## Supabase Auth

In Supabase Dashboard:

1. Authentication → Providers → enable **Email**.
2. Authentication → Providers → enable **Google**.
3. Create/configure a Google OAuth web client in Google Cloud Console and paste the client ID/secret into the Supabase Google provider settings.
4. Authentication → URL Configuration:
   - Site URL: `https://vibe.racharlagpt.in`
   - Redirect URL: `https://vibe.racharlagpt.in/`
5. If you test locally, add your exact local origin as another Redirect URL (for example `http://localhost:8000/`).

The frontend intentionally redirects OAuth and password recovery to the site root instead of using a URL fragment. This avoids common OAuth callback/rendering problems in static GitHub Pages SPAs.

## Password reset email

Supabase Auth sends password-reset messages. For production, configure custom SMTP under Supabase Auth SMTP settings. Resend can be used as the SMTP provider. The Edge Function `RESEND_API_KEY` is separate from Supabase Auth's SMTP configuration.

## Security

Never put any of these in `config.js`, GitHub Pages, or browser JavaScript:

- Google OAuth client secret
- Razorpay secret
- Razorpay webhook secret
- Supabase service-role key
- Gemini API keys
- Resend API key
- Admin token

The browser may contain only the Supabase publishable/anon key and Razorpay public Key ID.
