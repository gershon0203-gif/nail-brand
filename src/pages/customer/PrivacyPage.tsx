import { Breadcrumbs } from '@/components/common/Breadcrumbs';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Privacy policy' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Legal</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900">Privacy policy</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated: 17 November 2026</p>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm leading-7 text-ink-600 sm:p-10">
        <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800"><strong>Template notice:</strong> This text is a starter policy for the storefront. Review it with a qualified professional and adapt it to your business and jurisdiction before going live.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">1. What we collect</h2>
        <p className="mt-2">We collect the information you give us when you create an account, save an address or place an order: your name, email address, phone number and delivery address. We also store your order history so you can track purchases.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">2. How we use it</h2>
        <p className="mt-2">We use your information to create and manage your account, process and deliver your orders, provide customer support and send service-related messages. We do not sell your personal information.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">3. Access and security</h2>
        <p className="mt-2">Your account is protected by Supabase Authentication. Database row-level security ensures you can only access your own profile, addresses, cart and orders. Store administrators can view order and delivery information only as needed to fulfil orders. Passwords and authentication secrets are never exposed to other customers or to the storefront code.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">4. Payments</h2>
        <p className="mt-2">At this stage the store offers Cash on Delivery only. We do not collect, store or process card details. A future online payment provider, if added, will be governed by its own privacy terms.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">5. Your choices</h2>
        <p className="mt-2">You can update your profile and addresses at any time from your account pages. To request account deletion or a copy of your data, contact us using the details on the <a className="text-forest-700 underline" href="/contact">Contact page</a>.</p>
        <h2 className="mt-6 font-display text-2xl text-ink-900">6. Contact</h2>
        <p className="mt-2">For privacy questions, email hello@norwoodandco.example or use our Contact page.</p>
      </div>
    </div>
  );
}
