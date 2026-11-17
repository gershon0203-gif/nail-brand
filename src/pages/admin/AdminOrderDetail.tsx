import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, UserRound, Receipt, RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { PageLoader, ErrorState } from '@/components/ui/Feedback';
import { ProductImage } from '@/components/product/ProductImage';
import { getOrder, updateOrderStatus } from '@/services/orders.service';
import { ORDER_STATUSES } from '@/lib/constants';
import { formatCurrency, formatDate, getErrorMessage, titleCase } from '@/lib/utils';
import type { OrderStatus, OrderWithItems } from '@/types';

export default function AdminOrderDetail() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getOrder(id);
      setOrder(data);
      if (data) setStatus(data.status);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [id]);

  async function saveStatus() {
    if (!order || status === order.status) return;
    setSaving(true);
    try {
      await updateOrderStatus(order.id, status);
      await load();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return <ErrorState message="Order not found." />;

  const address = order.address_snapshot || {};
  const get = (key: string) => String(address[key] ?? '');

  return (
    <div>
      <Link to="/admin/orders" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-forest-700"><ArrowLeft className="h-4 w-4" /> Back to orders</Link>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Order details</p>
          <h1 className="mt-2 font-display text-4xl text-ink-900">{order.order_number}</h1>
          <p className="mt-2 text-sm text-ink-500">Placed {formatDate(order.created_at, true)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink-900"><Receipt className="h-5 w-5 text-clay-600" /> Items</h2>
            <div className="mt-5 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                  <ProductImage path={item.product_image_path} alt={item.product_name} className="h-14 w-14 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-800">{item.product_name}</p>
                    <p className="text-xs text-ink-400">SKU {item.product_sku} · Qty {item.quantity} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink-800">{formatCurrency(item.line_total)}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
              <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between text-ink-600"><span>Shipping</span><span>{formatCurrency(order.shipping_amount)}</span></div>
              <div className="flex justify-between text-ink-600"><span>Tax</span><span>{formatCurrency(order.tax_amount)}</span></div>
              <div className="flex justify-between text-lg font-bold text-ink-900"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-display text-lg text-ink-900"><MapPin className="h-4 w-4 text-clay-600" /> Delivery address</h2>
              <div className="mt-3 text-sm leading-6 text-ink-600">
                <p className="font-medium text-ink-800">{get('full_name')}</p>
                <p>{get('house_flat')}, {get('street')}</p>
                <p>{get('area')}, {get('city')}</p>
                <p>{get('state')} {get('pin_code')}</p>
                <p className="text-ink-500">{get('phone')}</p>
              </div>
            </section>
            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-display text-lg text-ink-900"><UserRound className="h-4 w-4 text-clay-600" /> Customer</h2>
              <div className="mt-3 text-sm leading-6 text-ink-600">
                <p className="font-medium text-ink-800">{String(order.customer_snapshot?.full_name || order.profile?.full_name || '—')}</p>
                <p>{String(order.customer_snapshot?.email || order.profile?.email || '')}</p>
                <p className="text-ink-500">{String(order.customer_snapshot?.phone || order.profile?.phone || '')}</p>
              </div>
              {order.notes && <p className="mt-4 rounded-lg bg-cream-100 p-3 text-xs text-ink-600"><strong>Note:</strong> {order.notes}</p>}
            </section>
          </div>
        </div>

        <aside className="h-fit space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-display text-xl text-ink-900">Update status</h2>
            <p className="mt-1 text-xs text-ink-500">Changes are visible to the customer immediately.</p>
            <div className="mt-4 space-y-3">
              <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
              </Select>
              <Button fullWidth onClick={saveStatus} loading={saving} disabled={status === order.status}>
                <RefreshCw className="h-4 w-4" /> Save status
              </Button>
            </div>
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-display text-xl text-ink-900">Payment</h2>
            <dl className="mt-4 space-y-2 text-sm text-ink-600">
              <div className="flex justify-between"><dt>Method</dt><dd className="font-medium capitalize text-ink-800">{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}</dd></div>
              <div className="flex justify-between"><dt>Status</dt><dd className="font-medium capitalize text-ink-800">{titleCase(order.payment_status)}</dd></div>
              <div className="flex justify-between"><dt>Currency</dt><dd>{order.currency}</dd></div>
            </dl>
            <p className="mt-4 text-[11px] leading-5 text-ink-400">Online payment, verification, webhooks and refunds are reserved for a future integration phase. No payment transactions are created in this phase.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
