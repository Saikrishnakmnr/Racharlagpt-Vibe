-- RacharlaGPT Studio database
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  razorpay_order_id text unique not null,
  razorpay_payment_id text,
  razorpay_signature text,
  amount integer not null,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created','paid','processing','ready','failed','refunded')),
  product_type text not null default 'digital',
  product_name text not null default 'RacharlaGPT Digital Product',
  metadata jsonb not null default '{}'::jsonb,
  content jsonb,
  download_token text unique not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  razorpay_payment_id text,
  amount integer,
  reason text,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create table if not exists public.admin_controls (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.template_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  image_url text,
  price integer not null default 19,
  active boolean not null default true,
  created_at timestamptz not null default now()
);


-- Commercial account, delivery and notification upgrade. Safe for existing installations.
alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists delivery_status text not null default 'pending';
alter table public.orders add column if not exists delivery_attempts integer not null default 0;
alter table public.orders add column if not exists last_delivery_error text;
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists recovery_claimed_at timestamptz;
alter table public.orders add column if not exists email_receipt_sent_at timestamptz;
alter table public.orders add column if not exists email_ready_sent_at timestamptz;
alter table public.orders add column if not exists email_last_error text;
alter table public.orders add column if not exists refund_requested_at timestamptz;

alter table public.orders drop constraint if exists orders_delivery_status_check;
alter table public.orders add constraint orders_delivery_status_check check (delivery_status in ('pending','processing','ready','failed','refunded'));

create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists orders_email_idx on public.orders(lower(customer_email));
create index if not exists orders_delivery_idx on public.orders(delivery_status, created_at desc);

-- Public business-image bucket. Customers explicitly choose these images for public websites.
insert into storage.buckets (id,name,public)
values ('site-assets','site-assets',true)
on conflict (id) do update set public=true;

-- Customer-visible order policies: only authenticated users can read their own orders.
drop policy if exists "Customers can read own orders" on public.orders;
create policy "Customers can read own orders" on public.orders
for select to authenticated using (user_id = auth.uid());

-- Public site media is intentionally readable. Uploads remain server-mediated by Edge Functions.
drop policy if exists "Public can read site assets" on storage.objects;
create policy "Public can read site assets" on storage.objects
for select using (bucket_id = 'site-assets');

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_token_idx on public.orders(download_token);

alter table public.orders enable row level security;
alter table public.refunds enable row level security;
alter table public.admin_controls enable row level security;
alter table public.template_catalog enable row level security;

-- Edge Functions use the service_role key through PostgREST. Keep these privileges server-side only.
grant select, insert, update, delete on public.orders to service_role;
grant select, insert, update, delete on public.refunds to service_role;
grant select, insert, update, delete on public.admin_controls to service_role;
grant select, insert, update, delete on public.template_catalog to service_role;

-- Intentionally no anon/authenticated policies on sensitive tables.
-- Edge Functions use the server role to perform privileged operations.
-- Customer accounts are linked through orders.user_id; sensitive writes remain Edge-Function-only.

insert into storage.buckets (id,name,public)
values ('user-assets','user-assets',false)
on conflict (id) do update set public=false;

-- Private bucket: no public storage policies are created.
-- Upload/download is performed by Edge Functions using the service role.

insert into public.admin_controls(key,value) values
('pricing','{"10":9,"20":19,"30":29,"50":49,"100":89}'),
('addons','{"biography":49,"cover":19,"illustration":29}'),
('maintenance','{"enabled":false,"message":""}')
on conflict(key) do nothing;

create or replace function public.touch_orders_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
for each row execute function public.touch_orders_updated_at();


-- Public Vibe business websites. Site content stays stored after expiry; only active sites are public.
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  business_name text not null,
  category text not null default 'Business',
  headline text,
  about text,
  phone text,
  location text,
  services text,
  instagram text,
  plan text not null default 'normal' check (plan in ('normal','pro')),
  pricing_key text not null default 'normal_1m',
  duration_months integer not null default 1 check (duration_months in (1,6,12)),
  theme text not null default 'luxury',
  published boolean not null default true,
  expires_at timestamptz not null default (now() + interval '1 month'),
  management_token text unique not null,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Website media columns. These URLs are intentionally public because the customer's website is public.
alter table public.sites add column if not exists logo_url text;
alter table public.sites add column if not exists showcase_images jsonb not null default '[]'::jsonb;
alter table public.sites add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.sites add column if not exists customer_email text;
create index if not exists sites_user_idx on public.sites(user_id, created_at desc);

grant select, insert, update, delete on public.sites to service_role;

-- Safe upgrades for an existing installation that already has the old sites table.
alter table public.sites add column if not exists pricing_key text;
alter table public.sites add column if not exists duration_months integer;
alter table public.sites add column if not exists expires_at timestamptz;
alter table public.sites add column if not exists management_token text;
alter table public.sites add column if not exists plan text;
update public.sites set pricing_key=case when plan::text='999' or plan::text='pro' then 'pro_6m' else 'normal_6m' end where pricing_key is null;
update public.sites set duration_months=6 where duration_months is null;
update public.sites set expires_at=coalesce(expires_at, now()+interval '6 months') where expires_at is null;
update public.sites set management_token=encode(gen_random_bytes(24),'hex') where management_token is null;
alter table public.sites alter column pricing_key set default 'normal_1m';
alter table public.sites alter column duration_months set default 1;
alter table public.sites alter column expires_at set default (now()+interval '1 month');
alter table public.sites alter column management_token set default encode(gen_random_bytes(24),'hex');
create unique index if not exists sites_management_token_idx on public.sites(management_token);
create index if not exists sites_expiry_idx on public.sites(expires_at);
create unique index if not exists sites_order_id_unique_idx on public.sites(order_id) where order_id is not null;

-- If upgrading the old schema, the legacy integer plan constraint/type may exist. Drop/convert it first.
do $$ begin
  if exists (select 1 from pg_constraint where conname='sites_plan_check') then
    alter table public.sites drop constraint sites_plan_check;
  end if;
exception when undefined_object then null; end $$;
do $$ begin
  if (select data_type from information_schema.columns where table_schema='public' and table_name='sites' and column_name='plan') = 'integer' then
    alter table public.sites alter column plan type text using case when plan=999 then 'pro' else 'normal' end;
  end if;
end $$;
alter table public.sites drop constraint if exists sites_duration_months_check;
alter table public.sites add constraint sites_duration_months_check check (duration_months in (1,6,12));
alter table public.sites drop constraint if exists sites_plan_text_check;
alter table public.sites add constraint sites_plan_text_check check (plan in ('normal','pro'));
alter table public.sites alter column plan set default 'normal';
alter table public.sites alter column plan set not null;
alter table public.sites alter column pricing_key set not null;
alter table public.sites alter column duration_months set not null;
alter table public.sites alter column expires_at set not null;
alter table public.sites alter column management_token set not null;

alter table public.sites enable row level security;
drop policy if exists "Public can read published Vibe sites" on public.sites;
create policy "Public can read active Vibe sites" on public.sites
for select using (published = true and expires_at > now());

create or replace function public.touch_sites_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists sites_touch on public.sites;
create trigger sites_touch before update on public.sites
for each row execute function public.touch_sites_updated_at();

-- Recommended website pricing shown to the frontend and enforced again by Edge Functions.
insert into public.admin_controls(key,value) values
('vibe_website_pricing','{"normal_1m":199,"normal_6m":499,"normal_1y":1500,"pro_1m":399,"pro_6m":999,"pro_1y":2000}')
on conflict(key) do update set value=excluded.value, updated_at=now();
