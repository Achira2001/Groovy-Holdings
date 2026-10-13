'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarDays, ExternalLink, FolderTree, LayoutDashboard, LogOut, Menu, MessageSquare, Package, Settings, Shirt, UserCog, Users, X,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Avatar } from '@/components/ui';
import RequireAuth from '@/components/layout/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/products', label: 'Products', icon: Shirt },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/chat', label: 'Messages', icon: MessageSquare, badge: 'unread' },
  { href: '/admin/meetings', label: 'Meetings', icon: CalendarDays },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unread, connected } = useSocket();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] items-center border-b border-line px-5">
        <Logo href="/admin" />
      </div>
      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin">
        <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted">Manage</p>
        {NAV.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                active ? 'bg-ink text-bg' : 'text-muted hover:bg-surface-2 hover:text-ink'
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{label}</span>
              {badge === 'unread' && unread > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">{unread}</span>
              )}
            </Link>
          );
        })}
        <p className="px-3 pb-2 pt-5 text-[11px] font-bold uppercase tracking-wider text-muted">You</p>
        <Link href="/profile" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink">
          <UserCog className="h-[18px] w-[18px]" /> Profile & security
        </Link>
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink">
          <ExternalLink className="h-[18px] w-[18px]" /> View website
        </Link>
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <span className="relative">
            <Avatar user={user} size={36} />
            <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-surface', connected ? 'bg-success' : 'bg-line')} title={connected ? 'Live' : 'Offline'} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{user?.name}</span>
            <span className="block truncate text-xs text-muted">{user?.email}</span>
          </span>
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push('/login');
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-danger hover:bg-surface-2"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <RequireAuth role="admin">
      <div className="min-h-screen bg-bg">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-surface lg:block">
          <Sidebar />
        </aside>

        {/* Mobile top bar + drawer */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur lg:hidden">
          <Logo href="/admin" compact />
          <span className="font-display font-bold">Admin</span>
          <button type="button" className="btn-icon" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 border-r border-line bg-surface shadow-pop">
              <button type="button" className="btn-icon absolute right-3 top-4 z-10" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
              <Sidebar onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <main className="lg:pl-64">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </RequireAuth>
  );
}
