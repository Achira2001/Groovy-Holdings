'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const KEY = 'gh_visitor_id';

function visitorId() {
  try {
    let id = localStorage.getItem(KEY);
    let first = false;
    if (!id) {
      id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^a-zA-Z0-9_-]/g, '');
      localStorage.setItem(KEY, id);
      first = true;
    }
    return { id, first };
  } catch {
    return { id: null, first: false };
  }
}

/** Sends an anonymous page view to the API so the admin dashboard can show visitor analytics. */
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    const { id, first } = visitorId();
    if (!id) return;
    const body = JSON.stringify({
      visitorId: id,
      path: pathname,
      firstVisit: first,
      referrer: document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : undefined,
    });
    fetch('/api/public/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true, credentials: 'include' }).catch(() => {});
  }, [pathname]);

  return null;
}
