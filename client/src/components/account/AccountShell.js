'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, LayoutGrid, MessageSquare, Package, UserCog } from 'lucide-react';
import RequireAuth from '@/components/layout/RequireAuth';
import { useSocket } from '@/context/SocketContext';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/account', label: 'Overview', icon: LayoutGrid, exact: true },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/meetings', label: 'Meetings', icon: CalendarDays },
  { href: '/chat', label: 'Messages', icon: MessageSquare, badge: true },
  { href: '/profile', label: 'Profile', icon: UserCog },
];

/** Customer area wrapper: auth guard + tab navigation. */
export default function AccountShell({ children, wide }) {
  const pathname = usePathname();
  const { unread } = useSocket();
  return (
    <RequireAuth role="customer">
      <div className={cn('container py-8 sm:py-10', wide && 'max-w-none')}>
        <nav className="scrollbar-thin -mx-1 mb-8 flex gap-1 overflow-x-auto border-b border-line px-1" aria-label="Account">
          {TABS.map(({ href, label, icon: Icon, exact, badge }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex shrink-0 items-center gap-2 px-3 pb-3 pt-1 text-sm font-semibold transition-colors',
                  active ? 'text-ink' : 'text-muted hover:text-ink'
                )}
              >
                <Icon className="h-4 w-4" /> {label}
                {badge && unread > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">{unread}</span>
                )}
                {active && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </RequireAuth>
  );
}
