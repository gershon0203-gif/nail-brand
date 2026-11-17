import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, error, hint, required, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-ink-700">
          {label}{required && <span className="ml-1 text-clay-600">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}

const controlClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 ' +
  'transition focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20 disabled:bg-stone-100';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className, ...props }: InputProps) {
  return <input className={cn(controlClass, invalid && 'border-red-400 focus:border-red-500 focus:ring-red-500/20', className)} {...props} />;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid, className, children, ...props }: SelectProps) {
  return (
    <select className={cn(controlClass, 'appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B645A\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10', invalid && 'border-red-400', className)} {...props}>
      {children}
    </select>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid, className, ...props }: TextareaProps) {
  return <textarea className={cn(controlClass, 'min-h-24 resize-y', invalid && 'border-red-400', className)} {...props} />;
}
