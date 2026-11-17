import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, ImagePlus } from 'lucide-react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Feedback';
import { useToast } from '@/context/ToastContext';
import { listAllCategories } from '@/services/categories.service';
import { getAdminProduct, saveProduct, uploadProductImages, setProductStock } from '@/services/admin.service';
import { publicImageUrl } from '@/lib/supabase';
import { slugify, getErrorMessage } from '@/lib/utils';
import { validators } from '@/lib/validation';
import type { Category, ProductWithDetails } from '@/types';

interface ImageItem {
  key: string;
  path: string;
  alt_text: string;
  isNew: boolean;
  file?: File;
  preview?: string;
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [originalStock, setOriginalStock] = useState(0);
  const [form, setForm] = useState({
    name: '', slug: '', sku: '', category_id: '', short_description: '', description: '',
    price: '', discount_percent: '0', stock_quantity: '0', is_featured: false, is_active: true,
  });
  const [images, setImages] = useState<ImageItem[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([listAllCategories(), isEdit ? getAdminProduct(id!) : Promise.resolve(null)])
      .then(([cats, product]) => {
        setCategories(cats);
        if (product) fillForm(product);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function fillForm(product: ProductWithDetails) {
    setForm({
      name: product.name, slug: product.slug, sku: product.sku,
      category_id: product.category_id || '', short_description: product.short_description || '',
      description: product.description || '', price: String(product.price),
      discount_percent: String(product.discount_percent), stock_quantity: String(product.stock_quantity),
      is_featured: product.is_featured, is_active: product.is_active,
    });
    setOriginalStock(product.stock_quantity);
    setImages(product.images.map((img) => ({
      key: img.id, path: img.path, alt_text: img.alt_text || '', isNew: false,
      preview: publicImageUrl(img.path) || undefined,
    })));
  }

  function update(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleName(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: isEdit ? f.slug : slugify(value),
      sku: isEdit ? f.sku : `NW-${Date.now().toString().slice(-6)}`,
    }));
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const additions: ImageItem[] = Array.from(files).map((file) => ({
      key: `${file.name}-${Date.now()}-${Math.random()}`,
      path: '', alt_text: form.name, isNew: true, file,
      preview: URL.createObjectURL(file),
    }));
    setImages((current) => [...current, ...additions]);
  }

  function removeImage(item: ImageItem) {
    setImages((current) => current.filter((i) => i.key !== item.key));
    if (!item.isNew) setRemovedIds((ids) => [...ids, item.key]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = [
      validators.required(form.name, 'Product name'),
      validators.required(form.slug, 'URL slug'),
      validators.required(form.sku, 'SKU'),
      validators.positiveNumber(form.price, 'Price'),
      validators.nonNegativeNumber(form.discount_percent, 'Discount'),
      validators.nonNegativeNumber(form.stock_quantity, 'Stock'),
    ].filter(Boolean);
    const discount = Number(form.discount_percent);
    if (discount < 0 || discount > 90) validationErrors.push('Discount must be between 0 and 90 percent.');
    if (validationErrors.length) {
      setError(validationErrors.join(' '));
      showToast(validationErrors[0], 'error');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const newFiles = images.filter((i) => i.isNew && i.file).map((i) => i.file!);
      const uploaded = newFiles.length ? await uploadProductImages(newFiles) : [];
      let uploadIndex = 0;
      const allImages = [
        ...images.filter((i) => !i.isNew).map((i) => ({ path: i.path, alt_text: i.alt_text, sort_order: 0 })),
        ...uploaded.map((path) => ({ path, alt_text: form.name, sort_order: uploadIndex++ })),
      ];
      const productId = await saveProduct({
        name: form.name.trim(),
        slug: slugify(form.slug),
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        sku: form.sku.trim(),
        category_id: form.category_id || null,
        price: Number(form.price),
        discount_percent: discount,
        stock_quantity: Number(form.stock_quantity),
        is_featured: form.is_featured,
        is_active: form.is_active,
        images: allImages,
        removedImageIds: removedIds,
      }, id);
      if (isEdit && Number(form.stock_quantity) !== originalStock) {
        await setProductStock(productId, Number(form.stock_quantity), 'Product edit');
      }
      showToast(isEdit ? 'Product updated.' : 'Product created.', 'success');
      navigate('/admin/products');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <Link to="/admin/products" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-forest-700"><ArrowLeft className="h-4 w-4" /> Back to products</Link>
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Catalogue</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900">{isEdit ? 'Edit product' : 'Add a product'}</h1>
        <p className="mt-2 text-sm text-ink-500">{isEdit ? 'Update product details, pricing, stock and images.' : 'Create a new product for your storefront.'}</p>
      </div>
      {error && <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl text-ink-900">Basic information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Product name" required className="sm:col-span-2"><Input value={form.name} onChange={(e) => handleName(e.target.value)} placeholder="e.g. Heritage Stoneware Mug" /></Field>
              <Field label="URL slug" required><Input value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder="heritage-stoneware-mug" /></Field>
              <Field label="SKU" required><Input value={form.sku} onChange={(e) => update('sku', e.target.value)} placeholder="NW-1001" /></Field>
              <Field label="Category"><Select value={form.category_id} onChange={(e) => update('category_id', e.target.value)}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select></Field>
              <Field label="Short description"><Input value={form.short_description} onChange={(e) => update('short_description', e.target.value)} placeholder="One-line summary" /></Field>
              <Field label="Full description" className="sm:col-span-2"><Textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="min-h-40" placeholder="Materials, care instructions, details…" /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl text-ink-900">Images</h2>
            <p className="mt-1 text-xs text-ink-500">JPEG, PNG, WebP or AVIF up to 5 MB each. The first image is used on product cards.</p>
            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-cream-50 p-8 text-center transition hover:border-forest-500">
              <ImagePlus className="h-7 w-7 text-ink-400" />
              <span className="mt-2 text-sm font-medium text-ink-700">Click to choose images</span>
              <span className="mt-1 text-xs text-ink-400">Multiple images supported</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
            </label>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((item, index) => (
                  <div key={item.key} className="group relative overflow-hidden rounded-lg border border-stone-200">
                    {item.preview ? <img src={item.preview} alt={item.alt_text || `Image ${index + 1}`} className="aspect-square w-full object-cover" /> : <div className="aspect-square w-full bg-stone-100" />}
                    {index === 0 && <span className="absolute left-1 top-1 rounded bg-forest-700 px-1.5 py-0.5 text-[9px] font-bold text-white">MAIN</span>}
                    <button type="button" onClick={() => removeImage(item)} aria-label="Remove image" className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 opacity-0 shadow transition group-hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            {!images.length && <p className="mt-3 flex items-center gap-2 text-xs text-ink-400"><Upload className="h-3.5 w-3.5" /> A placeholder will be shown until an image is uploaded.</p>}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-display text-xl text-ink-900">Pricing & stock</h2>
            <div className="mt-5 space-y-4">
              <Field label="Price (USD)" required><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} /></Field>
              <Field label="Discount %" hint="0–90 percent"><Input type="number" min="0" max="90" step="1" value={form.discount_percent} onChange={(e) => update('discount_percent', e.target.value)} /></Field>
              <Field label="Stock quantity" required><Input type="number" min="0" step="1" value={form.stock_quantity} onChange={(e) => update('stock_quantity', e.target.value)} /></Field>
              {form.price && <p className="rounded-lg bg-forest-50 p-3 text-xs text-forest-800">Customer pays <strong>{formatPrice(form.price, form.discount_percent)}</strong></p>}
            </div>
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-display text-xl text-ink-900">Visibility</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2.5 text-sm text-ink-600"><input type="checkbox" checked={form.is_active} onChange={(e) => update('is_active', e.target.checked)} className="h-4 w-4 accent-forest-700" /> Active (visible in store)</label>
              <label className="flex items-center gap-2.5 text-sm text-ink-600"><input type="checkbox" checked={form.is_featured} onChange={(e) => update('is_featured', e.target.checked)} className="h-4 w-4 accent-forest-700" /> Featured on homepage</label>
            </div>
          </section>
          <Button type="submit" fullWidth size="lg" loading={saving}>{isEdit ? 'Save changes' : 'Create product'}</Button>
        </aside>
      </form>
    </div>
  );
}

function formatPrice(price: string, discount: string) {
  const value = Number(price) * (1 - Number(discount) / 100);
  return `$${value.toFixed(2)}`;
}
