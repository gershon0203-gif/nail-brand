import { demoCategories, demoProducts, demoProductById } from '@/lib/demoData';
import { listCategories } from '@/services/categories.service';
import { isDemoMode, supabase } from '@/lib/supabase';
import { PAGE_SIZE } from '@/lib/constants';
import type { Paginated, ProductQuery, ProductWithDetails } from '@/types';

const PRODUCT_SELECT = '*, images:product_images(*), category:categories(*)';

function normalise(row: Record<string, unknown>): ProductWithDetails {
  return {
    ...(row as unknown as ProductWithDetails),
    images: (row.images as ProductWithDetails['images']) || [],
    category: (row.category as ProductWithDetails['category']) || null,
  };
}

function demoFilter(query: ProductQuery): Paginated<ProductWithDetails> {
  let items = demoProducts.filter((p) => !p.is_archived);
  if (query.categorySlug) items = items.filter((p) => p.category?.slug === query.categorySlug);
  if (query.featuredOnly) items = items.filter((p) => p.is_featured);
  if (query.search) {
    const term = query.search.toLowerCase();
    items = items.filter((p) =>
      [p.name, p.sku, p.short_description || '', p.category?.name || '']
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }
  if (query.minPrice !== undefined) items = items.filter((p) => p.price >= query.minPrice!);
  if (query.maxPrice !== undefined) items = items.filter((p) => p.price <= query.maxPrice!);

  switch (query.sort) {
    case 'price_asc': items.sort((a, b) => a.price - b.price); break;
    case 'price_desc': items.sort((a, b) => b.price - a.price); break;
    case 'popular': items.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0)); break;
    case 'name_asc': items.sort((a, b) => a.name.localeCompare(b.name)); break;
    default: items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const page = Math.max(1, query.page || 1);
  const pageSize = Math.max(1, query.pageSize || PAGE_SIZE);
  const total = items.length;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listProducts(query: ProductQuery = {}): Promise<Paginated<ProductWithDetails>> {
  if (isDemoMode) return demoFilter(query);

  const page = Math.max(1, query.page || 1);
  const pageSize = Math.max(1, query.pageSize || PAGE_SIZE);
  let q = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('is_archived', false)
    .eq('is_active', true);

  if (query.featuredOnly) q = q.eq('is_featured', true);
  if (query.minPrice !== undefined) q = q.gte('price', query.minPrice);
  if (query.maxPrice !== undefined) q = q.lte('price', query.maxPrice);
  if (query.search) {
    const term = query.search.replace(/[%,()]/g, ' ').trim();
    if (term) q = q.or(`name.ilike.%${term}%,short_description.ilike.%${term}%,sku.ilike.%${term}%`);
  }

  if (query.categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', query.categorySlug)
      .maybeSingle();
    if (!category) {
      return { items: [], total: 0, page, pageSize, totalPages: 1 };
    }
    q = q.eq('category_id', category.id);
  }

  switch (query.sort) {
    case 'price_asc': q = q.order('price', { ascending: true }); break;
    case 'price_desc': q = q.order('price', { ascending: false }); break;
    case 'popular': q = q.order('sold_count', { ascending: false }); break;
    case 'name_asc': q = q.order('name', { ascending: true }); break;
    default: q = q.order('created_at', { ascending: false });
  }

  const { data, count, error } = await q.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw error;

  return {
    items: ((data || []) as Record<string, unknown>[]).map(normalise),
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  };
}

export async function getProduct(idOrSlug: string): Promise<ProductWithDetails | null> {
  if (isDemoMode) return demoProductById(idOrSlug) || null;
  const bySlug = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(idOrSlug) ? 'id' : 'slug';
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq(bySlug, idOrSlug)
    .eq('is_archived', false)
    .maybeSingle();
  if (error) throw error;
  return data ? normalise(data as Record<string, unknown>) : null;
}

export async function getRelatedProducts(product: ProductWithDetails, limit = 4): Promise<ProductWithDetails[]> {
  if (isDemoMode) {
    return demoProducts
      .filter((p) => p.category_id === product.category_id && p.id !== product.id)
      .slice(0, limit);
  }
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_archived', false)
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data || []) as Record<string, unknown>[]).map(normalise);
}

export async function getHomepageData() {
  const [featured, latest, best, categories] = await Promise.all([
    listProducts({ featuredOnly: true, pageSize: 8 }),
    listProducts({ sort: 'newest', pageSize: 8 }),
    listProducts({ sort: 'popular', pageSize: 8 }),
    listCategories(),
  ]);
  return { featured: featured.items, latest: latest.items, best: best.items, categories };
}

export function searchSuggestions(term: string, limit = 6): ProductWithDetails[] {
  if (!isDemoMode || term.length < 2) return [];
  const t = term.toLowerCase();
  return demoProducts.filter((p) => p.name.toLowerCase().includes(t)).slice(0, limit);
}

export { demoCategories };
