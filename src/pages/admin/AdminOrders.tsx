import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Field';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageLoader, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { listAllOrders } from '@/services/orders.service';
import { useDebounce } from '@/hooks/useDebounce';
import { ORDER_STATUSES } from '@/lib/constants';
import { formatCurrency, formatDate, getErrorMessage, titleCase } from '@/lib/utils';
import type { OrderStatus, OrderWithItems } from '@/types';

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') || '') as OrderStatus | '';
  const [search, setSearch] = useState(params.get('q') || '');
  const debounced = useDebounce(search, 400);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void load(); }, [status, debounced]);

  async function load() {
    setLoading(true);
    try {
      setOrders(await listAllOrders(status || undefined, debounced));
      setError(null);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  function setStatus(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('status', value); else next.delete('status');
    setParams(next, { replace: true });
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Fulfilment</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900">Orders</h1>
        <p className="mt-2 text-sm text-ink-500">View, search and update the status of customer orders.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order number or customer…" className="pl-10" aria-label="Search orders" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto min-w-44" aria-label="Filter by status">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </Select>
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : loading ? <PageLoader /> : orders.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="No orders found" description="Try a different search term or status filter." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="border-b border-stone-200 bg-cream-50 text-[11px] uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-semibold">Order</th><th className="px-4 py-3 font-semibold">Customer</th><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Items</th><th className="px-4 py-3 font-semibold">Total</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3" />
              </tr></thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3 font-medium text-ink-800">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-ink-700">{String(order.customer_snapshot?.full_name || order.profile?.full_name || '—')}</p>
                      <p className="text-[11px] text-ink-400">{String(order.customer_snapshot?.email || order.profile?.email || '')}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3"><Badge tone="neutral">{order.items.length}</Badge></td>
                    <td className="px-4 py-3 font-medium text-ink-800">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-right"><Link to={`/admin/orders/${order.id}`} className="text-xs font-semibold text-forest-700 hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
