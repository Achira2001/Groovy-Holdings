'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ThemeToggle({ className }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={cn(
        'relative inline-flex h-9 w-[68px] items-center rounded-full border border-line bg-surface-2 p-1 transition-colors',
        className
      )}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
    >
      <span
        className={cn(
          'absolute top-1 grid h-7 w-7 place-items-center rounded-full bg-surface shadow-lift transition-transform duration-300',
          dark ? 'translate-x-[30px]' : 'translate-x-0'
        )}
      >
        {dark ? <Moon className="h-4 w-4 text-brand" /> : <Sun className="h-4 w-4 text-accent" />}
      </span>
      <Sun className="ml-1.5 h-3.5 w-3.5 text-muted" />
      <Moon className="ml-auto mr-1.5 h-3.5 w-3.5 text-muted" />
    </button>
  );
}
