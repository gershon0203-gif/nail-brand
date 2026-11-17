import { Link } from 'react-router-dom';
import { Leaf, HeartHandshake, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { STORE } from '@/lib/constants';

export default function AboutPage() {
  return (
    <div>
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: 'About us' }]} />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Our story</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight text-ink-900 sm:text-6xl">A small shop with a big heart for everyday things.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-500">{STORE.name} began as a simple idea: make it easy to find well-made, useful things without the noise. We are a local business, and we still believe in personal service.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl text-ink-900">What we believe</h2>
            <p className="mt-4 text-sm leading-7 text-ink-600">We choose products the way we would choose them for our own homes. That means honest materials, thoughtful design and pieces that earn their place. We keep our range focused so you can browse with confidence, and we are always happy to help you decide.</p>
            <p className="mt-4 text-sm leading-7 text-ink-600">When you shop with us, you are supporting a local team — not a faceless marketplace. Your questions go to a person, and your orders are packed with care.</p>
            <Link to="/products" className="mt-6 inline-flex rounded-lg bg-forest-700 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-800">Explore the collection</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-cream-200 p-6">
              <Leaf className="h-6 w-6 text-forest-700" />
              <p className="mt-4 font-display text-xl text-ink-900">Considered choices</p>
              <p className="mt-2 text-xs leading-5 text-ink-500">Every item is selected for quality and usefulness.</p>
            </div>
            <div className="rounded-2xl bg-forest-50 p-6">
              <HeartHandshake className="h-6 w-6 text-forest-700" />
              <p className="mt-4 font-display text-xl text-ink-900">Personal service</p>
              <p className="mt-2 text-xs leading-5 text-ink-500">Real people, ready to answer your questions.</p>
            </div>
            <div className="rounded-2xl bg-clay-50 p-6">
              <ShieldCheck className="h-6 w-6 text-clay-700" />
              <p className="mt-4 font-display text-xl text-ink-900">Straightforward</p>
              <p className="mt-2 text-xs leading-5 text-ink-500">Clear prices and a simple, honest checkout.</p>
            </div>
            <div className="rounded-2xl bg-stone-100 p-6">
              <p className="font-display text-4xl text-ink-900">200+</p>
              <p className="mt-2 text-xs leading-5 text-ink-500">Carefully chosen products in our catalogue.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
