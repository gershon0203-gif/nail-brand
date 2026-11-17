import { Breadcrumbs } from '@/components/common/Breadcrumbs';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Terms & conditions' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Legal</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900">Terms & conditions</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated: 17 November 2026</p>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm leading-7 text-ink-600 sm:p-10">
        <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800"><strong>Template notice:</strong> This is a starter document for the storefront. Have it reviewed for your jurisdiction and business before launch.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">1. Using this store</h2>
        <p className="mt-2">By using this website you agree to these terms. You must provide accurate information when creating an account or placing an order, and you must be eligible to enter into a purchase agreement.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">2. Products and pricing</h2>
        <p className="mt-2">We aim to show accurate product information, prices and availability. Prices and stock can change. The price and stock confirmed at the time your order is created by our system are the ones that apply. Final order totals are calculated by our server, not by your browser.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">3. Orders and payment</h2>
        <p className="mt-2">Placing an order creates a request to purchase. We may cancel or refuse an order where a product is unavailable, pricing is incorrect or fraud is suspected. Cash on Delivery is currently the only payment method: payment is due when your order is delivered.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">4. Delivery</h2>
        <p className="mt-2">Delivery times are estimates and may vary. You are responsible for providing a complete and accurate delivery address. You can follow your order's progress from the order details page.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">5. Accounts and security</h2>
        <p className="mt-2">Keep your account credentials confidential. You are responsible for activity under your account. Administrative access is granted only by store administrators and cannot be assigned through your profile.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">6. Changes</h2>
        <p className="mt-2">We may update these terms from time to time. The current version is always available on this page.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">7. Contact</h2>
        <p className="mt-2">Questions about these terms can be sent through our <a className="text-forest-700 underline" href="/contact">Contact page</a>.</p>
      </div>
    </div>
  );
}
