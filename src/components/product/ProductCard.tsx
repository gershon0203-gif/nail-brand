import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, ShoppingBag, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from './ProductImage';
import { discountPrice, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import type { ProductWithDetails } from '@/types';

export function ProductCard({ product }: { product: ProductWithDetails }) {
  const { isAuthenticated } = useAuth();
  const { add, refreshing } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock_quantity <= 0;
  const discounted = product.discount_percent > 0;
  const price = discountPrice(product.price, product.discount_percent);

  async function handleAdd() {
    if (!isAuthenticated) {
      showToast('Please sign in to add items to your cart.', 'info');
      navigate('/login', { state: { from: `/products/${product.slug}` } });
      return;
    }
    setAdding(true);
    try {
      await add(product.id, 1);
      setAdded(true);
      showToast(`${product.name} added to your cart.`, 'success');
      window.setTimeout(() => setAdded(false), 1800);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not add to cart.', 'error');
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <Link to={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-stone-100">
        <ProductImage
          path={product.images?.[0]?.path}
          alt={product.name}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discounted && <Badge tone="clay">-{product.discount_percent}%</Badge>}
          {product.is_featured && <Badge tone="brand">Featured</Badge>}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/65">
            <Badge tone="danger" className="px-4 py-1.5 text-xs">Out of stock</Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          {product.category?.name || 'General'}
        </p>
        <Link to={`/products/${product.slug}`} className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-ink-800 hover:text-forest-700">
          {product.name}
        </Link>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink-900">${price.toFixed(2)}</span>
          {discounted && <span className="text-sm text-ink-400 line-through">${product.price.toFixed(2)}</span>}
        </div>

        <p className={cn('mt-1.5 text-xs font-medium', outOfStock ? 'text-red-600' : 'text-forest-600')}>
          {outOfStock ? 'Currently unavailable' : product.stock_quantity <= 5 ? `Only ${product.stock_quantity} left` : 'In stock'}
        </p>

        <div className="mt-4 flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock || adding || refreshing}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-forest-700 px-3 text-xs font-semibold text-white transition hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
            {added ? 'Added' : 'Add to cart'}
          </button>
          <Link
            to={`/products/${product.slug}`}
            aria-label={`View details for ${product.name}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-ink-500 transition hover:border-forest-500 hover:text-forest-700"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
