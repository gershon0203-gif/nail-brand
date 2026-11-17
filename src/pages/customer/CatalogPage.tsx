import { useEffect, useState } from 'react';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { CatalogToolbar } from '@/components/catalog/CatalogToolbar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { listCategories } from '@/services/categories.service';
import { listProducts } from '@/services/products.service';
import { useDebounce } from '@/hooks/useDebounce';
import { PAGE_SIZE } from '@/lib/constants';
import type { Category, ProductQuery, SortOption } from '@/types';

interface Props {
  mode: 'all' | 'category' | 'search';
  categorySlug?: string;
  categoryName?: string;
  search?: string;
}

export function CatalogPage({ mode, categorySlug, categoryName, search }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(categorySlug);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof listProducts>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const debouncedMin = useDebounce(minPrice, 400);
  const debouncedMax = useDebounce(maxPrice, 400);

  useEffect(() => { setSelectedCategory(categorySlug); }, [categorySlug]);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => { setPage(1); }, [sort, selectedCategory, debouncedMin, debouncedMax, featuredOnly, search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const query: ProductQuery = {
      page,
      pageSize: PAGE_SIZE,
      sort,
      categorySlug: selectedCategory,
      search: search || undefined,
      featuredOnly,
      minPrice: debouncedMin !== '' ? Number(debouncedMin) : undefined,
      maxPrice: debouncedMax !== '' ? Number(debouncedMax) : undefined,
    };
    listProducts(query)
      .then((data) => { if (active) setResult(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Could not load products.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, sort, selectedCategory, debouncedMin, debouncedMax, featuredOnly, search, retryNonce]);

  function clearFilters() {
    setMinPrice(''); setMaxPrice(''); setFeaturedOnly(false);
    setSelectedCategory(mode === 'category' ? categorySlug : undefined);
  }

  const heading = mode === 'search'
    ? `Search results${search ? ` for “${search}”` : ''}`
    : categoryName || 'All products';

  const filterProps = {
    categories,
    selectedCategory,
    onCategory: setSelectedCategory,
    minPrice, maxPrice, onMinPrice: setMinPrice, onMaxPrice: setMaxPrice,
    featuredOnly, onFeatured: setFeaturedOnly,
    onClear: clearFilters,
    hideCategories: mode === 'category',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          ...(mode !== 'all' ? [{ label: 'Products', to: '/products' }] : []),
          ...(mode === 'category' && categoryName ? [{ label: categoryName }] : []),
          ...(mode === 'search' ? [{ label: 'Search' }] : []),
        ]}
      />
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">The collection</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900 sm:text-5xl">{heading}</h1>
        {mode === 'all' && <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">Browse our full range of thoughtfully chosen everyday goods. Filter by category, price or highlights to find exactly what you need.</p>}
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <div className="hidden lg:block"><CatalogFilters {...filterProps} /></div>
        <div>
          <CatalogToolbar
            total={result?.total || 0}
            sort={sort}
            onSort={setSort}
            onOpenFilters={() => setFiltersOpen(true)}
            heading={mode === 'all' ? 'All products' : undefined}
          />
          <ProductGrid
            products={result?.items || []}
            loading={loading}
            error={error}
            onRetry={() => setRetryNonce((n) => n + 1)}
            emptyTitle={mode === 'search' ? 'No matching products' : 'Nothing here yet'}
            emptyDescription={mode === 'search' ? 'Try a different search term or remove some filters.' : 'Try adjusting your filters or browse another category.'}
          />
          {result && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onPageChange={(next) => { setPage(next); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
              className="mt-10"
            />
          )}
        </div>
      </div>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" description="Refine your results">
        <CatalogFilters {...filterProps} />
        <button type="button" onClick={() => setFiltersOpen(false)} className="mt-6 w-full rounded-lg bg-forest-700 py-3 text-sm font-semibold text-white">
          Show results
        </button>
      </Modal>
    </div>
  );
}
