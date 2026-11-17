import { Minus, Plus } from 'lucide-react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export function QuantitySelector({ value, onChange, min = 1, max = 99, size = 'md' }: Props) {
  const h = size === 'sm' ? 'h-8' : 'h-10';
  return (
    <div className={`inline-flex items-center rounded-lg border border-stone-300 bg-white ${h}`}>
      <button
        type="button" aria-label="Decrease quantity" disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-full w-9 items-center justify-center rounded-l-lg text-ink-600 transition hover:bg-stone-100 disabled:opacity-35"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-9 text-center text-sm font-semibold text-ink-800" aria-live="polite">{value}</span>
      <button
        type="button" aria-label="Increase quantity" disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-full w-9 items-center justify-center rounded-r-lg text-ink-600 transition hover:bg-stone-100 disabled:opacity-35"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
