-- ============================================================================
-- 0002_rls_policies.sql
-- Row Level Security on every exposed table + least-privilege grants.
-- Run AFTER 0001_initial_schema.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Authorization helpers. SECURITY DEFINER avoids recursive RLS evaluation on
-- the profiles table. search_path is pinned to prevent function hijacking.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;
revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere. Tables without policies deny all by default.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;

-- Drop any policies with the same names so this migration is re-runnable.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','categories','products','product_images',
                        'addresses','carts','cart_items','orders','order_items','inventory_movements')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- profiles: customers see/edit only themselves; admins may read all.
-- Role/email changes are additionally blocked by column grants + trigger.
-- ---------------------------------------------------------------------------
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- categories / products / product_images: public read of active rows only,
-- admins have full management access.
-- ---------------------------------------------------------------------------
create policy "categories_public_read" on public.categories
  for select using (is_active = true or public.is_admin());

create policy "categories_admin_insert" on public.categories
  for insert to authenticated with check (public.is_admin());
create policy "categories_admin_update" on public.categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "categories_admin_delete" on public.categories
  for delete to authenticated using (public.is_admin());

create policy "products_public_read" on public.products
  for select using ((is_archived = false and is_active = true) or public.is_admin());

create policy "products_admin_insert" on public.products
  for insert to authenticated with check (public.is_admin());
create policy "products_admin_update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products_admin_delete" on public.products
  for delete to authenticated using (public.is_admin());

create policy "product_images_public_read" on public.product_images
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and ((p.is_archived = false and p.is_active = true) or public.is_admin())
    )
  );
create policy "product_images_admin_insert" on public.product_images
  for insert to authenticated with check (public.is_admin());
create policy "product_images_admin_update" on public.product_images
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "product_images_admin_delete" on public.product_images
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- addresses: strict ownership. Admins may read for support snapshots only.
-- ---------------------------------------------------------------------------
create policy "addresses_owner_select" on public.addresses
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "addresses_owner_insert" on public.addresses
  for insert to authenticated with check (user_id = auth.uid());
create policy "addresses_owner_update" on public.addresses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "addresses_owner_delete" on public.addresses
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- cart: one cart per user, items reachable only through the owner's cart.
-- ---------------------------------------------------------------------------
create policy "carts_owner_all" on public.carts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "cart_items_owner_select" on public.cart_items
  for select to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );
create policy "cart_items_owner_insert" on public.cart_items
  for insert to authenticated with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );
create policy "cart_items_owner_update" on public.cart_items
  for update to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );
create policy "cart_items_owner_delete" on public.cart_items
  for delete to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- orders: customers read only their own; ONLY admins may update (status only,
-- enforced by trigger 0001). No direct INSERT/DELETE from the browser: order
-- creation goes through the SECURITY DEFINER function / Edge Function.
-- ---------------------------------------------------------------------------
create policy "orders_owner_or_admin_select" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "orders_admin_update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "order_items_owner_or_admin_select" on public.order_items
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- inventory_movements: read-only audit trail for admins. Writes happen only
-- inside SECURITY DEFINER functions/triggers.
-- ---------------------------------------------------------------------------
create policy "inventory_admin_select" on public.inventory_movements
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Least-privilege table grants. RLS still applies on top of these.
-- ---------------------------------------------------------------------------
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
grant update on public.orders to authenticated;

revoke all on public.order_items from anon, authenticated;
grant select on public.order_items to authenticated;

revoke all on public.inventory_movements from anon, authenticated;
grant select on public.inventory_movements to authenticated;

revoke all on public.profiles from anon;
revoke update on public.profiles from authenticated;
-- Explicit column-level update rights: role and email are NOT included.
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant select on public.profiles to authenticated;
grant insert on public.profiles to authenticated;

revoke all on public.categories from anon;
revoke all on public.products from anon;
revoke all on public.product_images from anon;
revoke all on public.addresses from anon;
revoke all on public.carts from anon;
revoke all on public.cart_items from anon;

-- Read-only public catalogue access for anonymous visitors.
grant select on public.categories, public.products, public.product_images to anon;
