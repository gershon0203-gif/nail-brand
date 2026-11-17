import type { ReactNode } from 'react';
import { Loader2, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-6 w-6 animate-spin text-forest-600', className)} aria-label="Loading" />;
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-500">
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  title, description, action, icon,
}: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-cream-50 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-ink-400">
        {icon || <PackageOpen className="h-6 w-6" />}
      </div>
      <h3 className="font-display text-xl text-ink-900">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      title="We couldn't load this"
      description={message}
      icon={<span className="text-xl">!</span>}
      action={onRetry ? (
        <button type="button" onClick={onRetry} className="text-sm font-semibold text-forest-600 underline underline-offset-4">
          Try again
        </button>
      ) : undefined}
    />
  );
}
