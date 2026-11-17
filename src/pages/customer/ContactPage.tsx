import { useState, type FormEvent } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { STORE } from '@/lib/constants';
import { validators } from '@/lib/validation';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prepared, setPrepared] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (validators.required(form.name, 'Name')) next.name = validators.required(form.name, 'Name');
    if (validators.email(form.email)) next.email = validators.email(form.email);
    if (validators.required(form.subject, 'Subject')) next.subject = validators.required(form.subject, 'Subject');
    if (validators.required(form.message, 'Message')) next.message = validators.required(form.message, 'Message');
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = encodeURIComponent(`${form.message}\n\nFrom: ${form.name}\nEmail: ${form.email}`);
    window.location.href = `mailto:${STORE.email}?subject=${encodeURIComponent(form.subject)}&body=${body}`;
    setPrepared(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Contact' }]} />
      <div className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">We're here to help</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900 sm:text-5xl">Get in touch</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">Questions about a product or an order? Send us a note and a real person from our local team will get back to you.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl text-ink-900">Send a message</h2>
          <p className="mt-1 text-xs text-ink-500">This form opens your email app with the message ready to send — no data is stored on this website.</p>
          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name" error={errors.name} required><Input value={form.name} onChange={(e) => update('name', e.target.value)} invalid={!!errors.name} /></Field>
              <Field label="Email address" error={errors.email} required><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} invalid={!!errors.email} /></Field>
            </div>
            <Field label="Subject" error={errors.subject} required><Input value={form.subject} onChange={(e) => update('subject', e.target.value)} invalid={!!errors.subject} placeholder="How can we help?" /></Field>
            <Field label="Message" error={errors.message} required><Textarea value={form.message} onChange={(e) => update('message', e.target.value)} invalid={!!errors.message} placeholder="Tell us a little more…" className="min-h-36" /></Field>
            <Button type="submit"><Send className="h-4 w-4" /> Open email app</Button>
            {prepared && <p className="text-xs font-medium text-forest-700">Your email app should now be open with the message prepared. If it didn't open, email us directly at {STORE.email}.</p>}
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="font-display text-xl text-ink-900">Store details</h2>
            <div className="mt-5 space-y-4 text-sm text-ink-600">
              <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay-600" />{STORE.address}</p>
              <p className="flex items-center gap-3"><Phone className="h-4 w-4 shrink-0 text-clay-600" />{STORE.phone}</p>
              <p className="flex items-center gap-3"><Mail className="h-4 w-4 shrink-0 text-clay-600" />{STORE.email}</p>
              <p className="flex items-start gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-clay-600" />Mon–Sat, 9:00 AM – 6:00 PM<br />Sunday & public holidays: closed</p>
            </div>
          </div>
          <div className="rounded-2xl bg-forest-50 p-6">
            <p className="font-display text-xl text-forest-800">Order support</p>
            <p className="mt-2 text-sm leading-6 text-forest-700/80">Include your order number when asking about a delivery so we can help faster.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
