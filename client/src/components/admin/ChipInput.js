'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

/** Type a value and press Enter / comma to add it as a chip. */
export default function ChipInput({ className, label, value = [], onChange, placeholder = 'Type and press Enter', suggestions = [], hint }) {
  const [text, setText] = useState('');
  const add = (raw) => {
    const parts = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    parts.forEach((p) => !next.some((v) => v.toLowerCase() === p.toLowerCase()) && next.push(p));
    onChange(next);
    setText('');
  };
  const unused = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <div className={className}>
      {label && <p className="field-label">{label}</p>}
      <div className="input flex min-h-[46px] flex-wrap items-center gap-1.5 py-1.5">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-md bg-brand-soft py-1 pl-2 pr-1 text-xs font-semibold text-brand">
            {v}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} className="rounded hover:bg-brand/15" aria-label={`Remove ${v}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted/70"
          value={text}
          placeholder={value.length ? '' : placeholder}
          onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(text);
            } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => text && add(text)}
        />
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button key={s} type="button" className="rounded-md border border-dashed border-line px-2 py-0.5 text-xs text-muted hover:border-brand hover:text-brand" onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
