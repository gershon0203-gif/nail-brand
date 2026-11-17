-- ============================================================================
-- 0003_functions.sql
-- Server-side business logic. All money/stock decisions happen here, never in
-- the browser. Functions are SECURITY DEFINER with a pinned search_path.
-- Run AFTER 0002_rls_policies.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Internal: get (or lazily create) the caller's cart.
-- ---------------------------------------------------------------------------
create or replace function public.ensure_cart()
returns uuid language plpgsql security definer set search_path = public as $$
declare v_cart_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to use a cart.' using errcode = '42501';
  end if;
  insert into public.carts (user_id) values (auth.uid())
    on conflict (user_id) do nothing;
  select id into v_cart_id from public.carts where user_id = auth.uid();
  return v_cart_id;
end $$;

-- ---------------------------------------------------------------------------
-- Cart count used by the header badge.
-- ---------------------------------------------------------------------------
create or replace function public.get_cart_count()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer := 0;
begin
  if auth.uid() is null then return 0; end if;
  select coalesce(sum(ci.quantity), 0)::integer into v_count
  from public.cart_items ci
  join public.carts c on c.id = ci.cart_id
  where c.user_id = auth.uid();
  return v_count;
end $$;

-- ---------------------------------------------------------------------------
-- Add to cart with authoritative stock validation.
-- Returns the new cart item count as JSON so the UI stays in sync.
-- ---------------------------------------------------------------------------
create or replace function public.add_to_cart(p_product_id uuid, p_quantity integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_cart_id uuid;
  v_stock integer;
  v_archived boolean;
  v_active boolean;
  v_existing integer;
  v_next integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to add items to your cart.' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantity must be at least 1.' using errcode = '22023';
  end if;

  -- Lock the product row so two shoppers cannot oversell the same stock.
  select stock_quantity, is_archived, is_active
    into v_stock, v_archived, v_active
  from public.products where id = p_product_id for update;
  if not found then raise exception 'Product not found.' using errcode = '22023'; end if;
  if v_archived or not v_active then raise exception 'This product is not available.' using errcode = '22023'; end if;

  v_cart_id := public.ensure_cart();
  select quantity into v_existing from public.cart_items
    where cart_id = v_cart_id and product_id = p_product_id;
  v_next := least(coalesce(v_existing, 0) + p_quantity, 100);

  if v_next > v_stock then
    raise exception 'Only % available in stock.', v_stock using errcode = '22023';
  end if;

  insert into public.cart_items (cart_id, product_id, quantity)
  values (v_cart_id, p_product_id, v_next)
  on conflict (cart_id, product_id) do update set quantity = excluded.quantity;

  return jsonb_build_object('cart_count', public.get_cart_count());
end $$;

-- ---------------------------------------------------------------------------
-- Set an exact cart quantity (0 removes the line).
-- ---------------------------------------------------------------------------
create or replace function public.set_cart_quantity(p_product_id uuid, p_quantity integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_cart_id uuid;
  v_stock integer;
  v_archived boolean;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to update your cart.' using errcode = '42501';
  end if;
  v_cart_id := public.ensure_cart();

  if p_quantity <= 0 then
    delete from public.cart_items where cart_id = v_cart_id and product_id = p_product_id;
    return jsonb_build_object('cart_count', public.get_cart_count());
  end if;

  select stock_quantity, is_archived into v_stock, v_archived
  from public.products where id = p_product_id for update;
  if not found then raise exception 'Product not found.' using errcode = '22023'; end if;
  if v_archived then raise exception 'This product is not available.' using errcode = '22023'; end if;
  if p_quantity > v_stock then
    raise exception 'Only % available in stock.', v_stock using errcode = '22023';
  end if;

  insert into public.cart_items (cart_id, product_id, quantity)
  values (v_cart_id, p_product_id, least(p_quantity, 100))
  on conflict (cart_id, product_id) do update set quantity = excluded.quantity;

  return jsonb_build_object('cart_count', public.get_cart_count());
end $$;

create or replace function public.remove_from_cart(p_product_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cart_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '42501'; end if;
  select id into v_cart_id from public.carts where user_id = auth.uid();
  if v_cart_id is not null then
    delete from public.cart_items where cart_id = v_cart_id and product_id = p_product_id;
  end if;
  return jsonb_build_object('cart_count', public.get_cart_count());
end $$;

create or replace function public.clear_cart()
returns void language plpgsql security definer set search_path = public as $$
declare v_cart_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '42501'; end if;
  select id into v_cart_id from public.carts where user_id = auth.uid();
  if v_cart_id is not null then
    delete from public.cart_items where cart_id = v_cart_id;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Addresses: set default (trigger enforces a single default per user).
-- ---------------------------------------------------------------------------
create or replace function public.set_default_address(p_user_id uuid, p_address_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'You can only manage your own addresses.' using errcode = '42501';
  end if;
  update public.addresses set is_default = true
  where id = p_address_id and user_id = p_user_id;
  if not found then raise exception 'Address not found.' using errcode = '22023'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- Admin-only stock adjustment with an audit record.
-- ---------------------------------------------------------------------------
create or replace function public.set_stock(p_product_id uuid, p_quantity integer, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_old integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 0 then
    raise exception 'Stock cannot be negative.' using errcode = '22023';
  end if;
  select stock_quantity into v_old from public.products where id = p_product_id for update;
  if not found then raise exception 'Product not found.' using errcode = '22023'; end if;

  update public.products set stock_quantity = p_quantity where id = p_product_id;
  insert into public.inventory_movements
    (product_id, change_amount, quantity_after, reason, created_by)
  values (p_product_id, p_quantity - v_old, p_quantity,
          coalesce(nullif(p_reason, ''), 'Admin adjustment'), auth.uid());
end $$;

-- ---------------------------------------------------------------------------
-- MAIN ORDER FUNCTION -------------------------------------------------------
-- Atomic, server-side order creation. Runs in a single transaction (a
-- function call is atomic in PostgreSQL), locks stock rows, recalculates
-- every price from the database, writes snapshots, decrements stock, records
-- inventory movements and clears the cart. Browser-supplied prices/totals are
-- never accepted. Only COD is supported in this phase.
-- ---------------------------------------------------------------------------
create or replace function public.create_order_from_cart(
  p_address_id uuid,
  p_payment_method text default 'cod',
  p_notes text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_cart_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_item record;
  v_product record;
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_unit_price numeric(12,2);
  v_address record;
  v_customer record;
  v_image_path text;
  v_after integer;
begin
  if v_user is null then
    raise exception 'You must be signed in to place an order.' using errcode = '42501';
  end if;
  if coalesce(p_payment_method, '') <> 'cod' then
    raise exception 'Unsupported payment method. Only Cash on Delivery is available.' using errcode = '22023';
  end if;

  -- Address must belong to the caller; snapshot it before the cart is cleared.
  select * into v_address from public.addresses
    where id = p_address_id and user_id = v_user;
  if not found then
    raise exception 'Invalid delivery address.' using errcode = '22023';
  end if;

  select * into v_customer from public.profiles where id = v_user;
  if not found then raise exception 'Profile not found.' using errcode = '22023'; end if;

  select id into v_cart_id from public.carts where user_id = v_user;
  if v_cart_id is null or not exists (
    select 1 from public.cart_items where cart_id = v_cart_id
  ) then
    raise exception 'Your cart is empty.' using errcode = '22023';
  end if;

  -- Pass 1: lock stock rows in a deterministic order and compute trusted totals.
  for v_item in
    select ci.product_id, ci.quantity, ci.cart_id
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = v_cart_id
      and p.is_archived = false
      and p.is_active = true
    order by p.id
    for update of p, ci
  loop
    if v_item.quantity < 1 then
      raise exception 'Invalid cart quantity.' using errcode = '22023';
    end if;
    select * into v_product from public.products where id = v_item.product_id;
    if v_product.stock_quantity < v_item.quantity then
      raise exception 'Insufficient stock for %. Only % available.',
        v_product.name, v_product.stock_quantity using errcode = '22023';
    end if;
    v_unit_price := round(v_product.price * (1 - v_product.discount_percent / 100.0), 2);
    v_subtotal := v_subtotal + (v_unit_price * v_item.quantity);
  end loop;

  if v_subtotal <= 0 then
    raise exception 'Order total could not be calculated.' using errcode = '22023';
  end if;

  -- Shipping / tax / discount are explicit placeholders ready for future
  -- shipping (Shiprocket) and promotion modules. They are always 0 today.
  v_total := v_subtotal;

  v_order_number := 'NW-' || to_char(now(), 'YYYYMMDD') || '-' ||
                    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (
    order_number, user_id, status, payment_method, payment_status,
    subtotal, shipping_amount, tax_amount, discount_amount, total, currency,
    address_snapshot, customer_snapshot, notes, placed_at
  )
  values (
    v_order_number, v_user, 'pending', 'cod', 'not_applicable',
    v_subtotal, 0, 0, 0, v_total, 'USD',
    jsonb_build_object(
      'label', v_address.label,
      'full_name', v_address.full_name,
      'phone', v_address.phone,
      'house_flat', v_address.house_flat,
      'street', v_address.street,
      'area', v_address.area,
      'city', v_address.city,
      'state', v_address.state,
      'pin_code', v_address.pin_code,
      'landmark', v_address.landmark
    ),
    jsonb_build_object(
      'id', v_customer.id,
      'full_name', v_customer.full_name,
      'email', v_customer.email,
      'phone', v_customer.phone
    ),
    nullif(p_notes, ''), now()
  )
  returning id into v_order_id;

  -- Pass 2: write immutable item snapshots and decrement stock. Rows remain
  -- locked from pass 1, so no concurrent order can oversell them.
  for v_item in
    select ci.product_id, ci.quantity
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = v_cart_id
      and p.is_archived = false
      and p.is_active = true
    order by p.id
    for update of p, ci
  loop
    select * into v_product from public.products where id = v_item.product_id;
    select path into v_image_path from public.product_images
      where product_id = v_item.product_id order by sort_order limit 1;
    v_unit_price := round(v_product.price * (1 - v_product.discount_percent / 100.0), 2);

    insert into public.order_items (
      order_id, product_id, product_name, product_sku, product_image_path,
      quantity, unit_price, line_total
    )
    values (
      v_order_id, v_product.id, v_product.name, v_product.sku, v_image_path,
      v_item.quantity, v_unit_price, round(v_unit_price * v_item.quantity, 2)
    );

    update public.products
      set stock_quantity = stock_quantity - v_item.quantity
    where id = v_item.product_id and stock_quantity >= v_item.quantity
    returning stock_quantity into v_after;
    if not found then
      raise exception 'Stock changed while placing the order. Please try again.' using errcode = '40001';
    end if;

    insert into public.inventory_movements
      (product_id, change_amount, quantity_after, reason, reference_id, created_by)
    values (v_item.product_id, -v_item.quantity, v_after,
            'Order ' || v_order_number, v_order_id, v_user);
  end loop;

  delete from public.cart_items where cart_id = v_cart_id;

  return jsonb_build_object('orderId', v_order_id, 'orderNumber', v_order_number);
end $$;

-- ---------------------------------------------------------------------------
-- Admin dashboard aggregates (single round trip).
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'products', (select count(*) from public.products),
    'customers', (select count(*) from public.profiles where role = 'customer'),
    'orders', (select count(*) from public.orders),
    'pending_orders', (select count(*) from public.orders where status = 'pending'),
    'total_sales', (select coalesce(sum(total), 0) from public.orders where status <> 'cancelled')
  ) into v_result;
  return v_result;
end $$;

-- ---------------------------------------------------------------------------
-- Permissions. Customers may call cart/order functions; stock and stats are
-- additionally guarded by is_admin() inside the function body.
-- ---------------------------------------------------------------------------
revoke all on function public.ensure_cart() from public;
revoke all on function public.get_cart_count() from public;
revoke all on function public.add_to_cart(uuid, integer) from public;
revoke all on function public.set_cart_quantity(uuid, integer) from public;
revoke all on function public.remove_from_cart(uuid) from public;
revoke all on function public.clear_cart() from public;
revoke all on function public.set_default_address(uuid, uuid) from public;
revoke all on function public.set_stock(uuid, integer, text) from public;
revoke all on function public.create_order_from_cart(uuid, text, text) from public;
revoke all on function public.admin_dashboard_stats() from public;

grant execute on function public.ensure_cart() to authenticated;
grant execute on function public.get_cart_count() to authenticated;
grant execute on function public.add_to_cart(uuid, integer) to authenticated;
grant execute on function public.set_cart_quantity(uuid, integer) to authenticated;
grant execute on function public.remove_from_cart(uuid) to authenticated;
grant execute on function public.clear_cart() to authenticated;
grant execute on function public.set_default_address(uuid, uuid) to authenticated;
grant execute on function public.set_stock(uuid, integer, text) to authenticated;
grant execute on function public.create_order_from_cart(uuid, text, text) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;

grant execute on all functions in schema public to service_role;
