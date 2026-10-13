import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Brand mark. The logo file lives at /public/logo.jpg –
 * replace that file (keep the name) or change LOGO_SRC to update it everywhere.
 */
export const LOGO_SRC = '/logo.jpg';

export default function Logo({ className, compact = false, href = '/' }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2.5', className)} aria-label="Groovy Holdings home">
      <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SRC} alt="" className="h-full w-full scale-[1.75] object-cover object-[50%_40%]" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[17px] font-extrabold tracking-tight text-ink">Groovy Holdings</span>
          <span className="mt-1 block text-[11px] font-medium text-muted">Print · Embroidery · Merch</span>
        </span>
      )}
    </Link>
  );
}
