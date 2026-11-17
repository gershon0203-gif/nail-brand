import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Users, ClipboardList, Clock3, DollarSign, ArrowRight } from 'lucide-react';
import { PageLoader, ErrorState } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getAdminStats, type AdminStats } from '@/services/admin.service';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStats().then(setStats).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!stats) return <PageLoader />;

  const cards = [
    { label: 'Total products', value: String(stats.products), icon: Boxes, tone: 'bg-forest-50 text-forest-700', to: '/admin/products' },
    { label: 'Total customers', value: String(stats.customers), icon: Users, tone: 'bg-clay-50 text-clay-700', to: '/admin/customers' },
    { label: 'Total orders', value: String(stats.orders), icon: ClipboardList, tone: 'bg-stone-100 text-ink-700', to: '/admin/orders' },
    { label: 'Pending orders', value: String(stats.pendingOrders), icon: Clock3, tone: 'bg-amber-50 text-amber-700', to: '/admin/orders?status=pending' },
    { label: 'Total sales (valid orders)', value: formatCurrency(stats.totalSales), icon: DollarSign, tone: 'bg-forest-50 text-forest-700', to: '/admin/orders' },
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Overview</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900">Dashboard</h1>
        <p className="mt-2 text-sm text-ink-500">A quick view of how your store is doing.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, tone, to }) => (
          <Link key={label} to={to} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></span>
            <p className="mt-4 text-2xl font-bold text-ink-900">{value}</p>
            <p className="mt-1 text-xs text-ink-500">{label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink-900">Recent orders</h2>
            <p className="mt-1 text-xs text-ink-500">The latest orders placed in your store.</p>
          </div>
          <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:underline">All orders <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="rounded-xl bg-cream-100 p-8 text-center text-sm text-ink-500">No orders yet. New orders will appear here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b border-stone-200 text-[11px] uppercase tracking-wide text-ink-400">
                <th className="pb-3 font-semibold">Order</th><th className="pb-3 font-semibold">Customer</th><th className="pb-3 font-semibold">Date</th><th className="pb-3 font-semibold">Total</th><th className="pb-3 font-semibold">Status</th><th className="pb-3" />
              </tr></thead>
              <tbody className="divide-y divide-stone-100">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream-50">
                    <td className="py-3 font-medium text-ink-800">{order.order_number}</td>
                    <td className="py-3 text-ink-600">{order.customer_snapshot?.full_name as string || order.profile?.full_name || 'Guest'}</td>
                    <td className="py-3 text-ink-500">{formatDate(order.created_at)}</td>
                    <td className="py-3 font-medium text-ink-800">{formatCurrency(order.total)}</td>
                    <td className="py-3"><StatusBadge status={order.status} /></td>
                    <td className="py-3 text-right"><Link to={`/admin/orders/${order.id}`} className="text-xs font-semibold text-forest-700 hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
