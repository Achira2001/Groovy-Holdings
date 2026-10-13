'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, MessageSquare, User, X, Package, CalendarDays } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/meetings', label: 'Book a meeting' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const { unread } = useSocket();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const active = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const chatHref = isAdmin ? '/admin/chat' : '/chat';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors',
        scrolled ? 'border-line bg-bg/85 backdrop-blur-md' : 'border-transparent bg-bg'
      )}
    >
      <nav className="container flex h-[72px] items-center gap-6">
        <Logo />

        <ul className="ml-4 hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={cn(
                  'relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  active(l.href) ? 'text-ink' : 'text-muted hover:text-ink'
                )}
              >
                {l.label}
                {active(l.href) && <span className="absolute inset-x-3 -bottom-[3px] h-[3px] rounded-full bg-accent" />}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />

          {user ? (
            <>
              <Link href={chatHref} className="btn-icon relative" aria-label="Messages">
                <MessageSquare className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenu((m) => !m)}
                  className="flex items-center gap-2 rounded-full p-0.5 pr-0.5 ring-line transition hover:ring-2"
                  aria-haspopup="menu"
                  aria-expanded={menu}
                >
                  <Avatar user={user} size={36} />
                </button>
                {menu && (
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-pop" role="menu">
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-bold">{user.name}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                    <div className="p-1.5 text-sm">
                      <MenuLink href={isAdmin ? '/admin' : '/account'} icon={LayoutDashboard}>
                        {isAdmin ? 'Admin dashboard' : 'My account'}
                      </MenuLink>
                      {!isAdmin && (
                        <>
                          <MenuLink href="/account/orders" icon={Package}>My orders</MenuLink>
                          <MenuLink href="/account/meetings" icon={CalendarDays}>My meetings</MenuLink>
                        </>
                      )}
                      <MenuLink href="/profile" icon={User}>Profile & security</MenuLink>
                      <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-danger hover:bg-surface-2">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="btn-ghost">Sign in</Link>
              <Link href="/register" className="btn-primary">Create account</Link>
            </div>
          )}

          <button type="button" className="btn-icon lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line bg-bg lg:hidden">
          <div className="container flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn('rounded-lg px-3 py-2.5 font-semibold', active(l.href) ? 'bg-surface-2 text-ink' : 'text-muted')}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-line pt-4">
              <span className="text-sm text-muted">Theme</span>
              <ThemeToggle />
            </div>
            {!user && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href="/login" className="btn-outline">Sign in</Link>
                <Link href="/register" className="btn-primary">Create account</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ href, icon: Icon, children }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-ink hover:bg-surface-2" role="menuitem">
      <Icon className="h-4 w-4 text-muted" /> {children}
    </Link>
  );
}
