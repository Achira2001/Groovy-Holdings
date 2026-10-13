'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CheckCircle2, MessageCircle, Palette, Plus, Ruler, Trash2, Upload } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Modal, Textarea } from '@/components/ui';
import FileDropzone from '@/components/shared/FileDropzone';
import SizeChartTable from './SizeChartTable';
import { cn, formatLKR, whatsappLink, WHATSAPP_DISPLAY } from '@/lib/utils';

export default function OrderForm({ product }) {
  const { user } = useAuth();
  const router = useRouter();
  const sizes = product.sizes?.length ? product.sizes : ['Standard'];
  const colors = product.colors?.length ? product.colors : [];

  const [lines, setLines] = useState([{ color: colors[0] || '', size: sizes[0], quantity: product.minOrderQty || 1 }]);
  const [designMode, setDesignMode] = useState('upload'); // 'upload' | 'groovy'
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ? `+${user.whatsapp}` : '');
  const [neededBy, setNeededBy] = useState('');
  const [address, setAddress] = useState('');
  const [chartOpen, setChartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalQty = useMemo(() => lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0), [lines]);
  const belowMin = totalQty < (product.minOrderQty || 1);
  const canSubmit = designMode === 'upload' && files.length > 0 && totalQty > 0 && !belowMin;

  const updateLine = (i, patch) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const waDesignMessage = `Hi Groovy Holdings! I'd like you to create a design for "${product.name}".\nQuantity: ${totalQty}\nSizes: ${lines
    .map((l) => `${l.size}${l.color ? ` (${l.color})` : ''} × ${l.quantity}`)
    .join(', ')}\nMy idea: `;

  if (!user) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h3 className="text-xl font-bold">Order this product</h3>
        <p className="mt-2 text-sm text-muted">Sign in to add your sizes, upload your design and track the order from your account.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/login?next=/products/${product.slug}%23order`} className="btn-primary">Sign in to order</Link>
          <Link href="/register" className="btn-outline">Create account</Link>
        </div>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
        You are signed in as an admin. Customers see the order form here.{' '}
        <Link className="link" href={`/admin/products/${product._id}`}>Edit this product</Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('productId', product._id);
      fd.append('items', JSON.stringify(lines.filter((l) => Number(l.quantity) > 0)));
      fd.append('message', message);
      fd.append('contactWhatsapp', whatsapp);
      if (neededBy) fd.append('neededBy', neededBy);
      if (address) fd.append('deliveryAddress', address);
      files.forEach((f) => fd.append('files', f));
      const { data } = await api.post('/orders', fd);
      toast.success(`Order ${data.order.orderNumber} placed`);
      router.push(`/account/orders/${data.order._id}?placed=1`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line p-5 sm:p-6">
        <h3 className="text-xl font-bold">Order this product</h3>
        <p className="mt-1 text-sm text-muted">Add sizes and quantities, then upload your design. We confirm the final price before production.</p>
      </div>

      {/* Sizes & quantities */}
      <section className="space-y-3 border-b border-line p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h4 className="font-bold">Sizes & quantities</h4>
          <button type="button" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline" onClick={() => setChartOpen(true)}>
            <Ruler className="h-4 w-4" /> Size chart
          </button>
        </div>
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_90px_36px] items-end gap-2">
            {colors.length ? (
              <label className="text-xs text-muted">
                Colour
                <select className="input mt-1" value={l.color} onChange={(e) => updateLine(i, { color: e.target.value })}>
                  {colors.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            ) : (
              <label className="text-xs text-muted">
                Colour
                <input className="input mt-1" placeholder="Any" value={l.color} onChange={(e) => updateLine(i, { color: e.target.value })} />
              </label>
            )}
            <label className="text-xs text-muted">
              Size
              <select className="input mt-1" value={l.size} onChange={(e) => updateLine(i, { size: e.target.value })}>
                {sizes.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted">
              Qty
              <input type="number" min="0" className="input mt-1 tabular-nums" value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value.replace(/\D/g, '') })} />
            </label>
            <button type="button" className="btn-icon mb-0.5" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} aria-label="Remove line">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={() => setLines((ls) => [...ls, { color: ls[ls.length - 1]?.color || colors[0] || '', size: sizes[Math.min(ls.length, sizes.length - 1)], quantity: 1 }])}
        >
          <Plus className="h-4 w-4" /> Add size or colour
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm">
          <span>
            Total <b className="tabular-nums">{totalQty}</b> pieces
            {belowMin && <span className="ml-2 text-danger">Minimum is {product.minOrderQty}</span>}
          </span>
          <span className="text-muted">
            Estimate <b className="text-ink">{formatLKR(product.price * totalQty)}</b>
          </span>
        </div>
      </section>

      {/* Design */}
      <section className="space-y-4 border-b border-line p-5 sm:p-6">
        <h4 className="font-bold">Your design</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <DesignChoice active={designMode === 'upload'} onClick={() => setDesignMode('upload')} icon={Upload} title="I have my design" text="Upload artwork files" />
          <DesignChoice active={designMode === 'groovy'} onClick={() => setDesignMode('groovy')} icon={Palette} title="Design it for me" text="Our team creates it" />
        </div>

        {designMode === 'upload' ? (
          <FileDropzone
            files={files}
            onChange={setFiles}
            label="Drop your design files or browse"
            hint="AI, PSD, PDF, EPS, CDR, PNG, JPG, SVG or ZIP · up to 10 files, 25 MB each"
          />
        ) : (
          <div className="rounded-xl border border-success/30 bg-success/10 p-5">
            <p className="font-semibold">Send us a WhatsApp message to get your design made</p>
            <p className="mt-1 text-sm text-muted">
              Message <b className="text-ink">{WHATSAPP_DISPLAY}</b> with your idea, logo or reference images. Once the design is approved, come back and upload it here to place the order.
            </p>
            <a href={whatsappLink(waDesignMessage)} target="_blank" rel="noreferrer" className="btn mt-4 bg-[#1FAF5A] text-white hover:bg-[#199a4e]">
              <MessageCircle className="h-4 w-4" /> Message on WhatsApp
            </a>
          </div>
        )}
      </section>

      {/* Details */}
      <section className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <Textarea
          className="sm:col-span-2"
          label="Message for our team"
          placeholder="Print position, ink colours, fabric preference, names & numbers, anything we should know"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={3000}
        />
        <Input label="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required hint="We may contact you here about this order" />
        <Input label="Needed by" type="date" value={neededBy} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setNeededBy(e.target.value)} hint="Optional" />
        <Input className="sm:col-span-2" label="Delivery address" placeholder="Optional – leave empty for pickup" value={address} onChange={(e) => setAddress(e.target.value)} />
      </section>

      <div className="flex flex-col gap-3 border-t border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="text-xs text-muted">
          {designMode === 'groovy'
            ? 'Placing an order needs a design file. Get your design from our team on WhatsApp first.'
            : !files.length
              ? 'Upload at least one design file to place the order.'
              : 'The estimate is not final. We confirm the price after reviewing your design.'}
        </p>
        <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit}>
          <CheckCircle2 className="h-5 w-5" /> Place order
        </Button>
      </div>

      <Modal open={chartOpen} onClose={() => setChartOpen(false)} title={product.sizeChart?.title || 'Size chart'} size="lg">
        <SizeChartTable chart={product.sizeChart} />
      </Modal>
    </form>
  );
}

function DesignChoice({ active, icon: Icon, title, text, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors',
        active ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/50'
      )}
      aria-pressed={active}
      {...props}
    >
      <Icon className={cn('h-5 w-5', active ? 'text-brand' : 'text-muted')} />
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-muted">{text}</span>
      </span>
    </button>
  );
}
