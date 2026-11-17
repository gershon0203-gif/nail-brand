import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import type { ProductWithDetails } from '@/types';

interface Props {
  products: ProductWithDetails[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonCount?: number;
}

export function ProductGrid({
  products, loading, error, onRetry, emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your filters or browsing another category.', skeletonCount = 8,
}: Props) {
  if (loading) return <ProductGridSkeleton count={skeletonCount} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!products.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}
