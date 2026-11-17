import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { ProductImage } from '@/components/product/ProductImage';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { discountPrice, formatCurrency, getErrorMessage } from '@/lib/utils';

export default function CartPage() {
  const { items, count, subtotal, total, loading, setQuantity, remove } = useCart();
  const { showToast } = useToast();

  async function changeQty(productId: string, quantity: number) {
    try { await setQuantity(productId, quantity); }
    catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  async function removeItem(productId: string) {
    try { await remove(productId); showToast('Item removed from cart.', 'success'); }
    catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-8"><PageLoader /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Shopping cart' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Almost there</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900">Shopping cart</h1>
        <p className="mt-2 text-sm text-ink-500">{count} {count === 1 ? 'item' : 'items'} in your cart</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Your cart is empty"
          description="Browse the collection and add something you love. Your cart is saved to your account."
          action={<Link to="/products"><Button>Start shopping</Button></Link>}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {items.map((item) => {
              const unit = discountPrice(item.product.price, item.product.discount_percent);
              return (
                <div key={item.id} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-3 sm:p-4">
                  <Link to={`/products/${item.product.slug}`} className="shrink-0">
                    <ProductImage path={item.product.images?.[0]?.path} alt={item.product.name} className="h-24 w-24 rounded-xl sm:h-28 sm:w-28" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/products/${item.product.slug}`} className="line-clamp-2 text-sm font-semibold text-ink-800 hover:text-forest-700">{item.product.name}</Link>
                        <p className="mt-1 text-xs text-ink-400">SKU {item.product.sku}</p>
                        <p className={item.product.stock_quantity <= 0 ? 'mt-1 text-xs text-red-600' : 'mt-1 text-xs text-forest-600'}>
                          {item.product.stock_quantity <= 0 ? 'Out of stock' : `${item.product.stock_quantity} available`}
                        </p>
                      </div>
                      <button type="button" onClick={() => removeItem(item.product_id)} aria-label={`Remove ${item.product.name}`} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                      <QuantitySelector value={item.quantity} onChange={(v) => changeQty(item.product_id, v)} min={1} max={Math.max(1, item.product.stock_quantity)} size="sm" />
                      <div className="text-right">
                        <p className="text-base font-bold text-ink-900">{formatCurrency(item.line_total)}</p>
                        {item.product.discount_percent > 0 && <p className="text-[11px] text-ink-400">{formatCurrency(unit)} each</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <Link to="/products" className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-forest-700 hover:underline">Continue shopping <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-soft lg:sticky lg:top-24">
            <h2 className="font-display text-2xl text-ink-900">Order summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-ink-600"><dt>Subtotal ({count} items)</dt><dd>{formatCurrency(subtotal)}</dd></div>
              <div className="flex justify-between text-ink-600"><dt>Shipping</dt><dd className="text-forest-700">Calculated at checkout</dd></div>
              <div className="border-t border-stone-200 pt-3">
                <div className="flex justify-between text-base font-bold text-ink-900"><dt>Total</dt><dd>{formatCurrency(total)}</dd></div>
              </div>
            </dl>
            <Link to="/checkout" className="mt-6 block"><Button fullWidth size="lg">Proceed to checkout</Button></Link>
            <div className="mt-5 space-y-2 border-t border-stone-200 pt-5 text-xs text-ink-500">
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-forest-600" /> Prices are recalculated securely on the server.</p>
              <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-forest-600" /> Cash on Delivery available.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
