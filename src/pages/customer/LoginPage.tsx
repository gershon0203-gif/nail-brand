import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, FlaskConical } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/utils';
import { validators } from '@/lib/validation';

export default function LoginPage() {
  const { signIn, demoSignIn, isDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (validators.email(email)) next.email = validators.email(email);
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await signIn(email, password);
      showToast('Welcome back!', 'success');
      navigate(from, { replace: true });
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  function enterDemo(role: 'customer' | 'admin') {
    demoSignIn(role);
    showToast(`Signed in as demo ${role}.`, 'success');
    navigate(role === 'admin' ? '/admin' : from, { replace: true });
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your orders, addresses and saved cart."
      footer={<>New here? <Link to="/register" className="font-semibold text-forest-700 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Email address" error={errors.email} required>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} placeholder="you@example.com" />
        </Field>
        <Field label="Password" error={errors.password} required>
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} placeholder="Your password" className="pr-11" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 hover:bg-stone-100 hover:text-ink-700">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs font-medium text-forest-700 hover:underline">Forgot your password?</Link>
        </div>
        <Button type="submit" fullWidth loading={loading}>Sign in</Button>
      </form>

      {isDemo && (
        <div className="mt-6 rounded-xl border border-dashed border-clay-200 bg-clay-50 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-clay-700"><FlaskConical className="h-4 w-4" /> Demo preview</p>
          <p className="mt-1 text-[11px] leading-5 text-ink-600">No backend is connected. Enter a preview session to explore protected pages. Nothing is persisted.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => enterDemo('customer')}>Preview customer</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => enterDemo('admin')}>Preview admin</Button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
