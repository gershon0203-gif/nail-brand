import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, PackageCheck, HeartHandshake, Truck } from 'lucide-react';
import { SearchBar } from '@/components/common/SearchBar';
import { SectionHeading } from '@/components/common/SectionHeading';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { getHomepageData } from '@/services/products.service';
import type { Category, ProductWithDetails } from '@/types';

export default function HomePage() {
  const [data, setData] = useState<{
    featured: ProductWithDetails[]; latest: ProductWithDetails[]; best: ProductWithDetails[]; categories: Category[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHomepageData().then(setData).catch((err) => setError(err instanceof Error ? err.message : 'Could not load the storefront.'));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-stone-200 bg-forest-800 text-white">
        <div className="absolute inset-0 opacity-25" aria-hidden>
          <div className="absolute -right-20 -top-32 h-[36rem] w-[36rem] rounded-full bg-forest-500 blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-clay-500 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div className="animate-slide-up">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-clay-100">Local · Curated · Everyday</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Thoughtful goods,<br /><span className="text-clay-100">close to home.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-cream-100/85">
              Discover a considered collection of home, kitchen and lifestyle essentials — chosen for quality, made to be used, and served with a personal touch.
            </p>
            <div className="mt-8 max-w-xl"><SearchBar /></div>
            <div className="mt-7 flex flex-wrap items-center gap-6 text-xs text-cream-100/80">
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-clay-100" /> Local delivery</span>
              <span className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-clay-100" /> Cash on Delivery</span>
              <span className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-clay-100" /> Real customer care</span>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-3">
              <div className="mt-10 overflow-hidden rounded-2xl bg-white/10 p-2 backdrop-blur">
                <ProductImage path="/images/demo/home-decor.svg" alt="Home decor collection" className="aspect-[3/4] w-full rounded-xl" eager />
              </div>
              <div className="overflow-hidden rounded-2xl bg-white/10 p-2 backdrop-blur">
                <ProductImage path="/images/demo/kitchen-dining.svg" alt="Kitchen collection" className="aspect-[3/4] w-full rounded-xl" eager />
              </div>
            </div>
            <div className="absolute -bottom-5 left-10 rounded-xl bg-white px-5 py-3 text-ink-900 shadow-lift">
              <p className="font-display text-2xl">200+</p>
              <p className="text-[11px] uppercase tracking-wide text-ink-500">Curated products</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Explore" title="Featured categories" description="Start with what you're looking for." linkTo="/categories" linkLabel="All categories" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {(data?.categories || Array.from({ length: 4 }, (_, i) => ({ id: String(i), slug: '', name: '', image_path: null as string | null }))).map((category) => (
            <Link
              key={category.id} to={category.slug ? `/categories/${category.slug}` : '/categories'}
              className="group overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <ProductImage path={category.image_path} alt={category.name || 'Category'} className="aspect-[5/4] w-full" />
              <div className="flex items-center justify-between gap-2 p-4">
                <span className="font-display text-lg text-ink-900">{category.name || ' '}</span>
                <ArrowRight className="h-4 w-4 text-clay-600 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Hand picked" title="Featured products" description="A few of our favourites this season." linkTo="/products" />
        {error ? <p className="text-sm text-red-600">{error}</p> : data ? <ProductGrid products={data.featured} /> : <ProductGridSkeleton />}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl bg-clay-50 p-8 sm:p-10">
            <div className="relative z-10 max-w-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-700">Everyday value</p>
              <h2 className="mt-3 font-display text-3xl text-ink-900">Simple choices, honest prices.</h2>
              <p className="mt-3 text-sm leading-6 text-ink-600">Great design shouldn't be complicated. Explore pieces that earn their place in your home.</p>
              <Link to="/products" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-clay-700 hover:underline">Shop the collection <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <Leaf className="absolute -bottom-8 -right-6 h-48 w-48 text-clay-100" aria-hidden />
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-forest-50 p-8 sm:p-10">
            <div className="relative z-10 max-w-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-forest-600">Local first</p>
              <h2 className="mt-3 font-display text-3xl text-ink-900">A shop with a human touch.</h2>
              <p className="mt-3 text-sm leading-6 text-ink-600">Need advice or have a question about an order? Reach out and a real person will help.</p>
              <Link to="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest-700 hover:underline">Talk to us <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <HeartHandshake className="absolute -bottom-8 -right-6 h-48 w-48 text-forest-100" aria-hidden />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Just arrived" title="Latest products" linkTo="/products" linkLabel="See everything" />
        {data ? <ProductGrid products={data.latest} /> : <ProductGridSkeleton />}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Customer favourites" title="Best sellers" description="The pieces our customers keep coming back for." linkTo="/products?sort=popular" linkLabel="Shop best sellers" />
        {data ? <ProductGrid products={data.best} /> : <ProductGridSkeleton />}
      </section>

      <section className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            { icon: Truck, title: 'Delivered with care', text: 'Every order is packed by hand and shipped from our local store.' },
            { icon: PackageCheck, title: 'Pay on delivery', text: 'Choose Cash on Delivery at checkout — no card details required.' },
            { icon: HeartHandshake, title: 'Here to help', text: 'Questions about a product or order? Our team is one message away.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-700"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-display text-xl text-ink-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
