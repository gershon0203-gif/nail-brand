import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/product/ProductImage';
import { PageLoader, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { listAllCategories, saveCategory, deleteCategory, type CategoryInput } from '@/services/categories.service';
import { publicImageUrl } from '@/lib/supabase';
import { slugify, getErrorMessage } from '@/lib/utils';
import { validators } from '@/lib/validation';
import type { Category } from '@/types';

const empty: CategoryInput = { name: '', slug: '', description: '', is_active: true, sort_order: 0, imageFile: null, imagePath: null };

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryInput>(empty);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setCategories(await listAllCategories()); setError(null); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function openNew() { setEditing(null); setForm({ ...empty }); setFileName(''); setModalOpen(true); }
  function openEdit(category: Category) {
    setEditing(category);
    setForm({ name: category.name, slug: category.slug, description: category.description || '', is_active: category.is_active, sort_order: category.sort_order, imagePath: category.image_path, imageFile: null });
    setFileName('');
    setModalOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const errors = [validators.required(form.name, 'Name'), validators.required(form.slug, 'Slug')].filter(Boolean);
    if (errors.length) return;
    setSaving(true);
    try {
      await saveCategory(form, editing?.id);
      setModalOpen(false);
      await load();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function remove(category: Category) {
    if (!window.confirm(`Delete category "${category.name}"? Categories with products cannot be deleted.`)) return;
    try { await deleteCategory(category.id); await load(); }
    catch (err) { setError(getErrorMessage(err)); }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Catalogue</p>
          <h1 className="mt-2 font-display text-4xl text-ink-900">Categories</h1>
          <p className="mt-2 text-sm text-ink-500">Organise your products into easy-to-browse collections.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add category</Button>
      </div>
      {error && <div className="mb-5"><ErrorState message={error} /></div>}
      {loading ? <PageLoader /> : categories.length === 0 ? (
        <EmptyState icon={<Tags className="h-6 w-6" />} title="No categories yet" description="Create your first category to organise the catalogue." action={<Button onClick={openNew}>Add category</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft">
              <ProductImage path={category.image_path} alt={category.name} className="aspect-[16/9] w-full" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl text-ink-900">{category.name}</h2>
                    <p className="mt-0.5 text-xs text-ink-400">/{category.slug}</p>
                  </div>
                  <Badge tone={category.is_active ? 'success' : 'neutral'}>{category.is_active ? 'Active' : 'Hidden'}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink-500">{category.description || 'No description'}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(category)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(category)} className="text-red-600"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit category' : 'Add a category'} size="lg">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))} /></Field>
          <Field label="Slug" required><Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} /></Field>
          <Field label="Sort order"><Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} /></Field>
          <Field label="Image" hint="JPEG, PNG, WebP or AVIF up to 5 MB">
            <input
              type="file" accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => { const file = e.target.files?.[0] || null; setForm((f) => ({ ...f, imageFile: file })); setFileName(file?.name || ''); }}
              className="block w-full text-xs text-ink-500 file:mr-3 file:rounded-lg file:border-0 file:bg-forest-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-forest-700"
            />
            {fileName && <span className="mt-1 block text-[11px] text-ink-400">{fileName}</span>}
          </Field>
          {form.imagePath && !form.imageFile && <div className="sm:col-span-2"><ProductImage path={form.imagePath} alt="Current category image" className="h-28 w-full rounded-lg object-cover" /><p className="mt-1 text-[11px] text-ink-400">{publicImageUrl(form.imagePath)}</p></div>}
          <Field label="Description" className="sm:col-span-2"><Textarea value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <label className="flex items-center gap-2.5 text-sm text-ink-600 sm:col-span-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 accent-forest-700" /> Active (visible in store)
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add category'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
