import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/utils';
import { validators } from '@/lib/validation';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = validators.email(email);
    setError(validation);
    if (validation) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a secure link to set a new password." footer={<Link to="/login" className="font-semibold text-forest-700 hover:underline">Back to sign in</Link>}>
      {sent ? (
        <div className="text-center">
          <MailCheck className="mx-auto h-12 w-12 text-forest-600" />
          <p className="mt-4 text-sm leading-6 text-ink-600">If an account exists for <strong className="text-ink-800">{email}</strong>, a password reset link is on its way. Check your inbox and spam folder.</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <Field label="Email address" error={error} required>
            <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} autoComplete="email" invalid={!!error} placeholder="you@example.com" />
          </Field>
          <Button type="submit" fullWidth loading={loading}>Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  );
}
