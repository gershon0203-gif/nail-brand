import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Plus, Wallet, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Field';
import { ProductImage } from '@/components/product/ProductImage';
import { PageLoader, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { listAddresses } from '@/services/addresses.service';
import { placeOrder } from '@/services/orders.service';
import { discountPrice, formatCurrency, getErrorMessage, cn } from '@/lib/utils';
import type { Address } from '@/types';

export default function CheckoutPage() {
  const { items, subtotal, count, refresh, clear } = useCart();
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    listAddresses(user.id)
      .then((list) => {
        setAddresses(list);
        setSelectedAddress(list.find((a) => a.is_default)?.id || list[0]?.id || null);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoadingAddresses(false));
  }, [user?.id]);

  async function submit() {
    if (!selectedAddress) {
      showToast('Please select a delivery address.', 'error');
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const order = await placeOrder({ addressId: selectedAddress, paymentMethod: 'cod', notes: notes.trim() || undefined });
      await clear();
      await refresh();
      showToast(`Order ${order.orderNumber} placed successfully.`, 'success');
      navigate(`/orders/${order.orderId}`, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
      await refresh();
    } finally {
      setPlacing(false);
    }
  }

  if (!count) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="Nothing to check out"
          description="Your cart is empty. Add a few items before placing an order."
          action={<Link to="/products"><Button>Browse products</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Secure checkout</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900">Review & place your order</h1>
        <p className="mt-2 text-sm text-ink-500">Choose a delivery address, review your items and confirm. No payment details are collected.</p>
      </div>

      {isDemo && (
        <div className="mb-6 rounded-xl border border-clay-200 bg-clay-50 p-4 text-xs leading-5 text-ink-600">
          <strong className="font-semibold">Demo mode:</strong> order placement requires Supabase. The steps below are shown for review only — nothing will be saved.
        </div>
      )}
      {error && <div className="mb-6"><ErrorState message={error} /></div>}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-xl text-ink-900"><MapPin className="h-5 w-5 text-clay-600" /> 1. Delivery address</h2>
              <Link to="/addresses" className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:underline"><Plus className="h-3.5 w-3.5" /> Manage addresses</Link>
            </div>
            {loadingAddresses ? <div className="mt-5"><PageLoader label="Loading addresses…" /></div> : addresses.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-stone-300 p-6 text-center">
                <p className="text-sm text-ink-600">You don't have a saved address yet.</p>
                <Link to="/addresses" className="mt-3 inline-block"><Button size="sm" variant="outline">Add a delivery address</Button></Link>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => (
                  <button
                    key={address.id} type="button" onClick={() => setSelectedAddress(address.id)}
                    className={cn('rounded-xl border p-4 text-left transition', selectedAddress === address.id ? 'border-forest-600 bg-forest-50/60' : 'border-stone-200 hover:border-stone-300')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink-800">{address.label || 'Address'}</span>
                      {address.is_default && <Badge tone="brand">Default</Badge>}
                      {selectedAddress === address.id && <CheckCircle2 className="h-4 w-4 text-forest-600" />}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-ink-500">
                      {address.full_name}<br />{address.house_flat}, {address.street}, {address.area}<br />{address.city}, {address.state} {address.pin_code}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">{address.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl text-ink-900">2. Review your items</h2>
            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                  <ProductImage path={item.product.images?.[0]?.path} alt={item.product.name} className="h-14 w-14 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-ink-800">{item.product.name}</p>
                    <p className="text-xs text-ink-400">Qty {item.quantity} × {formatCurrency(discountPrice(item.product.price, item.product.discount_percent))}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink-800">{formatCurrency(item.line_total)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink-900"><Wallet className="h-5 w-5 text-clay-600" /> 3. Payment method</h2>
            <div className="mt-5 rounded-xl border-2 border-forest-600 bg-forest-50/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink-800"><CheckCircle2 className="h-4 w-4 text-forest-600" /> Cash on Delivery (COD)</p>
                  <p className="mt-1 text-xs leading-5 text-ink-500">Pay in cash when your order arrives. No card details needed.</p>
                </div>
                <Badge tone="success">Available</Badge>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-stone-100 p-3 text-[11px] leading-5 text-ink-500">
              <strong className="text-ink-700">Development mode:</strong> COD is the only method in this phase. Online payments (Razorpay) and shipping (Shiprocket) are deliberately not integrated. No payment transaction or card data is created.
            </div>
            <div className="mt-5">
              <label htmlFor="order-notes" className="block text-sm font-medium text-ink-700">Delivery notes <span className="font-normal text-ink-400">(optional)</span></label>
              <Textarea id="order-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Leave with the neighbour, ring the bell twice…" className="mt-2" />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="font-display text-2xl text-ink-900">Order total</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-ink-600"><dt>Items ({count})</dt><dd>{formatCurrency(subtotal)}</dd></div>
            <div className="flex justify-between text-ink-600"><dt>Shipping</dt><dd>{formatCurrency(0)}</dd></div>
            <div className="flex justify-between text-ink-600"><dt>Discount</dt><dd>{formatCurrency(0)}</dd></div>
            <div className="border-t border-stone-200 pt-3"><div className="flex justify-between text-base font-bold text-ink-900"><dt>Total</dt><dd>{formatCurrency(subtotal)}</dd></div></div>
          </dl>
          <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-ink-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" /> Final prices, stock and totals are validated and recalculated by the server before your order is created.</p>
          <Button type="button" fullWidth size="lg" className="mt-5" loading={placing} onClick={submit} disabled={!selectedAddress || isDemo}>
            Place order — {formatCurrency(subtotal)}
          </Button>
          {!selectedAddress && <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-amber-700"><AlertCircle className="h-3.5 w-3.5" /> Select a delivery address first.</p>}
          <Link to="/cart" className="mt-4 block text-center text-xs font-semibold text-ink-500 hover:text-forest-700">Back to cart</Link>
        </aside>
      </div>
    </div>
  );
}
