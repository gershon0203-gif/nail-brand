import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { PageLoader, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { listAddresses, saveAddress, deleteAddress, setDefaultAddress, emptyAddress } from '@/services/addresses.service';
import { validateAddress } from '@/lib/validation';
import { getErrorMessage, cn } from '@/lib/utils';
import type { Address, AddressInput } from '@/types';

export default function AddressesPage() {
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressInput>(emptyAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try { setAddresses(await listAddresses(user.id)); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [user?.id]);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyAddress });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(address: Address) {
    setEditing(address);
    const { id: _id, user_id: _uid, created_at: _c, updated_at: _u, ...rest } = address;
    void _id; void _uid; void _c; void _u;
    setForm(rest);
    setErrors({});
    setModalOpen(true);
  }

  function update(key: keyof AddressInput, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateAddress(form as unknown as Record<string, string>);
    setErrors(found);
    if (Object.keys(found).length || !user) return;
    setSaving(true);
    try {
      await saveAddress(user.id, form, editing?.id);
      showToast(editing ? 'Address updated.' : 'Address added.', 'success');
      setModalOpen(false);
      await load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(address: Address) {
    if (!window.confirm('Delete this address? This cannot be undone.')) return;
    try {
      await deleteAddress(address.id);
      showToast('Address deleted.', 'success');
      await load();
    } catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  async function makeDefault(address: Address) {
    if (!user) return;
    try {
      await setDefaultAddress(user.id, address.id);
      showToast('Default address updated.', 'success');
      await load();
    } catch (err) { showToast(getErrorMessage(err), 'error'); }
  }

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-8"><PageLoader /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">Your account</p>
          <h1 className="mt-2 font-display text-4xl text-ink-900">Addresses</h1>
          <p className="mt-2 text-sm text-ink-500">Save delivery addresses for a faster checkout.</p>
        </div>
        <Button onClick={openNew} disabled={isDemo}><Plus className="h-4 w-4" /> Add address</Button>
      </div>

      {isDemo && <p className="mb-6 rounded-xl bg-clay-50 p-4 text-xs leading-5 text-ink-600">Address management requires a connected Supabase backend. The list below is empty in demo mode.</p>}
      {error && <div className="mb-6"><ErrorState message={error} onRetry={load} /></div>}

      {!error && addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-6 w-6" />}
          title="No saved addresses"
          description="Add an address now so checkout is quick and easy next time."
          action={<Button onClick={openNew} disabled={isDemo}>Add your first address</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} className={cn('rounded-2xl border bg-white p-5 shadow-soft', address.is_default ? 'border-forest-300' : 'border-stone-200')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink-900">{address.label || 'Address'}</p>
                  {address.is_default && <Badge tone="brand"><Star className="mr-1 h-3 w-3" /> Default</Badge>}
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => openEdit(address)} aria-label="Edit address" className="rounded-lg p-2 text-ink-400 hover:bg-stone-100 hover:text-forest-700"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(address)} aria-label="Delete address" className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-ink-800">{address.full_name}</p>
              <p className="mt-1 text-sm leading-6 text-ink-500">
                {address.house_flat}, {address.street}, {address.area}<br />
                {address.city}, {address.state} {address.pin_code}<br />
                {address.landmark ? `Near ${address.landmark}` : ''}
              </p>
              <p className="mt-2 text-xs text-ink-400">{address.phone}</p>
              {!address.is_default && (
                <button type="button" onClick={() => makeDefault(address)} className="mt-4 text-xs font-semibold text-forest-700 hover:underline">Set as default</button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-sm text-ink-500"><Link to="/checkout" className="font-semibold text-forest-700 hover:underline">Continue to checkout →</Link></p>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit address' : 'Add a new address'} description="All fields marked * are required." size="lg">
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="Label" className="sm:col-span-2">
            <Select value={form.label || 'Home'} onChange={(e) => update('label', e.target.value)}>
              <option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="Full name" error={errors.full_name} required><Input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} invalid={!!errors.full_name} /></Field>
          <Field label="Phone number" error={errors.phone} required><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} invalid={!!errors.phone} /></Field>
          <Field label="House / Flat number" error={errors.house_flat} required><Input value={form.house_flat} onChange={(e) => update('house_flat', e.target.value)} invalid={!!errors.house_flat} /></Field>
          <Field label="Street" error={errors.street} required><Input value={form.street} onChange={(e) => update('street', e.target.value)} invalid={!!errors.street} /></Field>
          <Field label="Area" error={errors.area} required><Input value={form.area} onChange={(e) => update('area', e.target.value)} invalid={!!errors.area} /></Field>
          <Field label="Landmark" hint="Optional"><Input value={form.landmark || ''} onChange={(e) => update('landmark', e.target.value)} /></Field>
          <Field label="City" error={errors.city} required><Input value={form.city} onChange={(e) => update('city', e.target.value)} invalid={!!errors.city} /></Field>
          <Field label="State" error={errors.state} required><Input value={form.state} onChange={(e) => update('state', e.target.value)} invalid={!!errors.state} /></Field>
          <Field label="PIN / Postal code" error={errors.pin_code} required><Input value={form.pin_code} onChange={(e) => update('pin_code', e.target.value)} invalid={!!errors.pin_code} /></Field>
          <label className="flex items-center gap-2.5 text-sm text-ink-600 sm:col-span-2">
            <input type="checkbox" checked={form.is_default} onChange={(e) => update('is_default', e.target.checked)} className="h-4 w-4 accent-forest-700" />
            Make this my default delivery address
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add address'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
