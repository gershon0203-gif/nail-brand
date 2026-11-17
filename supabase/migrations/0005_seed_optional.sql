-- ============================================================================
-- 0005_seed_optional.sql  (OPTIONAL - demo/test data only)
-- Creates 8 categories and 200 sample products so the catalogue, filters and
-- pagination can be exercised immediately. Safe to skip in production.
-- Products intentionally have NO images: upload real images in the admin UI.
-- ============================================================================

insert into public.categories (name, slug, description, sort_order) values
  ('Kitchen & Dining', 'kitchen-dining', 'Considered essentials for the everyday table.', 1),
  ('Home Decor', 'home-decor', 'Quiet pieces that make a room feel like yours.', 2),
  ('Personal Care', 'personal-care', 'Simple rituals, thoughtfully made.', 3),
  ('Apparel', 'apparel', 'Easy layers in natural fibres.', 4),
  ('Accessories', 'accessories', 'The small details that finish the look.', 5),
  ('Stationery', 'stationery', 'Paper goods worth writing on.', 6),
  ('Wellness', 'wellness', 'Small habits for a calmer day.', 7),
  ('Outdoor', 'outdoor', 'Made for slow mornings and long evenings.', 8)
on conflict (slug) do nothing;

do $$
declare
  v_slugs text[] := array[
    'kitchen-dining','home-decor','personal-care','apparel',
    'accessories','stationery','wellness','outdoor'
  ];
  v_nouns text[] := array[
    'Stoneware Mug','Oak Serving Board','Linen Tea Towel','Ceramic Bowl',
    'Copper Saucepan','Glass Carafe','Linen Cushion','Ceramic Vase',
    'Woven Throw','Wall Mirror','Soy Candle','Marble Tray',
    'Botanical Soap','Shea Hand Balm','Argan Hair Oil','Bamboo Brush',
    'Bath Salts','Face Cloth','Cotton Tee','Linen Shirt',
    'Wool Cardigan','Everyday Tote','Cotton Scarf','Relaxed Trouser',
    'Leather Wallet','Canvas Belt','Silver Pendant','Wool Beanie'
  ];
  v_finish text[] := array['Sand','Olive','Ash','Clay','Charcoal','Cream','Walnut','Slate'];
  v_adjectives text[] := array['Classic','Everyday','Heritage','Studio','Natural','Signature'];
  v_i integer;
  v_name text;
  v_slug text;
  v_cat_id uuid;
begin
  for v_i in 1..200 loop
    v_name := v_adjectives[((v_i - 1) % array_length(v_adjectives, 1)) + 1] || ' '
           || v_nouns[((v_i - 1) % array_length(v_nouns, 1)) + 1] || ' '
           || v_finish[((v_i - 1) % array_length(v_finish, 1)) + 1];
    v_slug := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || v_i;
    select id into v_cat_id from public.categories
      where slug = v_slugs[((v_i - 1) % array_length(v_slugs, 1)) + 1];

    insert into public.products (
      name, slug, short_description, description, sku, category_id,
      price, discount_percent, stock_quantity, is_featured, is_active
    )
    values (
      v_name,
      v_slug,
      'A thoughtfully chosen everyday essential in ' || lower(v_finish[((v_i - 1) % 8) + 1]) || '.',
      'The ' || v_name || ' is selected for honest materials, considered finishing and everyday usefulness. Care instructions and full details are available from our team.',
      'NW-' || lpad(v_i::text, 4, '0'),
      v_cat_id,
      (12 + ((v_i * 37) % 180)) + 0.99,
      case when v_i % 7 = 0 then 15 when v_i % 11 = 0 then 10 else 0 end,
      case when v_i % 29 = 0 then 0 else 5 + (v_i % 50) end,
      v_i % 9 = 0,
      true
    )
    on conflict (sku) do nothing;
  end loop;
end $$;
