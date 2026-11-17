import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/Feedback';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your session…" />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (adminOnly && !isAdmin) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <ShieldAlert className="h-10 w-10 text-clay-600" />
        <h1 className="mt-5 font-display text-3xl text-ink-900">Access restricted</h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          This area is available to store administrators only. Your account does not have the required role.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
