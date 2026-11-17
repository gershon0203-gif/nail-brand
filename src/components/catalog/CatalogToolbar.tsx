import { SlidersHorizontal } from 'lucide-react';
import { Select } from '@/components/ui/Field';
import { sortLabel } from '@/lib/utils';
import type { SortOption } from '@/types';

interface Props {
  total: number;
  sort: SortOption;
  onSort: (sort: SortOption) => void;
  onOpenFilters: () => void;
  heading?: string;
}

const options: SortOption[] = ['newest', 'popular', 'price_asc', 'price_desc', 'name_asc'];

export function CatalogToolbar({ total, sort, onSort, onOpenFilters, heading }: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <span className="font-semibold text-ink-800">{heading || 'Products'}</span>
        <span className="text-ink-300">·</span>
        <span>{total} {total === 1 ? 'item' : 'items'}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button" onClick={onOpenFilters}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-300 px-3 text-xs font-semibold text-ink-700 lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-ink-400 sm:inline">Sort by</span>
          <Select value={sort} onChange={(e) => onSort(e.target.value as SortOption)} className="h-10 w-auto min-w-44 py-0 text-xs">
            {options.map((option) => <option key={option} value={option}>{sortLabel(option)}</option>)}
          </Select>
        </div>
      </div>
    </div>
  );
}
