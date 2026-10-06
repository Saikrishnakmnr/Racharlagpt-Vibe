-- ============================================================
-- RacharlaGPT Vibe production repair - 06 Oct 2026
-- RUN ON THE EXISTING NEW SUPABASE PROJECT ONCE.
-- Do NOT delete orders/sites. Do NOT run old repair SQL after this.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Payment state is separate from delivery state.
-- ------------------------------------------------------------
alter table public.orders add column if not exists payment_status text not null default 'created';
alter table public.orders add column if not exists payment_error text;
alter table public.orders add column if not exists payment_captured_at timestamptz;
alter table public.orders add column if not exists refund_status text not null default 'none';
alter table public.orders add column if not exists refund_processed_at timestamptz;

update public.orders
set payment_status = case
  when status = 'refunded' then 'refunded'
  when status in ('paid','processing','ready') and razorpay_payment_id is not null then 'captured'
  when status = 'failed' then 'failed'
  else coalesce(payment_status,'created')
end
where payment_status is null or payment_status = 'created';

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
check (payment_status in ('created','captured','failed','refunded'));

alter table public.orders drop constraint if exists orders_refund_status_check;
alter table public.orders add constraint orders_refund_status_check
check (refund_status in ('none','requested','rejected','processing','processed'));

create unique index if not exists orders_razorpay_payment_unique_idx
on public.orders(razorpay_payment_id)
where razorpay_payment_id is not null;

create index if not exists orders_payment_status_idx
on public.orders(payment_status, created_at desc);

create index if not exists orders_refund_status_idx
on public.orders(refund_status, created_at desc);

-- ------------------------------------------------------------
-- 2. Durable delivery queue.
-- A paid order is not dependent on the customer's browser.
-- ------------------------------------------------------------
create table if not exists public.delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  status text not null default 'queued',
  cursor_page integer not null default 1,
  attempts integer not null default 0,
  locked_at timestamptz,
  last_error text,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_jobs_status_check check (status in ('queued','processing','done','failed')),
  constraint delivery_jobs_cursor_check check (cursor_page >= 1)
);

create index if not exists delivery_jobs_status_idx
on public.delivery_jobs(status, updated_at);

alter table public.delivery_jobs enable row level security;
grant select, insert, update, delete on public.delivery_jobs to service_role;

create or replace function public.touch_delivery_jobs_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists delivery_jobs_touch on public.delivery_jobs;
create trigger delivery_jobs_touch
before update on public.delivery_jobs
for each row execute function public.touch_delivery_jobs_updated_at();

-- ------------------------------------------------------------
-- 3. Razorpay webhook idempotency.
-- The same webhook must never deliver twice.
-- ------------------------------------------------------------
create table if not exists public.razorpay_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique not null,
  event_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists razorpay_events_type_idx
on public.razorpay_events(event_type, created_at desc);

alter table public.razorpay_events enable row level security;
grant select, insert, update, delete on public.razorpay_events to service_role;

-- ------------------------------------------------------------
-- 4. Refund review records.
-- Customers do NOT get a refund button in the app.
-- Admin/support creates or reviews refund records.
-- ------------------------------------------------------------
alter table public.refunds add column if not exists reviewed_at timestamptz;
alter table public.refunds add column if not exists processed_at timestamptz;
alter table public.refunds add column if not exists admin_note text;
alter table public.refunds add column if not exists razorpay_refund_id text;

alter table public.refunds drop constraint if exists refunds_status_check;
alter table public.refunds add constraint refunds_status_check
check (status in ('requested','rejected','processing','processed','failed'));

create unique index if not exists refunds_razorpay_refund_unique_idx
on public.refunds(razorpay_refund_id)
where razorpay_refund_id is not null;

create unique index if not exists refunds_one_active_order_idx
on public.refunds(order_id)
where status in ('requested','processing','processed');

create index if not exists refunds_status_idx
on public.refunds(status, created_at desc);

grant select, insert, update, delete on public.refunds to service_role;

-- ------------------------------------------------------------
-- 5. Site management indexes.
-- ------------------------------------------------------------
create index if not exists sites_user_expiry_idx
on public.sites(user_id, expires_at desc);

create unique index if not exists sites_order_unique_idx
on public.sites(order_id)
where order_id is not null;

-- ------------------------------------------------------------
-- 6. Ensure service role can operate all server-side tables.
-- ------------------------------------------------------------
grant usage on schema public to service_role;
grant select, insert, update, delete on public.orders to service_role;
grant select, insert, update, delete on public.sites to service_role;
grant select, insert, update, delete on public.refunds to service_role;
grant select, insert, update, delete on public.admin_controls to service_role;
grant select, insert, update, delete on public.template_catalog to service_role;

-- ------------------------------------------------------------
-- 7. Existing captured orders get a delivery job.
-- This does NOT create fake payments. It only queues orders that
-- already have a Razorpay payment ID and captured/paid status.
-- ------------------------------------------------------------
insert into public.delivery_jobs(order_id,status,cursor_page)
select id,'queued',1
from public.orders o
where o.razorpay_payment_id is not null
  and o.payment_status = 'captured'
  and o.status in ('paid','processing')
  and not exists (
    select 1 from public.delivery_jobs j where j.order_id=o.id
  )
on conflict (order_id) do nothing;

commit;

-- ------------------------------------------------------------
-- Verification
-- ------------------------------------------------------------
select table_name
from information_schema.tables
where table_schema='public'
and table_name in ('orders','refunds','sites','delivery_jobs','razorpay_events')
order by table_name;

select
  status,
  payment_status,
  delivery_status,
  count(*) as orders
from public.orders
group by status,payment_status,delivery_status
order by status,payment_status,delivery_status;

select status,count(*) as jobs
from public.delivery_jobs
group by status
order by status;

select status,count(*) as refunds
from public.refunds
group by status
order by status;
