'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, ExternalLink, ImagePlus, Plus, Star, Trash2, X } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { Button, Input, Select, Textarea, Toggle } from '@/components/ui';
import ChipInput from './ChipInput';
import SizeChartEditor from './SizeChartEditor';
import { cn, formatLKR } from '@/lib/utils';

const MAX_IMAGES = 12;

const blank = {
  name: '',
  category: '',
  shortDescription: '',
  description: '',
  companyName: 'Groovy Holdings (Pvt) Ltd',
  price: '',
  compareAtPrice: '',
  priceNote: 'per piece',
  minOrderQty: 12,
  materials: [],
  printMethods: [],
  sizes: [],
  colors: [],
  tags: [],
  sizeChart: { title: 'Size chart', unit: 'inches', columns: [], rows: [], note: '' },
  customFields: [],
  isFeatured: false,
  isActive: true,
};

function Section({ title, text, children }) {
  return (
    <section className="panel">
      <h2 className="font-bold">{title}</h2>
      {text && <p className="mb-4 mt-0.5 text-sm text-muted">{text}</p>}
      <div className={text ? '' : 'mt-4'}>{children}</div>
    </section>
  );
}

/**
 * Create / edit a product: gallery (up to 12 images), details, materials,
 * sizes, colours, a full size chart and any number of custom fields.
 */
export default function ProductForm({ product }) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const fileRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(() =>
    product
      ? {
          ...blank,
          ...product,
          category: product.category?._id || product.category || '',
          compareAtPrice: product.compareAtPrice ?? '',
          sizeChart: { ...blank.sizeChart, ...(product.sizeChart || {}) },
        }
      : blank
  );
  // Gallery items: { type: 'existing', url } | { type: 'new', file, url }
  const [gallery, setGallery] = useState(() => (product?.images || []).map((url) => ({ type: 'existing', url })));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/categories', { params: { all: true } }).then(({ data }) => {
      setCategories(data.categories);
      setForm((f) => (f.category || !data.categories[0] ? f : { ...f, category: data.categories[0]._id }));
    });
  }, []);

  useEffect(
    () => () => gallery.forEach((g) => g.type === 'new' && URL.revokeObjectURL(g.url)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const addImages = (list) => {
    const files = Array.from(list || []).filter((f) => f.type.startsWith('image/'));
    const room = MAX_IMAGES - gallery.length;
    if (files.length > room) toast.error(`You can add up to ${MAX_IMAGES} images`);
    setGallery((g) => [...g, ...files.slice(0, room).map((file) => ({ type: 'new', file, url: URL.createObjectURL(file) }))]);
  };
  const move = (i, dir) =>
    setGallery((g) => {
      const j = i + dir;
      if (j < 0 || j >= g.length) return g;
      const next = [...g];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const estimate = useMemo(() => (Number(form.price) || 0) * (Number(form.minOrderQty) || 1), [form.price, form.minOrderQty]);

  const submit = async (e) => {
    e.preventDefault();
    if (!gallery.length) return toast.error('Add at least one image of this product');
    if (!form.category) return toast.error('Create a category first');

    // New images are uploaded after existing ones; keep the chosen cover by
    // sending existing images in order and uploading new files in order.
    const fd = new FormData();
    ['name', 'category', 'shortDescription', 'description', 'companyName', 'price', 'compareAtPrice', 'priceNote', 'minOrderQty'].forEach((k) =>
      fd.append(k, form[k] ?? '')
    );
    fd.append('isFeatured', String(form.isFeatured));
    fd.append('isActive', String(form.isActive));
    ['materials', 'printMethods', 'sizes', 'colors', 'tags', 'customFields', 'sizeChart'].forEach((k) => fd.append(k, JSON.stringify(form[k])));
    fd.append('existingImages', JSON.stringify(gallery.filter((g) => g.type === 'existing').map((g) => g.url)));
    gallery.filter((g) => g.type === 'new').forEach((g) => fd.append('images', g.file));

    setSaving(true);
    try {
      const { data } = isEdit ? await api.patch(`/products/${product._id}`, fd) : await api.post('/products', fd);
      toast.success(data.message);
      if (isEdit) {
        setGallery(data.product.images.map((url) => ({ type: 'existing', url })));
        router.refresh();
      } else router.replace(`/admin/products/${data.product._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const hasNewBeforeExisting = gallery.some((g, i) => g.type === 'new' && gallery.slice(i + 1).some((x) => x.type === 'existing'));

  return (
    <form onSubmit={submit}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/products" className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Products
          </Link>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{isEdit ? form.name || 'Edit product' : 'Add a product'}</h1>
          <p className="text-sm text-muted">This is the showcase customers browse before they order.</p>
        </div>
        <div className="flex gap-2">
          {isEdit && (
            <Link href={`/products/${product.slug}`} target="_blank" className="btn-outline">
              <ExternalLink className="h-4 w-4" /> View live
            </Link>
          )}
          <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Publish product'}</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Section title="Photos" text={`Show the finished work from several angles. First image is the cover. Up to ${MAX_IMAGES} images, 8 MB each.`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((g, i) => (
                <div key={g.url} className={cn('group relative aspect-square overflow-hidden rounded-xl border bg-surface-2', i === 0 ? 'border-accent ring-2 ring-accent/30' : 'border-line')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white"><Star className="h-3 w-3" /> Cover</span>}
                  {g.type === 'new' && <span className="absolute right-2 top-2 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">New</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <span className="flex gap-1">
                      <button type="button" onClick={() => move(i, -1)} className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-[#13243B]" aria-label="Move left"><ArrowLeft className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => move(i, 1)} className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-[#13243B]" aria-label="Move right"><ArrowRight className="h-3.5 w-3.5" /></button>
                    </span>
                    <button type="button" onClick={() => setGallery((l) => l.filter((_, j) => j !== i))} className="grid h-7 w-7 place-items-center rounded-md bg-danger text-white" aria-label="Remove image"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              {gallery.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); addImages(e.dataTransfer.files); }}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-sm font-semibold text-muted hover:border-brand hover:text-brand"
                >
                  <ImagePlus className="h-6 w-6" /> Add photos
                  <span className="text-xs font-normal">{gallery.length}/{MAX_IMAGES}</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addImages(e.target.files); e.target.value = ''; }} />
            {hasNewBeforeExisting && <p className="field-hint">New photos are saved after the existing ones. Reorder again after saving if needed.</p>}
          </Section>

          <Section title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input className="sm:col-span-2" label="Product name" value={form.name} onChange={set('name')} required maxLength={120} placeholder="e.g. Sports day house T-shirts" />
              <Select label="Category" value={form.category} onChange={set('category')} required hint={!categories.length ? 'Create a category first' : undefined}>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}{!c.isActive ? ' (hidden)' : ''}</option>
                ))}
              </Select>
              <Input label="Company name" value={form.companyName} onChange={set('companyName')} hint="Brand / client shown on the product" />
              <Input className="sm:col-span-2" label="Short description" value={form.shortDescription} onChange={set('shortDescription')} maxLength={220} hint="One line shown on product cards" />
              <Textarea className="sm:col-span-2" label="Full description" value={form.description} onChange={set('description')} rows={7} maxLength={6000} placeholder="Tell the story of this job: fabric, GSM, print technique, finishing, turnaround time…" />
            </div>
          </Section>

          <Section title="Materials, sizes & colours" text="Customers pick sizes and colours from these lists when ordering.">
            <div className="grid gap-5 sm:grid-cols-2">
              <ChipInput label="Materials" value={form.materials} onChange={set('materials')} suggestions={['100% Cotton', 'Cotton blend', 'Dri-fit polyester', 'Pique (polo)', 'Ceramic', 'Twill']} />
              <ChipInput label="Print / decoration methods" value={form.printMethods} onChange={set('printMethods')} suggestions={['Screen print', 'DTF', 'Sublimation', 'Embroidery', 'Vinyl']} />
              <ChipInput label="Sizes" value={form.sizes} onChange={set('sizes')} suggestions={['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free size', '11 oz']} />
              <ChipInput label="Colours" value={form.colors} onChange={set('colors')} suggestions={['White', 'Black', 'Navy', 'Red', 'Royal blue', 'Maroon']} />
              <ChipInput className="sm:col-span-2" label="Search tags" value={form.tags} onChange={set('tags')} hint="Helps customers find this product (e.g. school, corporate, event)" />
            </div>
          </Section>

          <Section title="Size chart" text="Shown on the product page and inside the order form so customers pick the right sizes.">
            <SizeChartEditor value={form.sizeChart} onChange={set('sizeChart')} />
          </Section>

          <Section title="Extra details" text="Add anything else customers should know — GSM, neck type, print area, turnaround, packaging…">
            <div className="space-y-2">
              {form.customFields.map((cf, i) => (
                <div key={i} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
                  <input className="input" placeholder="Label (e.g. GSM)" value={cf.label} onChange={(e) => set('customFields')(form.customFields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label="Field label" />
                  <input className="input" placeholder="Value (e.g. 180)" value={cf.value} onChange={(e) => set('customFields')(form.customFields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} aria-label="Field value" />
                  <button type="button" className="btn-icon h-11 w-11 hover:text-danger" onClick={() => set('customFields')(form.customFields.filter((_, j) => j !== i))} aria-label="Remove field"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" className="btn-outline btn-sm" onClick={() => set('customFields')([...form.customFields, { label: '', value: '' }])}>
                <Plus className="h-4 w-4" /> Add field
              </button>
            </div>
          </Section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Section title="Pricing">
            <div className="grid gap-4">
              <Input label="Price (LKR)" type="number" min="0" step="1" value={form.price} onChange={set('price')} required />
              <Input label="Compare-at price (optional)" type="number" min="0" value={form.compareAtPrice} onChange={set('compareAtPrice')} hint="Shows a crossed-out old price" />
              <Input label="Price note" value={form.priceNote} onChange={set('priceNote')} placeholder="per piece / per dozen / from" />
              <Input label="Minimum order quantity" type="number" min="1" value={form.minOrderQty} onChange={set('minOrderQty')} />
              <p className="rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
                Minimum order estimate: <strong className="text-ink">{formatLKR(estimate)}</strong>
              </p>
            </div>
          </Section>
          <Section title="Visibility">
            <div className="space-y-4">
              <Toggle checked={form.isActive} onChange={set('isActive')} label="Published" description="Visible on the website" />
              <Toggle checked={form.isFeatured} onChange={set('isFeatured')} label="Featured" description="Shown on the home page" />
            </div>
          </Section>
          <Button type="submit" className="w-full" size="lg" loading={saving}>{isEdit ? 'Save changes' : 'Publish product'}</Button>
        </aside>
      </div>
    </form>
  );
}
