'use client';

import { forwardRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Loader2, X, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn, initials, ORDER_STATUS } from '@/lib/utils';

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand', className)} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="flex items-center gap-3 text-sm text-muted">
        <Spinner /> {label}
      </div>
    </div>
  );
}

export function Button({ variant = 'primary', size, loading, className, children, ...props }) {
  return (
    <button
      className={cn(`btn-${variant}`, size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export const Input = forwardRef(function Input({ label, hint, error, className, id, required, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label} {required && <span className="text-accent">*</span>}
        </label>
      )}
      <input ref={ref} id={inputId} required={required} className={cn('input', error && 'border-danger')} {...props} />
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
});

export function Textarea({ label, hint, className, id, required, rows = 4, ...props }) {
  const inputId = id || props.name;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label} {required && <span className="text-accent">*</span>}
        </label>
      )}
      <textarea id={inputId} rows={rows} required={required} className="input resize-y" {...props} />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function Select({ label, hint, className, id, children, required, ...props }) {
  const inputId = id || props.name;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label} {required && <span className="text-accent">*</span>}
        </label>
      )}
      <select id={inputId} required={required} className="input pr-8" {...props}>
        {children}
      </select>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function PasswordInput({ label = 'Password', hint, className, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={props.id || props.name} className="field-label">
        {label} {props.required && <span className="text-accent">*</span>}
      </label>
      <div className="relative">
        <input id={props.id || props.name} type={show ? 'text' : 'password'} className="input pr-11" {...props} />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-ink"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

/** Visual password strength meter. */
export function PasswordStrength({ value = '' }) {
  const score = [value.length >= 8, /[A-Z]/.test(value) && /[a-z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
  const colors = ['bg-line', 'bg-danger', 'bg-warning', 'bg-brand', 'bg-success'];
  if (!value) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i <= score ? colors[score] : 'bg-line')} />
        ))}
      </div>
      <span className="w-16 text-right text-xs text-muted">{labels[score]}</span>
    </div>
  );
}

const TONES = {
  neutral: 'bg-surface-2 text-muted',
  brand: 'bg-brand-soft text-brand',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/10 text-danger',
};

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold', TONES[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = ORDER_STATUS[status] || { label: status, tone: 'neutral' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function Avatar({ user, size = 40, className }) {
  const [broken, setBroken] = useState(false);
  const src = user?.avatar;
  return (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft font-bold text-brand', className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : (
        initials(user?.name)
      )}
    </span>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-14 text-center', className)}>
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-surface-2 text-muted">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, description, children, size = 'md', footer }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open || !mounted) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#07101d]/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn('relative flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-2xl', widths[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <button type="button" className="btn-icon -mr-2" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scrollbar-thin overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmLabel = 'Confirm', danger, loading, children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Keep it
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {text && <p className="text-sm text-muted">{text}</p>}
      {children}
    </Modal>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-sm">
      <span className="text-muted">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button type="button" className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PageHeader({ title, text, actions, className }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-surface-2', className)} />;
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
    </label>
  );
}
