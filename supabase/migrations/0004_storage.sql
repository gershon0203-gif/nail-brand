-- ============================================================================
-- 0004_storage.sql
-- Supabase Storage buckets and access policies for product/category images.
-- Run AFTER 0003_functions.sql.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('category-images', 'category-images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Re-run friendly.
drop policy if exists "product_images_public_read" on storage.objects;
drop policy if exists "category_images_public_read" on storage.objects;
drop policy if exists "product_images_admin_write" on storage.objects;
drop policy if exists "category_images_admin_write" on storage.objects;

-- Public read: anyone can view storefront imagery.
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "category_images_public_read" on storage.objects
  for select using (bucket_id = 'category-images');

-- Writes: administrators only. Folder must match the bucket (products/...,
-- categories/...). File type and size are additionally enforced by the bucket
-- configuration above and by frontend validation.
create policy "product_images_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (
    bucket_id = 'product-images'
    and public.is_admin()
    and (storage.foldername(name))[1] = 'products'
  );

create policy "category_images_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'category-images' and public.is_admin())
  with check (
    bucket_id = 'category-images'
    and public.is_admin()
    and (storage.foldername(name))[1] = 'categories'
  );
