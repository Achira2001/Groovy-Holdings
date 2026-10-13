'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FolderTree, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { Badge, Button, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Skeleton, Textarea, Toggle } from '@/components/ui';

const EMPTY = { name: '', description: '', sortOrder: 0, isActive: true };

export default function CategoriesPage() {
  const [cats, setCats] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | category
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(() => {
    api.get('/categories', { params: { all: true } }).then(({ data }) => setCats(data.categories)).catch((e) => toast.error(getErrorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const open = (c) => {
    setEditing(c || 'new');
    setForm(c ? { name: c.name, description: c.description || '', sortOrder: c.sortOrder || 0, isActive: c.isActive } : EMPTY);
    setImage(null);
    setRemoveImage(false);
  };

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append('image', image);
    if (removeImage) fd.append('removeImage', 'true');
    setSaving(true);
    try {
      const { data } = editing === 'new' ? await api.post('/categories', fd) : await api.patch(`/categories/${editing._id}`, fd);
      toast.success(data.message);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c) => {
    const fd = new FormData();
    fd.append('isActive', String(!c.isActive));
    try {
      await api.patch(`/categories/${c._id}`, fd);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const { data } = await api.delete(`/categories/${deleting._id}`);
      toast.success(data.message);
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const preview = image ? URL.createObjectURL(image) : !removeImage && editing !== 'new' ? editing?.image : '';

  return (
    <>
      <PageHeader title="Categories" text="Group products so customers can browse by type (T-shirts, caps, mugs…)." actions={<Button onClick={() => open(null)}><Plus className="h-4 w-4" /> New category</Button>} />
      {!cats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : cats.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cats.map((c) => (
            <article key={c._id} className="card overflow-hidden">
              <div className="halftone relative aspect-[16/7] bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.image && <img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                {!c.isActive && <span className="absolute left-3 top-3"><Badge tone="warning">Hidden</Badge></span>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{c.name}</h2>
                    <p className="font-mono text-xs text-muted">/{c.slug} · order {c.sortOrder}</p>
                  </div>
                  <Link href={`/admin/products?category=${c._id}`} className="chip">{c.productCount} products</Link>
                </div>
                {c.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{c.description}</p>}
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <button type="button" className="text-xs font-semibold text-muted hover:text-ink" onClick={() => toggleActive(c)}>
                    {c.isActive ? 'Hide from website' : 'Show on website'}
                  </button>
                  <div className="flex gap-1">
                    <button type="button" className="btn-icon" onClick={() => open(c)} aria-label={`Edit ${c.name}`}><Pencil className="h-4 w-4" /></button>
                    <button type="button" className="btn-icon hover:text-danger" onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={FolderTree} title="No categories yet" text="Create your first category, then add products to it." action={<Button onClick={() => open(null)}>Create category</Button>} />
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'New category' : 'Edit category'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <p className="field-label">Cover image</p>
            <button type="button" onClick={() => fileRef.current?.click()} className="halftone relative grid aspect-[16/7] w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-surface-2 hover:border-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {preview ? <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="flex items-center gap-2 text-sm font-semibold text-muted"><ImagePlus className="h-5 w-5" /> Upload image</span>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { setImage(e.target.files?.[0] || null); setRemoveImage(false); e.target.value = ''; }} />
            {preview && (
              <button type="button" className="mt-2 text-xs font-semibold text-danger" onClick={() => { setImage(null); setRemoveImage(true); }}>Remove image</button>
            )}
          </div>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={60} placeholder="e.g. T-shirts" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={400} />
          <Input label="Display order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} hint="Lower numbers appear first" />
          <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Visible on website" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save category</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} danger title={`Delete ${deleting?.name}?`} text="Categories that still contain products can't be deleted." confirmLabel="Delete" />
    </>
  );
}
