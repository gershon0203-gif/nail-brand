-- Read-only verification queries for FINAL_SUPABASE_PRE_DEPLOYMENT_AUDIT.md
-- Run with: supabase db query --remote=vmdmniiynbcysbbrhbqo --read-only --file <this file>

-- Q1: exact intended check from reports/EDGE_FUNCTION_DEPLOYMENT_REPORT.md (expect 5 rows)
select p.proname, pg_get_function_identity_arguments(p.oid) as args,
       pg_get_function_result(p.oid) as returns, p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
('create_order_from_cart','add_to_cart','set_cart_quantity','set_stock','admin_dashboard_stats')
order by p.proname;

-- Q2: create_order_from_cart definition safety markers (no secrets, no data)
select
  (position('auth.uid()' in pg_get_functiondef(p.oid)) > 0) as checks_auth_uid,
  (position('user_id = v_user' in pg_get_functiondef(p.oid)) > 0) as checks_address_owner,
  (position('for update' in lower(pg_get_functiondef(p.oid))) > 0) as locks_stock_rows,
  (position('stock_quantity >= v_item.quantity' in pg_get_functiondef(p.oid)) > 0) as guarded_stock_update,
  (position('insert into public.order_items' in pg_get_functiondef(p.oid)) > 0) as writes_order_items,
  (position('inventory_movements' in pg_get_functiondef(p.oid)) > 0) as writes_inventory_movement,
  (position('discount_percent' in pg_get_functiondef(p.oid)) > 0) as server_price_calc,
  (position('delete from public.cart_items' in pg_get_functiondef(p.oid)) > 0) as clears_cart
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='create_order_from_cart';
