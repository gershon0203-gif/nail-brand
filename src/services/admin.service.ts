import { demoProducts } from '@/lib/demoData';
import { isDemoMode, publicImageUrl, supabase } from '@/lib/supabase';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, PAGE_SIZE, STORAGE_BUCKETS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';
import type { InventoryMovement, OrderWithItems, Paginated, ProductWithDetails, Profile } from '@/types';

export interface AdminStats {
  products: number;
  customers: number;
  orders: number;
  pendingOrders: number;
  totalSales: number;
  recentOrders: OrderWithItems[];
}

export async function getAdminStats(): Promise<AdminStats> {
  if (isDemoMode) {
    return { products: 200, customers: 0, orders: 0, pendingOrders: 0, totalSales: 0, recentOrders: [] };
  }
  const { data, error } = await supabase.rpc('admin_dashboard_stats');
  if (error) throw error;
  const stats = data as {
    products: number; customers: number; orders: number; pending_orders: number; total_sales: number;
  };
  const recent = await supabase
    .from('orders')
    .select('*, items:order_items(*), profile:profiles!orders_user_id_fkey(id, full_name, email, phone)')
    .order('created_at', { ascending: false })
    .limit(5);
  return {
    products: Number(stats.products || 0),
    customers: Number(stats.customers || 0),
    orders: Number(stats.orders || 0),
    pendingOrders: Number(stats.pending_orders || 0),
    totalSales: Number(stats.total_sales || 0),
    recentOrders: (recent.data || []) as OrderWithItems[],
  };
}

export interface ProductInput {
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  sku: string;
  category_id: string | null;
  price: number;
  discount_percent: number;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  images: Array<{ path: string; alt_text: string | null; sort_order: number }>;
  removedImageIds: string[];
}

export async function adminListProducts(page = 1, search = ''): Promise<Paginated<ProductWithDetails>> {
  if (isDemoMode) {
    const filtered = demoProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return {
      items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: filtered.length,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    };
  }
  let q = supabase
    .from('products')
    .select('*, images:product_images(*), category:categories(*)', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (search) {
    const term = search.replace(/[%,()]/g, ' ').trim();
    if (term) q = q.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  }
  const { data, count, error } = await q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw error;
  return {
    items: (data || []) as ProductWithDetails[],
    total: count || 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil((count || 0) / PAGE_SIZE)),
  };
}

export async function getAdminProduct(id: string): Promise<ProductWithDetails | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, images:product_images(*), category:categories(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as ProductWithDetails) || null;
}

export async function saveProduct(input: ProductInput, id?: string): Promise<string> {
  if (isDemoMode) throw new Error('Product management requires a connected Supabase backend.');
  const payload = {
    name: input.name,
    slug: input.slug,
    short_description: input.short_description,
    description: input.description,
    sku: input.sku,
    category_id: input.category_id,
    price: input.price,
    discount_percent: input.discount_percent,
    stock_quantity: input.stock_quantity,
    is_featured: input.is_featured,
    is_active: input.is_active,
  };

  let productId = id;
  if (productId) {
    const { error } = await supabase.from('products').update(payload).eq('id', productId);
    if (error) throw error;
    if (input.removedImageIds.length) {
      const { error: imgErr } = await supabase.from('product_images').delete().in('id', input.removedImageIds);
      if (imgErr) throw imgErr;
    }
  } else {
    const { data, error } = await supabase.from('products').insert(payload).select('id').single();
    if (error) throw error;
    productId = data.id as string;
  }

  if (input.images.length) {
    const { error } = await supabase.from('product_images').insert(
      input.images.map((img) => ({ ...img, product_id: productId })),
    );
    if (error) throw error;
  }
  return productId!;
}

export async function archiveProduct(id: string): Promise<void> {
  if (isDemoMode) throw new Error('Product management requires a connected Supabase backend.');
  const { error } = await supabase.from('products').update({ is_archived: true, is_active: false }).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  if (isDemoMode) throw new Error('Product management requires a connected Supabase backend.');
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    if (/order|foreign key|restrict/i.test(getErrorMessage(error))) {
      throw new Error('This product has order history. Archive it instead of deleting it.');
    }
    throw error;
  }
}

export async function setProductStock(id: string, quantity: number, reason = 'Admin adjustment'): Promise<void> {
  if (isDemoMode) throw new Error('Stock management requires a connected Supabase backend.');
  const { error } = await supabase.rpc('set_stock', {
    p_product_id: id,
    p_quantity: quantity,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function toggleFeatured(id: string, value: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ is_featured: value }).eq('id', id);
  if (error) throw error;
}

export async function getInventoryMovements(productId: string): Promise<InventoryMovement[]> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as InventoryMovement[];
}

export async function uploadProductImages(files: File[]): Promise<string[]> {
  if (isDemoMode) throw new Error('Image upload requires a connected Supabase backend.');
  const paths: string[] = [];
  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(`${file.name} is not a supported image type.`);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(`${file.name} exceeds the 5 MB limit.`);
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKETS.products).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export function imageUrl(path: string | null | undefined): string | null {
  return publicImageUrl(path);
}

export async function listCustomers(): Promise<Profile[]> {
  if (isDemoMode) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Profile[];
}

export async function getCustomerOrders(userId: string): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as OrderWithItems[];
}
