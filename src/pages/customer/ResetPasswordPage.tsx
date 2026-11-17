import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/utils';
import { validators } from '@/lib/validation';

export default function ResetPasswordPage() {
  const { updatePassword, isDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = validators.password(password) || (password === confirm ? '' : 'Passwords do not match.');
    setError(validation);
    if (validation) return;
    setLoading(true);
    try {
      await updatePassword(password);
      showToast('Your password has been updated.', 'success');
      navigate('/profile', { replace: true });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Use at least 8 characters for your new password.">
      {isDemo && <p className="mb-5 rounded-lg bg-clay-50 p-3 text-xs leading-5 text-ink-600">Password updates require a connected Supabase backend.</p>}
      <div className="mb-5 flex justify-center"><KeyRound className="h-8 w-8 text-forest-600" /></div>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="New password" error={validators.password(password) ? undefined : error} required>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="8+ characters" />
        </Field>
        <Field label="Confirm new password" required>
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} placeholder="Repeat password" />
        </Field>
        <Button type="submit" fullWidth loading={loading}>Update password</Button>
      </form>
    </AuthLayout>
  );
}
