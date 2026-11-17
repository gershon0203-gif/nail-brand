import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CatalogPage } from './CatalogPage';
import { getCategoryBySlug, listCategories } from '@/services/categories.service';
import { PageLoader } from '@/components/ui/Feedback';
import type { Category } from '@/types';

export default function CategoryPage() {
  const { slug = '' } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getCategoryBySlug(slug), listCategories()])
      .then(([found, all]) => {
        if (!active) return;
        setCategory(found || all.find((c) => c.slug === slug) || null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (loading) return <PageLoader />;
  return <CatalogPage mode="category" categorySlug={slug} categoryName={category?.name || 'Category'} />;
}
