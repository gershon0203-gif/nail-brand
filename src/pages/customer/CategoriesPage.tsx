import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import { ProductImage } from '@/components/product/ProductImage';
import { listCategories } from '@/services/categories.service';
import type { Category } from '@/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories().then(setCategories).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Categories' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Browse by collection</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900 sm:text-5xl">Categories</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">Find the right piece faster. Every collection is curated with the same eye for quality and everyday usefulness.</p>
      </div>
      {loading ? <PageLoader /> : categories.length === 0 ? <EmptyState title="No categories yet" description="Categories will appear here once they are added." /> : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} to={`/categories/${category.slug}`} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lift">
              <ProductImage path={category.image_path} alt={category.name} className="aspect-[4/3] w-full" />
              <div className="p-4">
                <h2 className="font-display text-xl text-ink-900">{category.name}</h2>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">{category.description}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700">
                  Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
