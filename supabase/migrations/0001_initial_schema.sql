-- ============================================================================
-- 0001_initial_schema.sql
-- Core relational schema, constraints, indexes and data-integrity triggers.
-- Run this FIRST in the Supabase SQL Editor (or via the Supabase CLI).
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('customer', 'admin', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum
    ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('cod');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'refunded', 'not_applicable');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- Role is intentionally NOT editable by the client. See trigger below and
-- the column-level grants in 0002_rls_policies.sql.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  avatar_url text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_key on public.profiles (lower(email));

-- Auto-create a profile whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent self-service role / email escalation. SQL Editor (service role,
-- auth.uid() is null) can still change roles when creating the first admin.
create or replace function public.protect_profile_privileged_fields()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null then
    if new.role is distinct from old.role then
      raise exception 'Roles cannot be changed through the profile API.' using errcode = '42501';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Email cannot be changed through the profile API.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_privileged_fields on public.profiles;
create trigger protect_profile_privileged_fields
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_active_order_idx on public.categories (is_active, sort_order);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  sku text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(12,2) not null check (price >= 0),
  discount_percent integer not null default 0 check (discount_percent between 0 and 90),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_featured boolean not null default false,
  is_archived boolean not null default false,
  is_active boolean not null default true,
  sold_count integer not null default 0 check (sold_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_visibility_idx on public.products (is_archived, is_active);
create index if not exists products_featured_idx on public.products (is_featured) where is_featured = true;
create index if not exists products_created_idx on public.products (created_at desc);
create index if not exists products_sold_idx on public.products (sold_count desc);
create index if not exists products_price_idx on public.products (price);
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- Products referenced by order items must be archived, never hard-deleted.
create or replace function public.prevent_deleting_ordered_products()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.order_items oi where oi.product_id = old.id) then
    raise exception 'This product has order history. Archive it instead of deleting it.'
      using errcode = '23503';
  end if;
  return old;
end $$;

-- Record the initial stock as an inventory movement.
create or replace function public.record_initial_stock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.stock_quantity > 0 then
    insert into public.inventory_movements (product_id, change_amount, quantity_after, reason)
    values (new.id, new.stock_quantity, new.stock_quantity, 'Initial stock');
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  house_flat text not null,
  street text not null,
  area text not null,
  city text not null,
  state text not null,
  pin_code text not null,
  landmark text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses (user_id);
create unique index if not exists addresses_one_default_per_user on public.addresses (user_id) where is_default = true;

-- Enforce a single default address per user at the data layer.
create or replace function public.enforce_single_default_address()
returns trigger language plpgsql as $$
begin
  if new.is_default then
    update public.addresses a set is_default = false
    where a.user_id = new.user_id and a.id <> new.id and a.is_default = true;
  end if;
  return new;
end $$;

drop trigger if exists addresses_single_default on public.addresses;
create trigger addresses_single_default before insert or update on public.addresses
  for each row execute function public.enforce_single_default_address();

drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- carts / cart_items
-- ---------------------------------------------------------------------------
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);
create index if not exists cart_items_product_idx on public.cart_items (product_id);

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at before update on public.carts
  for each row execute function public.set_updated_at();

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- orders / order_items
-- Historical snapshots make orders independent of later product edits.
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  status public.order_status not null default 'pending',
  payment_method public.payment_method not null default 'cod',
  payment_status public.payment_status not null default 'not_applicable',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  shipping_amount numeric(12,2) not null default 0 check (shipping_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  total numeric(12,2) not null check (total >= 0),
  currency text not null default 'USD',
  address_snapshot jsonb not null,
  customer_snapshot jsonb not null,
  notes text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_sku text not null,
  product_image_path text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- Order financial fields and snapshots are immutable after creation;
-- only status (and updated_at) may change.
create or replace function public.protect_order_immutable_fields()
returns trigger language plpgsql as $$
begin
  if new.order_number is distinct from old.order_number
     or new.user_id is distinct from old.user_id
     or new.subtotal is distinct from old.subtotal
     or new.total is distinct from old.total
     or new.address_snapshot is distinct from old.address_snapshot
     or new.customer_snapshot is distinct from old.customer_snapshot
     or new.payment_method is distinct from old.payment_method
     or new.payment_status is distinct from old.payment_status
     or new.placed_at is distinct from old.placed_at then
    raise exception 'Order financial and snapshot fields are immutable.' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists orders_protect_immutable on public.orders;
create trigger orders_protect_immutable before update on public.orders
  for each row execute function public.protect_order_immutable_fields();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Keep a denormalised popularity counter for the "best sellers" sort.
create or replace function public.increment_sold_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.product_id is not null then
    update public.products set sold_count = sold_count + new.quantity where id = new.product_id;
  end if;
  return new;
end $$;

drop trigger if exists order_items_increment_sold on public.order_items;
create trigger order_items_increment_sold after insert on public.order_items
  for each row execute function public.increment_sold_count();

-- Attach initial-stock and ordered-product-protection triggers now that
-- the inventory_movements and order_items tables exist.
drop trigger if exists products_record_initial_stock on public.products;
create trigger products_record_initial_stock after insert on public.products
  for each row execute function public.record_initial_stock();

drop trigger if exists products_prevent_delete_ordered on public.products;
create trigger products_prevent_delete_ordered before delete on public.products
  for each row execute function public.prevent_deleting_ordered_products();

-- ---------------------------------------------------------------------------
-- inventory_movements (append-only audit log)
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  change_amount integer not null,
  quantity_after integer not null check (quantity_after >= 0),
  reason text not null,
  reference_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists inventory_product_idx on public.inventory_movements (product_id, created_at desc);

-- The trigger function above references this table; it is now safe to use.
