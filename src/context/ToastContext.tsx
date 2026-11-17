import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ToastKind, ToastMessage } from '@/types';
import { cn } from '@/lib/utils';

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'animate-slide-up flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lift',
              toast.kind === 'success' && 'border-forest-100',
              toast.kind === 'error' && 'border-red-200',
              toast.kind === 'info' && 'border-stone-200',
            )}
          >
            {toast.kind === 'success' && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" />}
            {toast.kind === 'error' && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
            {toast.kind === 'info' && <Info className="mt-0.5 h-5 w-5 shrink-0 text-ink-500" />}
            <p className="flex-1 text-sm leading-6 text-ink-700">{toast.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setToasts((current) => current.filter((t) => t.id !== toast.id))}
              className="text-ink-400 transition hover:text-ink-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
