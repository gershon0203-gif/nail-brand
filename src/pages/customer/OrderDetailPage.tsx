import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, MapPin, Receipt, Truck, X } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageLoader, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { ProductImage } from '@/components/product/ProductImage';
import { getOrder, ORDER_TRACKING_STEPS, trackingStep } from '@/services/orders.service';
import { formatCurrency, formatDate, getErrorMessage, cn, titleCase } from '@/lib/utils';
import type { OrderWithItems } from '@/types';

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getOrder(id)
      .then((data) => { if (active) setOrder(data); })
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-8"><PageLoader label="Loading order…" /></div>;
  if (error) return <div className="mx-auto max-w-5xl px-4 py-8"><ErrorState message={error} /></div>;
  if (!order) return <div className="mx-auto max-w-5xl px-4 py-8"><EmptyState title="Order not found" description="This order does not exist or does not belong to your account." action={<Link to="/orders" className="text-sm font-semibold text-forest-700 underline">Back to orders</Link>} /></div>;

  const step = trackingStep(order.status);
  const address = order.address_snapshot || {};
  const get = (key: string) => String(address[key] ?? '');

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'My orders', to: '/orders' }, { label: order.order_number }]} />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Order details</p>
          <h1 className="mt-2 font-display text-4xl text-ink-900">{order.order_number}</h1>
          <p className="mt-2 text-sm text-ink-500">Placed {formatDate(order.placed_at || order.created_at, true)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {step >= 0 && (
        <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-xl text-ink-900"><Truck className="h-5 w-5 text-clay-600" /> Order tracking</h2>
          <div className="mt-6 flex overflow-x-auto pb-2">
            {ORDER_TRACKING_STEPS.map((status, index) => {
              const done = index < step;
              const current = index === step;
              return (
                <div key={status} className="flex min-w-[96px] flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <span className={cn('h-0.5 flex-1', index === 0 ? 'bg-transparent' : done || current ? 'bg-forest-600' : 'bg-stone-200')} />
                    <span className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
                      done ? 'border-forest-600 bg-forest-600 text-white' : current ? 'border-forest-600 bg-white text-forest-600' : 'border-stone-300 bg-white text-stone-300',
                    )}>
                      {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    <span className={cn('h-0.5 flex-1', index === ORDER_TRACKING_STEPS.length - 1 ? 'bg-transparent' : done ? 'bg-forest-600' : 'bg-stone-200')} />
                  </div>
                  <span className={cn('mt-2 text-[10px] font-medium', done || current ? 'text-forest-700' : 'text-ink-400')}>{titleCase(status)}</span>
                </div>
              );
            })}
          </div>
          {order.status === 'cancelled' && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">This order was cancelled.</p>}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink-900"><Receipt className="h-5 w-5 text-clay-600" /> Items in this order</h2>
            <div className="mt-5 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                  <ProductImage path={item.product_image_path} alt={item.product_name} className="h-16 w-16 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-800">{item.product_name}</p>
                    <p className="mt-0.5 text-xs text-ink-400">SKU {item.product_sku} · Qty {item.quantity}</p>
                    <p className="mt-1 text-xs text-ink-500">{formatCurrency(item.unit_price)} each — <span className="font-semibold text-ink-800">{formatCurrency(item.line_total)}</span></p>
                  </div>
                  <Link to={item.product_id ? `/products/${item.product_id}` : '/products'} className="self-center text-xs font-semibold text-forest-700 hover:underline">View</Link>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink-900"><MapPin className="h-5 w-5 text-clay-600" /> Delivery details</h2>
            <div className="mt-4 text-sm leading-7 text-ink-600">
              <p className="font-semibold text-ink-800">{get('full_name')}</p>
              <p>{get('house_flat')}, {get('street')}, {get('area')}</p>
              <p>{get('city')}, {get('state')} {get('pin_code')}</p>
              {get('landmark') && <p>Near {get('landmark')}</p>}
              <p className="text-ink-500">{get('phone')}</p>
            </div>
            <p className="mt-4 text-xs text-ink-400">This is a snapshot of the address at the time the order was placed.</p>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
          <h2 className="font-display text-2xl text-ink-900">Payment summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-ink-600"><dt>Subtotal</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
            <div className="flex justify-between text-ink-600"><dt>Shipping</dt><dd>{formatCurrency(order.shipping_amount)}</dd></div>
            <div className="flex justify-between text-ink-600"><dt>Tax</dt><dd>{formatCurrency(order.tax_amount)}</dd></div>
            <div className="flex justify-between text-ink-600"><dt>Discount</dt><dd>-{formatCurrency(order.discount_amount)}</dd></div>
            <div className="border-t border-stone-200 pt-3"><div className="flex justify-between text-base font-bold text-ink-900"><dt>Total</dt><dd>{formatCurrency(order.total)}</dd></div></div>
          </dl>
          <div className="mt-5 rounded-lg bg-stone-100 p-3 text-xs text-ink-600">
            <p className="font-semibold text-ink-700">Payment method: {order.payment_method === 'cod' ? 'Cash on Delivery' : titleCase(order.payment_method)}</p>
            <p className="mt-1 text-ink-500">Status: {titleCase(order.payment_status)}</p>
          </div>
          {order.notes && <div className="mt-4 rounded-lg border border-dashed border-stone-300 p-3 text-xs text-ink-500"><strong>Delivery note:</strong> {order.notes}</div>}
          {order.status === 'delivered' && <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-forest-700"><Check className="h-4 w-4" /> Delivered — thank you for shopping with us.</p>}
          {order.status === 'cancelled' && <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-red-600"><X className="h-4 w-4" /> Cancelled</p>}
          <Link to="/orders" className="mt-6 block text-center text-xs font-semibold text-forest-700 hover:underline">Back to all orders</Link>
        </aside>
      </div>
      <p className="mt-6 text-center text-[11px] text-ink-400">Historical prices and product details are preserved with this order, even if products change later.</p>
    </div>
  );
}
