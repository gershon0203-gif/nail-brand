import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, Mail, Phone, ShieldCheck, KeyRound, MapPin, Package } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage, formatDate, titleCase } from '@/lib/utils';
import { validators } from '@/lib/validation';

export default function ProfilePage() {
  const { profile, user, updateProfile, isDemo } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (validators.required(fullName, 'Full name')) next.fullName = validators.required(fullName, 'Full name');
    if (phone && validators.phone(phone)) next.phone = validators.phone(phone);
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName.trim(), phone: phone.trim() || null });
      showToast('Profile updated.', 'success');
      setEditing(false);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Your account</p>
        <h1 className="mt-2 font-display text-4xl text-ink-900">My profile</h1>
        <p className="mt-2 text-sm text-ink-500">Manage your personal details and account preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-soft">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-50 text-forest-700">
              <UserRound className="h-8 w-8" />
            </div>
            <h2 className="mt-4 font-display text-xl text-ink-900">{profile.full_name}</h2>
            <p className="mt-1 text-xs text-ink-400">{profile.email}</p>
            <div className="mt-3"><Badge tone="brand">{titleCase(profile.role.replace('_', ' '))}</Badge></div>
            <p className="mt-4 text-[11px] text-ink-400">Member since {formatDate(profile.created_at)}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-soft">
            <Link to="/addresses" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-700 hover:bg-cream-100"><MapPin className="h-4 w-4 text-clay-600" /> Manage addresses</Link>
            <Link to="/orders" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-700 hover:bg-cream-100"><Package className="h-4 w-4 text-clay-600" /> Order history</Link>
            <Link to="/forgot-password" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-700 hover:bg-cream-100"><KeyRound className="h-4 w-4 text-clay-600" /> Reset password</Link>
          </div>
        </aside>

        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl text-ink-900">Personal information</h2>
              {!editing && <Button variant="outline" size="sm" onClick={() => { setFullName(profile.full_name); setPhone(profile.phone || ''); setEditing(true); }}>Edit</Button>}
            </div>
            {editing ? (
              <form onSubmit={submit} noValidate className="mt-6 space-y-4">
                <Field label="Full name" error={errors.fullName} required>
                  <Input value={fullName} onChange={(e) => { setFullName(e.target.value); setErrors({}); }} invalid={!!errors.fullName} />
                </Field>
                <Field label="Phone number" error={errors.phone}>
                  <Input value={phone} onChange={(e) => { setPhone(e.target.value); setErrors({}); }} invalid={!!errors.phone} />
                </Field>
                <div className="flex gap-3">
                  <Button type="submit" loading={saving}>Save changes</Button>
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <div><dt className="text-xs text-ink-400">Full name</dt><dd className="mt-1 flex items-center gap-2 text-sm font-medium text-ink-800"><UserRound className="h-4 w-4 text-ink-400" />{profile.full_name}</dd></div>
                <div><dt className="text-xs text-ink-400">Email address</dt><dd className="mt-1 flex items-center gap-2 text-sm font-medium text-ink-800"><Mail className="h-4 w-4 text-ink-400" />{profile.email}</dd></div>
                <div><dt className="text-xs text-ink-400">Phone number</dt><dd className="mt-1 flex items-center gap-2 text-sm font-medium text-ink-800"><Phone className="h-4 w-4 text-ink-400" />{profile.phone || 'Not provided'}</dd></div>
                <div><dt className="text-xs text-ink-400">Account role</dt><dd className="mt-1 text-sm font-medium capitalize text-ink-800">{profile.role.replace('_', ' ')}</dd></div>
              </dl>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
            <h2 className="font-display text-2xl text-ink-900">Security</h2>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-forest-50 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-forest-700" />
              <div>
                <p className="text-sm font-semibold text-forest-800">Your data is protected</p>
                <p className="mt-1 text-xs leading-5 text-forest-700/80">
                  You can only view and change your own profile, addresses, cart and orders. Administrative roles can never be assigned through the profile form — they are set by a database administrator.
                </p>
              </div>
            </div>
            {isDemo && <p className="mt-4 text-xs text-ink-400">Demo session: {user?.email || 'preview account'}. Changes here are in-memory only.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
