import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Leaf, Menu, Search, ShoppingBag, UserRound, X, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { STORE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const nav = [
  { label: 'Home', to: '/' },
  { label: 'Shop all', to: '/products' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export function Header() {
  const { isAuthenticated, profile, isAdmin, signOut, isDemo } = useAuth();
  const { count } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');

  useEffect(() => { setMobileOpen(false); setAccountOpen(false); setSearchOpen(false); }, [navigate]);

  async function handleLogout() {
    await signOut();
    setAccountOpen(false);
    showToast('You have been signed out.', 'success');
    navigate('/');
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = term.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/products');
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <button
          type="button" aria-label="Toggle menu" onClick={() => setMobileOpen((v) => !v)}
          className="shrink-0 rounded-lg p-2 text-ink-700 hover:bg-stone-100 lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link to="/" className="flex min-w-0 items-center gap-2" aria-label={`${STORE.name} home`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-700 text-white">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="truncate font-display text-lg leading-none text-ink-900 sm:text-2xl">{STORE.name}</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <NavLink
              key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => cn(
                'text-sm font-medium transition hover:text-forest-700',
                isActive ? 'text-forest-700' : 'text-ink-700',
              )}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="relative group">
            <button type="button" className="flex items-center gap-1 text-sm font-medium text-ink-700 transition hover:text-forest-700">
              Categories <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="invisible absolute left-0 top-full z-50 w-56 translate-y-1 rounded-xl border border-stone-200 bg-white py-2 opacity-0 shadow-lift transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <Link to="/categories" className="block px-4 py-2 text-sm text-ink-700 hover:bg-cream-100">All categories</Link>
              {['kitchen-dining', 'home-decor', 'personal-care', 'apparel', 'stationery', 'wellness'].map((slug) => (
                <Link key={slug} to={`/categories/${slug}`} className="block px-4 py-2 text-sm capitalize text-ink-700 hover:bg-cream-100">
                  {slug.replace(/-/g, ' ')}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
          <button
            type="button" aria-label="Search" onClick={() => setSearchOpen((v) => !v)}
            className="rounded-lg p-2 text-ink-700 transition hover:bg-stone-100 sm:p-2.5"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              type="button" aria-label="Account menu" onClick={() => setAccountOpen((v) => !v)}
              className="flex items-center rounded-lg p-2 text-ink-700 transition hover:bg-stone-100 sm:p-2.5"
            >
              <UserRound className="h-5 w-5" />
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-stone-200 bg-white py-2 shadow-lift">
                {isAuthenticated ? (
                  <>
                    <div className="border-b border-stone-100 px-4 py-2.5">
                      <p className="truncate text-sm font-semibold text-ink-800">{profile?.full_name || 'My account'}</p>
                      <p className="truncate text-xs text-ink-400">{profile?.email || (isDemo ? 'Demo preview' : '')}</p>
                    </div>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-ink-700 hover:bg-cream-100">My profile</Link>
                    <Link to="/orders" className="block px-4 py-2 text-sm text-ink-700 hover:bg-cream-100">My orders</Link>
                    <Link to="/addresses" className="block px-4 py-2 text-sm text-ink-700 hover:bg-cream-100">Addresses</Link>
                    {isAdmin && <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-forest-700 hover:bg-cream-100"><LayoutDashboard className="h-4 w-4" /> Admin dashboard</Link>}
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 border-t border-stone-100 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-4 py-2 text-sm text-ink-700 hover:bg-cream-100">Sign in</Link>
                    <Link to="/register" className="block px-4 py-2 text-sm text-ink-700 hover:bg-cream-100">Create account</Link>
                  </>
                )}
              </div>
            )}
          </div>

          <Link to="/cart" aria-label={`Shopping cart, ${count} items`} className="relative rounded-lg p-2 text-ink-700 transition hover:bg-stone-100 sm:p-2.5">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-600 px-1 text-[10px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={submitSearch} role="search" className="border-t border-stone-200 bg-white px-4 py-3 lg:hidden">
          <input
            autoFocus value={term} onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products…" aria-label="Search products"
            className="h-11 w-full rounded-lg border border-stone-300 px-4 text-sm outline-none focus:border-forest-500"
          />
        </form>
      )}

      {mobileOpen && (
        <nav className="border-t border-stone-200 bg-white px-4 py-3 lg:hidden" aria-label="Mobile navigation">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => cn('block rounded-lg px-3 py-2.5 text-sm font-medium', isActive ? 'bg-forest-50 text-forest-700' : 'text-ink-700')}>
              {item.label}
            </NavLink>
          ))}
          <Link to="/categories" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700">All categories</Link>
          {isAdmin && <Link to="/admin" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-forest-700">Admin dashboard</Link>}
        </nav>
      )}
    </header>
  );
}
