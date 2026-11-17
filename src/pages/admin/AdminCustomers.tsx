import { useEffect, useState } from 'react';
import { Search, Users, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageLoader, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { listCustomers, getCustomerOrders } from '@/services/admin.service';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';
import type { OrderWithItems, Profile } from '@/types';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    listCustomers().then(setCustomers).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false));
  }, []);

  async function viewOrders(customer: Profile) {
    setSelected(customer);
    setOrdersLoading(true);
    try { setOrders(await getCustomerOrders(customer.id)); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setOrdersLoading(false); }
  }

  const filtered = customers.filter((c) =>
    [c.full_name, c.email, c.phone || ''].join(' ').toLowerCase().includes(debounced.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">People</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900">Customers</h1>
        <p className="mt-2 text-sm text-ink-500">View registered customers and their order history. Passwords and auth secrets are never shown.</p>
      </div>
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…" className="pl-10" aria-label="Search customers" />
        </div>
      </div>
      {error && <div className="mb-5"><ErrorState message={error} /></div>}
      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No customers found" description="Registered customers will appear here." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead><tr className="border-b border-stone-200 bg-cream-50 text-[11px] uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-semibold">Customer</th><th className="px-4 py-3 font-semibold">Phone</th><th className="px-4 py-3 font-semibold">Joined</th><th className="px-4 py-3 font-semibold">Role</th><th className="px-4 py-3" />
              </tr></thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-800">{customer.full_name}</p>
                      <p className="text-xs text-ink-400">{customer.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{customer.phone || '—'}</td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(customer.created_at)}</td>
                    <td className="px-4 py-3"><Badge tone="neutral" className="capitalize">{customer.role}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => viewOrders(customer)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:underline">
                        <ShoppingBag className="h-3.5 w-3.5" /> Order history
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Customer order history" description={selected ? `${selected.full_name} · ${selected.email}` : ''} size="lg">
        {ordersLoading ? <PageLoader /> : orders.length === 0 ? (
          <EmptyState title="No orders yet" description="This customer has not placed any orders." />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 p-4">
                <div>
                  <p className="font-semibold text-ink-800">{order.order_number}</p>
                  <p className="text-xs text-ink-400">{formatDate(order.created_at, true)} · {order.items.length} items</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink-800">{formatCurrency(order.total)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
