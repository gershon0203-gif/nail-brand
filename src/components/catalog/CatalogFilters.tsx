import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  categories: Category[];
  selectedCategory?: string;
  onCategory: (slug: string | undefined) => void;
  minPrice: string;
  maxPrice: string;
  onMinPrice: (value: string) => void;
  onMaxPrice: (value: string) => void;
  featuredOnly: boolean;
  onFeatured: (value: boolean) => void;
  onClear: () => void;
  hideCategories?: boolean;
}

const priceRanges = [
  { label: 'Under $25', min: '', max: '25' },
  { label: '$25 – $50', min: '25', max: '50' },
  { label: '$50 – $100', min: '50', max: '100' },
  { label: '$100 & above', min: '100', max: '' },
];

export function CatalogFilters({
  categories, selectedCategory, onCategory, minPrice, maxPrice, onMinPrice, onMaxPrice,
  featuredOnly, onFeatured, onClear, hideCategories,
}: Props) {
  return (
    <aside className="space-y-7" aria-label="Filter products">
      {!hideCategories && (
        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-ink-800">Categories</h3>
          <div className="space-y-1">
            <button
              type="button" onClick={() => onCategory(undefined)}
              className={cn('block w-full rounded-lg px-2.5 py-2 text-left text-sm transition', !selectedCategory ? 'bg-forest-50 font-semibold text-forest-700' : 'text-ink-600 hover:bg-stone-100')}
            >
              All categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id} type="button" onClick={() => onCategory(category.slug)}
                className={cn('block w-full rounded-lg px-2.5 py-2 text-left text-sm transition', selectedCategory === category.slug ? 'bg-forest-50 font-semibold text-forest-700' : 'text-ink-600 hover:bg-stone-100')}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-ink-800">Price range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" value={minPrice} onChange={(e) => onMinPrice(e.target.value)}
            placeholder="Min" aria-label="Minimum price"
            className="h-9 w-full rounded-lg border border-stone-300 px-2.5 text-sm outline-none focus:border-forest-500"
          />
          <span className="text-ink-400">–</span>
          <input
            type="number" min="0" value={maxPrice} onChange={(e) => onMaxPrice(e.target.value)}
            placeholder="Max" aria-label="Maximum price"
            className="h-9 w-full rounded-lg border border-stone-300 px-2.5 text-sm outline-none focus:border-forest-500"
          />
        </div>
        <div className="mt-3 space-y-1.5">
          {priceRanges.map((range) => (
            <button
              key={range.label} type="button"
              onClick={() => { onMinPrice(range.min); onMaxPrice(range.max); }}
              className="block text-left text-xs text-ink-500 hover:text-forest-700"
            >
              {range.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-ink-800">Highlights</h3>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-600">
          <input type="checkbox" checked={featuredOnly} onChange={(e) => onFeatured(e.target.checked)} className="h-4 w-4 accent-forest-700" />
          Featured products only
        </label>
      </section>

      <button type="button" onClick={onClear} className="inline-flex items-center gap-2 text-xs font-semibold text-clay-600 hover:text-clay-700">
        <RotateCcw className="h-3.5 w-3.5" /> Clear all filters
      </button>

      <div className="rounded-xl bg-forest-50 p-4">
        <p className="font-display text-lg text-forest-800">Need help choosing?</p>
        <p className="mt-1 text-xs leading-5 text-forest-700/80">Our local team is happy to recommend the right piece.</p>
        <Link to="/contact" className="mt-3 inline-block text-xs font-semibold text-forest-700 underline underline-offset-2">Get in touch</Link>
      </div>
    </aside>
  );
}
