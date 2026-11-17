import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildPageNumbers, cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = buildPageNumbers(page, totalPages);
  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <button
        type="button" aria-label="Previous page" disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-ink-600 transition hover:border-forest-500 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-ink-400">…</span>}
          <button
            type="button" onClick={() => onPageChange(p)} aria-current={p === page ? 'page' : undefined}
            className={cn(
              'h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition',
              p === page ? 'bg-forest-700 text-white' : 'border border-stone-200 bg-white text-ink-700 hover:border-forest-500',
            )}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        type="button" aria-label="Next page" disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-ink-600 transition hover:border-forest-500 disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
