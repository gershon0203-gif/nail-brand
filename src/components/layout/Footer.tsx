import { Link } from 'react-router-dom';
import { Leaf, Mail, MapPin, Phone } from 'lucide-react';
import { STORE } from '@/lib/constants';

const groups = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: '/products' },
      { label: 'Categories', to: '/categories' },
      { label: 'Kitchen & Dining', to: '/categories/kitchen-dining' },
      { label: 'Home Decor', to: '/categories/home-decor' },
    ],
  },
  {
    title: 'Customer care',
    links: [
      { label: 'Contact us', to: '/contact' },
      { label: 'My orders', to: '/orders' },
      { label: 'Addresses', to: '/addresses' },
      { label: 'My profile', to: '/profile' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Our story', to: '/about' },
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Terms & conditions', to: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-700 text-white"><Leaf className="h-5 w-5" /></span>
              <span className="font-display text-2xl text-ink-900">{STORE.name}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-ink-500">{STORE.tagline} Curated essentials, honest materials and service with a personal touch.</p>
            <div className="mt-6 space-y-2.5 text-sm text-ink-500">
              <p className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay-600" />{STORE.address}</p>
              <p className="flex items-center gap-2.5"><Phone className="h-4 w-4 shrink-0 text-clay-600" />{STORE.phone}</p>
              <p className="flex items-center gap-2.5"><Mail className="h-4 w-4 shrink-0 text-clay-600" />{STORE.email}</p>
            </div>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-ink-800">{group.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-ink-500 transition hover:text-forest-700">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-stone-200 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {STORE.name}. All rights reserved.</p>
          <p>Cash on Delivery available · Secure checkout · Local support</p>
        </div>
      </div>
    </footer>
  );
}
