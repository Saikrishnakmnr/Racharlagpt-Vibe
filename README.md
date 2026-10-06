# RacharlaGPT Studio — Production-ready no-build starter

A premium, responsive, no-NPM digital studio for **RacharlaGPT**. The interface is inspired by the supplied RacharlaGPT showcase: deep navy, gold branding, neon-glow accents, rounded cards and mobile-first layouts.

## Included products

- **Book Studio** — story, comedy, motivational, study, biography, history, poetry, business and children's books.
- **Image Studio** — wedding, birthday, travel, festival, business and temple templates with user-photo preview.
- **Business Creative Studio** — social posts, offer banners and creative packs.
- **Custom Songs** — links customers to `songs.racharlagpt.in`.
- Prompt Store / Creator Economy sections for future monetization.
- Pricing, orders, privacy, terms, contact and admin shell.

## Brand assets

The `assets/` folder now contains:

- `brand-logo.png` — the supplied RacharlaGPT logo crop from your showcase.
- `brand-logo-original.png` — source-sized copy.
- `brand-mark.svg` — crisp scalable R crown/R mark used for the favicon and hero.

Replace these only if you later receive an official master logo file.

## Important payment rule

The browser **never simulates a payment**. If Supabase/Razorpay is not configured, the UI runs in safe demo mode so you can test navigation, previews and downloads. Real payment buttons become active only after the backend and Razorpay public key are configured.

## Deploy with zero NPM / zero build step

1. Create/use your Supabase project.
2. Run `database.sql` in Supabase SQL Editor.
3. Deploy the Edge Functions in `supabase/functions/`.
4. Add Edge Function secrets:

```text
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
GEMINI_API_KEY_1
GEMINI_API_KEY_2
GEMINI_MODEL=gemini-3.8-flash
ADMIN_TOKEN
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available to Supabase Edge Functions in the normal runtime; set them explicitly only if your deployment requires it.

5. Put only browser-safe values in `config.js`:

```text
SUPABASE_URL
SUPABASE_ANON_KEY / publishable key
RAZORPAY_KEY_ID
GA4_MEASUREMENT_ID (optional)
ADSENSE_CLIENT_ID (optional)
ADSENSE_HOME_SLOT (optional)
MONETAG_SCRIPT_URL (optional)
```

6. Upload the folder to GitHub Pages / Cloudflare Pages / another static host.
7. The included `CNAME` is `vibe.racharlagpt.in`.
8. In DNS, point your subdomain to your chosen static host.

## Book generation flow

```text
Idea + publisher name + language + source files
                 ↓
         Preview generation
                 ↓
             Razorpay
                 ↓
      Server signature + capture check
                 ↓
        20-page generation chunks
                 ↓
      Private download token + delivery
                 ↓
        HTML download / Print → PDF
```

The chunk endpoint now requires both the paid order ID **and the private delivery token**.

## Pricing

```text
10 pages  ₹9
20 pages  ₹19
30 pages  ₹29
50 pages  ₹49
100 pages ₹89
Biography/source review +₹49
Premium cover +₹19
AI illustration pack +₹29
```

Business creatives:

```text
1 creative   ₹9
5 creatives  ₹29
10 creatives ₹49
```

## Important production notes

### AI quality

Do not advertise AI output as literally “mistake-free”. Add human review for paid biography, history, education, legal, medical or other high-stakes content.

### AI quota

Two Gemini keys are supported as a fallback, but free quotas are not unlimited. Keep generation limits, queueing and abuse controls in mind as traffic grows.

### Uploaded files

The source upload function stores files in the private `user-assets` bucket. Do not make this bucket public.

### Ads

Do not put ads inside payment, download, account or admin screens. Never ask users to click ads or artificially generate traffic. Add your real AdSense/Monetag identifiers only after approval.

### Secrets

Never commit:

- Razorpay secret
- Gemini keys
- Supabase service-role key
- admin token
- webhook secret

## Manual test checklist

### Navigation

- Home → Books
- Home → Images
- Home → Business
- Home → Songs
- Home → Pricing
- Home → My Orders
- Footer → legal pages
- Mobile menu → every route
- Search → product shortcuts

### Book Studio

- Enter idea → live cover title updates
- Publisher → live publisher updates
- Subtitle → live subtitle updates
- Page packs → total updates
- Add-ons → total updates
- Upload files → backend upload when configured
- Without backend → safe preview demo
- With backend → Gemini preview
- With Razorpay → server-created order → signature verification → chunk generation
- 100-page generation accumulates all chunks instead of replacing previous chunks
- Download / print / share buttons

### Image Studio

- Category tabs
- Template selection
- Template images
- Upload photo thumbnails
- Remove uploaded photo
- Live headline preview
- Demo download without backend
- Razorpay flow when configured

### Business Studio

- Live business name / offer / contact preview
- Pack selection updates price
- Demo creative download without backend
- Razorpay flow when configured

## Final legal launch work

Before public launch, replace the placeholder legal text with your actual:

- legal business name
- support email
- business address
- refund policy
- data retention period
- grievance/contact details
- applicable tax/GST information

Also verify your payment account, domain, ad-network approvals and copyright/licensing for every template image you use.


## Phase-1 zero-investment image studio

The Image Studio intentionally launches with ready-made design backgrounds instead of requiring a paid image-generation API. The current catalog contains 60+ design choices across wedding, couple/love, temple wedding, India temples, world temples, birthday, family, travel, festival and business. Users upload their own photos, add a headline and preview before payment.

The catalog is deliberately easy to extend: edit `templates` in `app.js` and add another category button in `index.html`. Keep a license/source record for every third-party image; see `assets/template-sources.md`.

## Zero-cost earning products

The Creator Economy page now highlights additional products that can be produced with the same browser/template engine: digital invitations, WhatsApp status packs, QR business cards, menus/price lists, resume/profile packs and festival business campaigns. These are product ideas for your own pricing/catalog; connect them to Razorpay only when you are ready to sell each product.

## Recommended launch rule

Do not promise unlimited AI image generations on the free tier. Use Gemini for text/content where your free quota permits, and use your template engine for image products first. Introduce paid image APIs only after revenue begins.


## Vibe Websites (new)

The app now includes **Vibe Business Websites** at `#websites`. Customers can preview and purchase: 

- Vibe Normal — ₹199 / 1 month, ₹499 / 6 months, ₹1,500 / 1 year
- Vibe Pro — ₹399 / 1 month, ₹999 / 6 months, ₹2,000 / 1 year

After a verified Razorpay payment, the `publish-site` Edge Function creates a public row in `public.sites` with an expiry date and a private management token. Plans are Normal/Pro with 1-month, 6-month and 1-year validity. The customer receives a link such as `https://vibe.racharlagpt.in/#site/sri-lakshmi-jewellery`. The public RLS policy also checks `expires_at`, so an expired site automatically stops being publicly readable without deleting the customer data.

Renewals use the `website_renewal` order type and the `renew-site` Edge Function. The customer supplies the private website key, pays for a new period, and the backend extends the existing expiry from the later of today or the current expiry. Renewal payments are claimed once to prevent the same Razorpay order from being applied repeatedly.

Run the updated `database.sql` before deploying `publish-site` and the new `renew-site` function.

## Book and business design system

Books now support multiple visual themes with automatic selection based on book type. The final browser-generated/printable book uses the selected theme and varied page typography/layouts. Business creatives support multiple visual styles and 1/5/10 creative packs. The launch implementation uses templates and browser composition, so it does not require a paid image-generation API.

## Production security notes

- Browser config may contain only the Supabase publishable/anon key and Razorpay public key.
- Keep `RAZORPAY_KEY_SECRET`, Gemini keys, `SUPABASE_SERVICE_ROLE_KEY`/Supabase secret key and `ADMIN_TOKEN` in Supabase Edge Function Secrets. Supabase documents publishable keys for shipped browser code and secret keys for server-side functions.
- `generate-book` preview is intentionally local/demo and does not spend Gemini quota. Gemini is used for paid book generation after payment verification.
- `publish-site` accepts only a verified paid website order.
- Public Vibe pages are read-only through an RLS policy for `published = true`.
- Do not put private source files or service-role keys in GitHub.

## Supabase secrets

Set these in Edge Function Secrets (names only; never put values into the frontend):

```text
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
GEMINI_API_KEY_1
GEMINI_API_KEY_2
GEMINI_MODEL
ADMIN_TOKEN
SUPABASE_SERVICE_ROLE_KEY   # if your project still uses the legacy server key; prefer the current Supabase secret-key model where appropriate
```

## GitHub Pages / Vibe domain

The package contains `CNAME` with `vibe.racharlagpt.in`. In GitHub Pages, set the custom domain to that same hostname, then create the DNS CNAME to your GitHub Pages hostname. GitHub recommends adding the custom domain in Pages before configuring DNS and verifying the domain.


## Customer authentication (required for production)

Customers can browse without an account. Purchase and My Orders require authentication. The app supports:
- Email + password signup/login
- **Continue with Google**
- Forgot password + secure reset-password flow

In Supabase Dashboard → Authentication → Providers, enable **Google** and configure the Google OAuth client. In Authentication → URL Configuration, set the production Site URL to `https://vibe.racharlagpt.in` and add the exact production Redirect URL `https://vibe.racharlagpt.in/`. The SPA deliberately uses the site root for OAuth/password recovery instead of hash-fragment callbacks, avoiding common static-host callback/rendering issues.

Supabase Auth password-reset emails require Auth email delivery/SMTP. For production, configure a custom SMTP provider (Resend can be used) rather than relying on the limited default mail service.

**Never put Google client secrets, Razorpay secrets, Gemini keys, Resend API keys, webhook secrets, or the Supabase service-role key in `config.js` or GitHub.**
