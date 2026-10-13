'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const NAMES = ['brand', 'brand-deep', 'accent', 'success', 'warning', 'danger', 'muted', 'line', 'ink', 'surface'];

/** Reads the current theme tokens so Recharts (SVG attributes) gets real colours. */
export default function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const css = getComputedStyle(document.documentElement);
      const out = {};
      NAMES.forEach((n) => {
        out[n] = `rgb(${css.getPropertyValue(`--${n}`).trim().split(/\s+/).join(',')})`;
      });
      setColors(out);
    });
    return () => cancelAnimationFrame(id);
  }, [resolvedTheme]);
  return colors;
}
