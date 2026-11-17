import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/utils';
import { validators } from '@/lib/validation';

export default function RegisterPage() {
  const { signUp, isDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (validators.required(form.fullName, 'Full name')) next.fullName = validators.required(form.fullName, 'Full name');
    if (validators.email(form.email)) next.email = validators.email(form.email);
    if (form.phone && validators.phone(form.phone)) next.phone = validators.phone(form.phone);
    if (validators.password(form.password)) next.password = validators.password(form.password);
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const result = await signUp({ email: form.email, password: form.password, fullName: form.fullName, phone: form.phone });
      if (result.needsConfirmation) setNeedsConfirmation(true);
      else { showToast('Your account is ready. Welcome!', 'success'); navigate('/'); }
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step to activate your account.">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-forest-600" />
          <p className="mt-4 text-sm leading-6 text-ink-600">We sent a confirmation link to <strong className="text-ink-800">{form.email}</strong>. Open it to verify your account, then sign in.</p>
          <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-forest-700 hover:underline">Go to sign in</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join us for easier checkout, saved addresses and order tracking."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-forest-700 hover:underline">Sign in</Link></>}
    >
      {isDemo && <p className="mb-5 rounded-lg bg-clay-50 p-3 text-xs leading-5 text-ink-600">Demo mode: registration requires a connected Supabase backend. Use the preview sign-in on the login page to explore.</p>}
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Full name" error={errors.fullName} required>
          <Input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} autoComplete="name" invalid={!!errors.fullName} placeholder="Jane Doe" />
        </Field>
        <Field label="Email address" error={errors.email} required>
          <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" invalid={!!errors.email} placeholder="you@example.com" />
        </Field>
        <Field label="Phone number" error={errors.phone} hint="Optional, but useful for delivery updates.">
          <Input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} autoComplete="tel" invalid={!!errors.phone} placeholder="+1 555 010 2000" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" error={errors.password} required>
            <Input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} autoComplete="new-password" invalid={!!errors.password} placeholder="8+ characters" />
          </Field>
          <Field label="Confirm password" error={errors.confirm} required>
            <Input type="password" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} autoComplete="new-password" invalid={!!errors.confirm} placeholder="Repeat password" />
          </Field>
        </div>
        <Button type="submit" fullWidth loading={loading}>Create account</Button>
        <p className="text-center text-[11px] leading-5 text-ink-400">By creating an account you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
      </form>
    </AuthLayout>
  );
}
