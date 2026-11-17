import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { publicImageUrl } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Props {
  path?: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}

export function ProductImage({ path, alt, className, eager }: Props) {
  const [failed, setFailed] = useState(false);
  const src = publicImageUrl(path);

  if (!src || failed) {
    return (
      <div className={cn('flex items-center justify-center bg-stone-100 text-ink-400', className)} role="img" aria-label={alt}>
        <ImageOff className="h-8 w-8 opacity-60" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
