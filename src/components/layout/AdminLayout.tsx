import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, ClipboardList, LayoutDashboard, LogOut, Tags, Users, Leaf, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { STORE } from '@/lib/constants';
import { cn } from '@/lib/utils';

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Boxes, end: false },
  { to: '/admin/categories', label: 'Categories', icon: Tags, end: false },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList, end: false },
  { to: '/admin/customers', label: 'Customers', icon: Users, end: false },
];

export function AdminLayout() {
  const { profile, signOut, isDemo } = useAuth();
  const navigate = useNavigate();

  async function logout() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-cream-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-stone-200 bg-white px-4 py-6 lg:flex">
        <div className="flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-700 text-white"><Leaf className="h-5 w-5" /></span>
          <div>
            <p className="font-display text-lg leading-none text-ink-900">{STORE.name}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-clay-600">Admin console</p>
          </div>
        </div>
        <nav className="mt-9 space-y-1" aria-label="Admin navigation">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-forest-700 text-white' : 'text-ink-600 hover:bg-cream-100 hover:text-forest-700',
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <NavLink to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-500 hover:bg-cream-100">
            <ArrowLeft className="h-4 w-4" /> Back to store
          </NavLink>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
          {isDemo && <p className="px-3 pt-2 text-[10px] leading-4 text-ink-400">Demo admin session — changes are not persisted.</p>}
        </div>
      </aside>

      <div className="flex w-full flex-col lg:pl-64">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <Leaf className="h-5 w-5 text-forest-700" />
            <span className="font-display text-lg text-ink-900">Admin</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs text-ink-400">Store management</p>
            <p className="text-sm font-semibold text-ink-800">{profile?.full_name || 'Administrator'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold capitalize text-forest-700">
              {profile?.role?.replace('_', ' ') || 'admin'}
            </span>
            <button type="button" onClick={logout} className="rounded-lg p-2 text-ink-500 hover:bg-stone-100 lg:hidden" aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-b border-stone-200 bg-white px-4 py-2 lg:hidden">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => cn('whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium', isActive ? 'bg-forest-700 text-white' : 'text-ink-600')}>
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
