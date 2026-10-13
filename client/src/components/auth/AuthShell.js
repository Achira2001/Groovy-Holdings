import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

/** Two-column wrapper for sign in / register / password pages. */
export default function AuthShell({ title, subtitle, children, footer, side = 'customer' }) {
  const points =
    side === 'admin'
      ? ['Manage products, categories and prices', 'Review orders and design files', 'Chat with customers and run meetings']
      : ['Upload designs and place orders', 'Chat with our team and share files', 'Book Google Meet consultations'];
  return (
    <div className="container grid min-h-[calc(100vh-72px)] items-center gap-10 py-10 lg:grid-cols-[1fr_1.05fr] lg:py-16">
      <aside className="relative hidden h-full min-h-[520px] overflow-hidden rounded-[28px] bg-[#13243B] p-10 text-white lg:flex lg:flex-col">
        <div className="halftone-accent absolute -bottom-10 -right-10 h-80 w-80 rounded-full opacity-50" />
        <div className="halftone absolute -left-16 top-24 h-56 w-56 rounded-full opacity-40" />
        <p className="relative font-display text-sm font-semibold text-white/60">{side === 'admin' ? 'Groovy Holdings · Admin' : 'Groovy Holdings'}</p>
        <h2 className="relative mt-auto max-w-sm font-display text-4xl font-extrabold leading-tight">
          {side === 'admin' ? 'Run the print shop from one place.' : 'From your idea to a box of printed shirts.'}
        </h2>
        <ul className="relative mt-8 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3 text-white/80">
              <CheckCircle2 className="h-5 w-5 text-[#FF834D]" /> {p}
            </li>
          ))}
        </ul>
      </aside>
      <div className="mx-auto w-full max-w-[440px]">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 text-center text-sm text-muted">{footer}</div>}
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="hover:text-ink">Back to website</Link>
        </p>
      </div>
    </div>
  );
}

export function Divider({ children = 'or' }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-muted">
      <span className="h-px flex-1 bg-line" /> {children} <span className="h-px flex-1 bg-line" />
    </div>
  );
}
