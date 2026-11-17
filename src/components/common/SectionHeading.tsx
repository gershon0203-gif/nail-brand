import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  linkTo?: string;
  linkLabel?: string;
}

export function SectionHeading({ eyebrow, title, description, linkTo, linkLabel = 'View all' }: Props) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-clay-600">{eyebrow}</p>}
        <h2 className="font-display text-3xl leading-tight text-ink-900 sm:text-4xl">{title}</h2>
        {description && <p className="mt-2 max-w-xl text-sm leading-6 text-ink-500">{description}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="group inline-flex items-center gap-2 text-sm font-semibold text-forest-700 hover:text-forest-800">
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
