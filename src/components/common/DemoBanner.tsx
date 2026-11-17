import { FlaskConical, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

/** Clearly labels the in-memory preview so it is never mistaken for a live backend. */
export function DemoBanner() {
  const { isDemo } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  if (!isDemo || dismissed) return null;
  return (
    <div className="bg-ink-900 px-4 py-2 text-center text-[11px] font-medium tracking-wide text-cream-100 sm:text-xs">
      <FlaskConical className="mr-2 inline h-3.5 w-3.5 text-clay-100" aria-hidden />
      DEMO PREVIEW MODE — Catalogue shown from in-memory sample data. Auth, cart persistence, orders and uploads require a configured Supabase project.
      <button
        type="button" onClick={() => setDismissed(true)} aria-label="Dismiss demo notice"
        className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded align-middle text-cream-100/70 hover:bg-white/10 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
