import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink-900/45 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className={`animate-slide-up relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-lift sm:rounded-2xl ${size === 'lg' ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-5">
          <div>
            <h2 className="font-display text-2xl text-ink-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-400 hover:bg-stone-100 hover:text-ink-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
