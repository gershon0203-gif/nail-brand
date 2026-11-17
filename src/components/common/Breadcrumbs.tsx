import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface Crumb { label: string; to?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 py-4 text-xs text-ink-400">
      <Link to="/" className="inline-flex items-center gap-1 hover:text-forest-700">
        <Home className="h-3.5 w-3.5" /> Home
      </Link>
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3" />
          {item.to ? <Link to={item.to} className="hover:text-forest-700">{item.label}</Link> : <span className="font-medium text-ink-700">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
