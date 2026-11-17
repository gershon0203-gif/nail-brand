import { demoCategories } from '@/lib/demoData';
import { isDemoMode, publicImageUrl, storagePathFromUrl, supabase } from '@/lib/supabase';
import { STORAGE_BUCKETS } from '@/lib/constants';
import type { Category } from '@/types';

export async function listCategories(): Promise<Category[]> {
  if (isDemoMode) return demoCategories;
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (isDemoMode) return demoCategories.find((c) => c.slug === slug) || null;
  const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return (data as Category) || null;
}

export async function listAllCategories(): Promise<Category[]> {
  if (isDemoMode) return demoCategories;
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) throw error;
  return (data || []) as Category[];
}

export type CategoryInput = Pick<Category, 'name' | 'slug' | 'description' | 'is_active' | 'sort_order'> & {
  imageFile?: File | null;
  imagePath?: string | null;
};

export async function saveCategory(input: CategoryInput, id?: string): Promise<Category> {
  let imagePath = input.imagePath || null;
  if (input.imageFile) {
    imagePath = await uploadCategoryImage(input.imageFile);
  }
  const payload = {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    is_active: input.is_active,
    sort_order: input.sort_order,
    image_path: imagePath,
  };
  if (id) {
    const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Category;
  }
  const { data, error } = await supabase.from('categories').insert(payload).select().single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadCategoryImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.categories).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function categoryImageUrl(category: Category | null | undefined): string | null {
  return publicImageUrl(category?.image_path);
}

export function toStoragePath(urlOrPath: string): string {
  return storagePathFromUrl(urlOrPath);
}
