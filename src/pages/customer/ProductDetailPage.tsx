import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, Truck, ShieldCheck, RotateCcw, ChevronRight, Check } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductGrid } from '@/components/product/ProductGrid';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getProduct, getRelatedProducts } from '@/services/products.service';
import { discountPrice, cn } from '@/lib/utils';
import type { ProductWithDetails } from '@/types';

export default function ProductDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [related, setRelated] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setQuantity(1);
    setActiveImage(0);
    getProduct(slug)
      .then((data) => {
        if (!active) return;
        setProduct(data);
        if (data) {
          setRelatedLoading(true);
          getRelatedProducts(data).then((r) => { if (active) setRelated(r); }).finally(() => { if (active) setRelatedLoading(false); });
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (loading) return <PageLoader label="Loading product…" />;
  if (!product) return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <EmptyState title="Product not found" description="This product may have been archived or the link is incorrect." action={<Link to="/products" className="text-sm font-semibold text-forest-700 underline">Browse products</Link>} />
    </div>
  );

  const outOfStock = product.stock_quantity <= 0;
  const discounted = product.discount_percent > 0;
  const price = discountPrice(product.price, product.discount_percent);
  const images = product.images?.length ? product.images : [{ id: 'empty', path: null, alt_text: product.name, product_id: product.id, sort_order: 0 }];

  async function handleAdd(goToCart = false) {
    if (!isAuthenticated) {
      showToast('Please sign in to add items to your cart.', 'info');
      navigate('/login', { state: { from: `/products/${slug}` } });
      return;
    }
    setAdding(true);
    try {
      await add(product!.id, quantity);
      showToast(`${quantity} × ${product!.name} added to your cart.`, 'success');
      if (goToCart) navigate('/cart');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not add to cart.', 'error');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: 'Products', to: '/products' },
        ...(product.category ? [{ label: product.category.name, to: `/categories/${product.category.slug}` }] : []),
        { label: product.name },
      ]} />

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <ProductImage path={images[activeImage]?.path} alt={images[activeImage]?.alt_text || product.name} eager className="aspect-square w-full" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((image, index) => (
                <button
                  key={image.id} type="button" onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  className={cn('h-20 w-20 overflow-hidden rounded-lg border-2 bg-white transition', activeImage === index ? 'border-forest-600' : 'border-transparent hover:border-stone-300')}
                >
                  <ProductImage path={image.path} alt={image.alt_text || product.name} className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.category && <Link to={`/categories/${product.category.slug}`} className="text-xs font-semibold uppercase tracking-wider text-clay-600 hover:underline">{product.category.name}</Link>}
            <span className="text-ink-300">·</span>
            <span className="text-xs text-ink-400">SKU {product.sku}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink-900 sm:text-4xl">{product.name}</h1>
          {product.short_description && <p className="mt-3 text-sm leading-6 text-ink-500">{product.short_description}</p>}

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-ink-900">${price.toFixed(2)}</span>
            {discounted && (
              <>
                <span className="text-lg text-ink-400 line-through">${product.price.toFixed(2)}</span>
                <Badge tone="clay">Save {product.discount_percent}%</Badge>
              </>
            )}
          </div>
          <p className={cn('mt-2 text-sm font-medium', outOfStock ? 'text-red-600' : 'text-forest-700')}>
            {outOfStock ? 'Out of stock — check back soon' : product.stock_quantity <= 5 ? `Only ${product.stock_quantity} left in stock` : 'In stock — ready to ship'}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={Math.max(1, product.stock_quantity)} />
            <button
              type="button" onClick={() => handleAdd(false)} disabled={outOfStock || adding}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-forest-700 px-5 text-sm font-semibold text-forest-700 transition hover:bg-forest-50 disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" /> Add to cart
            </button>
          </div>
          <button
            type="button" onClick={() => handleAdd(true)} disabled={outOfStock || adding}
            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-forest-700 px-6 text-sm font-semibold text-white transition hover:bg-forest-800 disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Buy now'} <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-stone-200 pt-6 sm:grid-cols-3">
            {[
              { icon: Truck, title: 'Local delivery', text: 'Carefully packed and shipped from our store' },
              { icon: ShieldCheck, title: 'Secure checkout', text: 'Cash on Delivery — no card details needed' },
              { icon: RotateCcw, title: 'Easy support', text: 'Talk to a real person about any order' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl bg-cream-100 p-3">
                <Icon className="h-5 w-5 text-clay-600" />
                <p className="mt-2 text-xs font-semibold text-ink-800">{title}</p>
                <p className="mt-1 text-[11px] leading-4 text-ink-500">{text}</p>
              </div>
            ))}
          </div>

          {product.description && (
            <div className="mt-8 border-t border-stone-200 pt-6">
              <h2 className="font-display text-2xl text-ink-900">Product details</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-600">{product.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink-600">
                {['Selected for quality and everyday usefulness', 'Natural materials and considered finishing', 'Backed by our local customer care team'].map((item) => (
                  <li key={item} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <section className="mt-20">
        <div className="mb-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">You may also like</p>
          <h2 className="mt-2 font-display text-3xl text-ink-900">Related products</h2>
        </div>
        {relatedLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><ProductCardSkeleton /><ProductCardSkeleton /><ProductCardSkeleton /><ProductCardSkeleton /></div>
        ) : (
          <ProductGrid products={related} emptyTitle="No related products yet" />
        )}
      </section>
    </div>
  );
}
