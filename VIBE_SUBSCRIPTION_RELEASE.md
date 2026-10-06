# Vibe Website Subscription Release

## Pricing
Normal: ₹199/month, ₹499/6 months, ₹1,500/year
Pro: ₹399/month, ₹999/6 months, ₹2,000/year

## Lifecycle
- Payment creates a website with `expires_at`.
- Public access is allowed only while `published = true` and `expires_at > now()`.
- Expiry pauses public access but keeps site data.
- Customer renews using the private `management_token`.
- Renewal extends the existing expiry and restores public access.
- Renewal order is claimed once to prevent duplicate application.

## Supabase deployment
Run `database.sql`, deploy all Edge Functions including `renew-site`, then configure the required secrets from `README.md`.
