import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageLoader, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { listMyOrders } from '@/services/orders.service';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';
import type { OrderWithItems } from '@/types';

export default function OrdersPage() {
  const { isDemo } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    listMyOrders()
      .then(setOrders)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [isDemo]);

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-8"><PageLoader /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'My orders' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Your account</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900">My orders</h1>
        <p className="mt-2 text-sm text-ink-500">Track and review all of your past orders in one place.</p>
      </div>
      {error && <ErrorState message={error} />}
      {!error && orders.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title={isDemo ? 'Orders require a backend' : 'No orders yet'}
          description={isDemo ? 'Order history is available once Supabase is configured.' : 'When you place an order, you will be able to follow its progress here.'}
          action={<Link to="/products"><ButtonLink>Start shopping</ButtonLink></Link>}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="block rounded-2xl border border-stone-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-ink-400">Order</p>
                  <p className="mt-0.5 font-display text-xl text-ink-900">{order.order_number}</p>
                  <p className="mt-1 text-xs text-ink-400">Placed {formatDate(order.placed_at || order.created_at, true)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item) => (
                      <span key={item.id} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-stone-100 text-[10px] font-bold text-ink-500" title={item.product_name}>
                        {item.quantity}×
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-ink-500">{order.items.length} {order.items.length === 1 ? 'item' : 'items'} · {formatCurrency(order.total)}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700">View details <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ButtonLink({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex h-11 items-center rounded-lg bg-forest-700 px-5 text-sm font-semibold text-white">{children}</span>;
}
