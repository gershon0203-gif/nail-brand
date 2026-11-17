import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Archive, Trash2, Star, Boxes } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { ProductImage } from '@/components/product/ProductImage';
import { PageLoader, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { adminListProducts, archiveProduct, deleteProduct, setProductStock, toggleFeatured } from '@/services/admin.service';
import { useToast } from '@/context/ToastContext';
import { useDebounce } from '@/hooks/useDebounce';
import { discountPrice, formatCurrency, getErrorMessage, cn } from '@/lib/utils';
import type { ProductWithDetails } from '@/types';

export default function AdminProducts() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof adminListProducts>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockProduct, setStockProduct] = useState<ProductWithDetails | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListProducts(page, debounced);
      setResult(data);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [page, debounced]);
  useEffect(() => { setPage(1); }, [debounced]);

  async function archive(product: ProductWithDetails) {
    if (!window.confirm(`Archive "${product.name}"? It will be hidden from the storefront.`)) return;
    try { await archiveProduct(product.id); showToast('Product archived.', 'success'); await load(); }
    catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  async function remove(product: ProductWithDetails) {
    if (!window.confirm(`Permanently delete "${product.name}"? Products with order history cannot be deleted.`)) return;
    try { await deleteProduct(product.id); showToast('Product deleted.', 'success'); await load(); }
    catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  async function feature(product: ProductWithDetails, value: boolean) {
    try { await toggleFeatured(product.id, value); showToast(value ? 'Marked as featured.' : 'Removed from featured.', 'success'); await load(); }
    catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  async function saveStock() {
    if (!stockProduct) return;
    const qty = Number(stockValue);
    if (!Number.isInteger(qty) || qty < 0) { showToast('Enter a whole number of zero or more.', 'error'); return; }
    setSaving(true);
    try {
      await setProductStock(stockProduct.id, qty, 'Admin adjustment');
      showToast('Stock updated and movement recorded.', 'success');
      setStockProduct(null);
      await load();
    } catch (err) { showToast(getErrorMessage(err), 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Catalogue</p>
          <h1 className="mt-2 font-display text-4xl text-ink-900">Products</h1>
          <p className="mt-2 text-sm text-ink-500">Add products, manage prices, stock and images.</p>
        </div>
        <Link to="/admin/products/new"><Button><Plus className="h-4 w-4" /> Add product</Button></Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU…" className="max-w-sm" aria-label="Search products" />
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : loading ? <PageLoader /> : !result?.items.length ? (
        <EmptyState icon={<Boxes className="h-6 w-6" />} title="No products found" description="Add your first product to start building the catalogue." action={<Link to="/admin/products/new"><Button>Add product</Button></Link>} />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead><tr className="border-b border-stone-200 bg-cream-50 text-[11px] uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-semibold">Product</th><th className="px-4 py-3 font-semibold">Category</th><th className="px-4 py-3 font-semibold">Price</th><th className="px-4 py-3 font-semibold">Stock</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-stone-100">
                  {result.items.map((product) => {
                    const effective = discountPrice(product.price, product.discount_percent);
                    return (
                      <tr key={product.id} className={cn('hover:bg-cream-50', product.is_archived && 'opacity-60')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ProductImage path={product.images?.[0]?.path} alt={product.name} className="h-11 w-11 rounded-lg" />
                            <div className="min-w-0">
                              <p className="line-clamp-1 font-medium text-ink-800">{product.name}</p>
                              <p className="text-xs text-ink-400">SKU {product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-600">{product.category?.name || '—'}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink-800">{formatCurrency(effective)}</p>
                          {product.discount_percent > 0 && <p className="text-[11px] text-ink-400 line-through">{formatCurrency(product.price)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => { setStockProduct(product); setStockValue(String(product.stock_quantity)); }} className="font-medium text-forest-700 hover:underline">
                            {product.stock_quantity} units
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {product.is_archived ? <Badge tone="neutral">Archived</Badge> : product.is_active ? <Badge tone="success">Active</Badge> : <Badge tone="warning">Hidden</Badge>}
                            {product.is_featured && <Badge tone="clay"><Star className="mr-1 h-3 w-3" />Featured</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => feature(product, !product.is_featured)} title={product.is_featured ? 'Remove featured' : 'Make featured'} className="rounded-lg p-2 text-ink-400 hover:bg-clay-50 hover:text-clay-600"><Star className="h-4 w-4" /></button>
                            <Link to={`/admin/products/${product.id}`} title="Edit" className="rounded-lg p-2 text-ink-400 hover:bg-stone-100 hover:text-forest-700"><Pencil className="h-4 w-4" /></Link>
                            <button type="button" onClick={() => archive(product)} disabled={product.is_archived} title="Archive" className="rounded-lg p-2 text-ink-400 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-30"><Archive className="h-4 w-4" /></button>
                            <button type="button" onClick={() => remove(product)} title="Delete" className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} className="mt-6" />
        </>
      )}

      <Modal open={!!stockProduct} onClose={() => setStockProduct(null)} title="Adjust stock" description={stockProduct?.name}>
        <form onSubmit={(e) => { e.preventDefault(); void saveStock(); }} className="space-y-4">
          <Field label="Stock quantity" hint="This change is recorded in inventory movements." required>
            <Input type="number" min="0" step="1" value={stockValue} onChange={(e) => setStockValue(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-3">
            <Button type="submit" loading={saving}>Save stock</Button>
            <Button type="button" variant="ghost" onClick={() => setStockProduct(null)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
