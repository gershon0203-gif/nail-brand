import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { STORE } from '@/lib/constants';
import type { ReactNode } from 'react';

export function AuthLayout({
  title, subtitle, children, footer,
}: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-cream-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-700 text-white"><Leaf className="h-5 w-5" /></span>
            <span className="font-display text-2xl text-ink-900">{STORE.name}</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl text-ink-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-ink-500">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft sm:p-8">
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}
      </div>
    </div>
  );
}
