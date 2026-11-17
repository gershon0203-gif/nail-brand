import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchBar({ className, initialValue = '', autoFocus }: { className?: string; initialValue?: string; autoFocus?: boolean }) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();

  function submit(event: FormEvent) {
    event.preventDefault();
    const term = value.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/products');
  }

  return (
    <form onSubmit={submit} className={cn('relative w-full', className)} role="search">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products, brands and more…"
        aria-label="Search products"
        autoFocus={autoFocus}
        className="h-12 w-full rounded-xl border border-stone-200 bg-white pl-11 pr-24 text-sm text-ink-800 shadow-soft outline-none transition placeholder:text-ink-400 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1.5 h-9 rounded-lg bg-forest-700 px-4 text-sm font-semibold text-white transition hover:bg-forest-800"
      >
        Search
      </button>
    </form>
  );
}
