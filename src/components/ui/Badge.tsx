import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand' | 'clay';

const tones: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-ink-700',
  success: 'bg-forest-50 text-forest-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  brand: 'bg-forest-600 text-white',
  clay: 'bg-clay-50 text-clay-700',
};

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide', tones[tone], className)}>
      {children}
    </span>
  );
}
