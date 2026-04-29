create extension if not exists "pgcrypto";

create type public.profile_role as enum ('reader', 'author');
create type public.question_status as enum ('pending', 'approved', 'hidden');
create type public.order_status as enum ('created', 'paid', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.profile_role not null default 'reader',
  created_at timestamptz not null default now()
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  day integer not null unique check (day between 1 and 30),
  title text not null,
  body text not null default '',
  exercise_prompt text not null default '',
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.workbook_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_day integer not null references public.chapters(day) on delete cascade,
  response text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, chapter_day)
);

create table public.community_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null default 'Anonymous reader',
  question text not null,
  answer text,
  status public.question_status not null default 'pending',
  answered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_usd numeric(10, 2) not null check (price_usd >= 0),
  shipping_usd numeric(10, 2) not null default 0 check (shipping_usd >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  checkout_session_id text unique,
  payment_id text,
  status public.order_status not null default 'created',
  subtotal_usd numeric(10, 2) not null check (subtotal_usd >= 0),
  shipping_usd numeric(10, 2) not null check (shipping_usd >= 0),
  total_usd numeric(10, 2) not null check (total_usd >= 0),
  shipping_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price_usd numeric(10, 2) not null check (unit_price_usd >= 0),
  unit_shipping_usd numeric(10, 2) not null default 0 check (unit_shipping_usd >= 0),
  quantity integer not null check (quantity > 0)
);

create or replace function public.is_author()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'author'
  );
$$;

alter table public.profiles enable row level security;
alter table public.chapters enable row level security;
alter table public.workbook_entries enable row level security;
alter table public.community_questions enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "profiles read own or author"
on public.profiles for select
using (id = auth.uid() or public.is_author());

create policy "profiles update own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "public read published chapters"
on public.chapters for select
using (published = true);

create policy "authors manage chapters"
on public.chapters for all
using (public.is_author())
with check (public.is_author());

create policy "read own workbook entries"
on public.workbook_entries for select
using (user_id = auth.uid());

create policy "write own workbook entries"
on public.workbook_entries for insert
with check (user_id = auth.uid());

create policy "update own workbook entries"
on public.workbook_entries for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "read approved community questions"
on public.community_questions for select
using (status = 'approved' or public.is_author());

create policy "readers submit community questions"
on public.community_questions for insert
with check (status = 'pending');

create policy "authors moderate community questions"
on public.community_questions for update
using (public.is_author())
with check (public.is_author());

create policy "public read active products"
on public.products for select
using (active = true);

create policy "authors manage products"
on public.products for all
using (public.is_author())
with check (public.is_author());

create policy "users read own orders"
on public.orders for select
using (user_id = auth.uid() or public.is_author());

create policy "users read own order items"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or public.is_author())
  )
);
