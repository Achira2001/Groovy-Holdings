import { Check } from 'lucide-react';
import { cn, formatDateTime, formatLKR, ORDER_FLOW, ORDER_STATUS } from '@/lib/utils';

/** Horizontal progress stepper through the production flow. */
export function OrderProgress({ status }) {
  if (status === 'cancelled') {
    return <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">This order was cancelled.</div>;
  }
  const current = ORDER_FLOW.indexOf(status);
  return (
    <ol className="scrollbar-thin flex overflow-x-auto pb-1">
      {ORDER_FLOW.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={s} className="flex min-w-[96px] flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn('h-[3px] flex-1', i === 0 ? 'opacity-0' : done || now ? 'bg-brand' : 'bg-line')} />
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold',
                  done && 'border-brand bg-brand text-white',
                  now && 'border-accent bg-accent text-white ring-4 ring-accent/20',
                  !done && !now && 'border-line bg-surface text-muted'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn('h-[3px] flex-1', i === ORDER_FLOW.length - 1 ? 'opacity-0' : done ? 'bg-brand' : 'bg-line')} />
            </div>
            <span className={cn('mt-2 px-1 text-[11px] font-semibold leading-tight', now ? 'text-ink' : 'text-muted')}>{ORDER_STATUS[s].label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderItems({ order }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-left">
          <tr>
            <th className="px-4 py-2.5 font-bold">Size</th>
            <th className="px-4 py-2.5 font-bold">Colour</th>
            <th className="px-4 py-2.5 text-right font-bold">Qty</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it, i) => (
            <tr key={i} className="border-t border-line">
              <td className="px-4 py-2.5 font-semibold">{it.size || '—'}</td>
              <td className="px-4 py-2.5">{it.color || '—'}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{it.quantity}</td>
            </tr>
          ))}
          <tr className="border-t border-line bg-surface-2/60 font-bold">
            <td className="px-4 py-2.5" colSpan={2}>Total pieces</td>
            <td className="px-4 py-2.5 text-right tabular-nums">{order.totalQuantity}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function OrderMoney({ order }) {
  const rows = [
    ['Estimated (list price)', formatLKR(order.estimatedAmount)],
    ['Final price', order.totalAmount ? formatLKR(order.totalAmount) : 'To be confirmed'],
    ['Paid', formatLKR(order.amountPaid)],
    ['Balance', order.totalAmount ? formatLKR(Math.max(0, order.totalAmount - order.amountPaid)) : '—'],
  ];
  return (
    <dl className="divide-y divide-line text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 py-2">
          <dt className="text-muted">{k}</dt>
          <dd className="font-semibold tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function OrderHistory({ history = [] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-dashed border-line pl-5">
      {[...history].reverse().map((h, i) => (
        <li key={i} className="relative">
          <span className={cn('absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-surface', i === 0 ? 'bg-accent' : 'bg-line')} />
          <p className="text-sm font-bold">{ORDER_STATUS[h.status]?.label || h.status}</p>
          {h.note && <p className="mt-0.5 text-sm text-muted">{h.note}</p>}
          <p className="mt-0.5 text-xs text-muted">
            {formatDateTime(h.at)}
            {h.by?.name && ` · ${h.by.role === 'admin' ? 'Groovy team' : h.by.name}`}
          </p>
        </li>
      ))}
    </ol>
  );
}
