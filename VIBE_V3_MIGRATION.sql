-- Vibe Studio V3 migration. Run after your existing database.sql and inspect on staging first.
-- Public visitors never receive private management tokens, user IDs, or customer emails.
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS design_blueprint jsonb NOT NULL DEFAULT '{}'::jsonb;
DROP VIEW IF EXISTS public.public_vibe_sites;
CREATE VIEW public.public_vibe_sites WITH (security_barrier=true) AS
 SELECT slug,business_name,category,headline,about,phone,location,services,instagram,logo_url,showcase_images,plan,theme,design_blueprint,published,expires_at
 FROM public.sites WHERE published=true AND expires_at>now();
REVOKE ALL ON public.sites FROM anon,authenticated;
DROP POLICY IF EXISTS "Public can read active Vibe sites" ON public.sites;
DROP POLICY IF EXISTS "Public can read published Vibe sites" ON public.sites;
GRANT SELECT ON public.public_vibe_sites TO anon,authenticated;
COMMENT ON VIEW public.public_vibe_sites IS 'Only explicitly public fields. Never include management_token.';

-- Post-migration manual checks (run separately):
-- SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='public_vibe_sites';
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='sites' AND grantee IN ('anon','authenticated');
-- Confirm no management_token exists in public_vibe_sites and existing admin/user functions still work.
