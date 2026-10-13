'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, Pencil, Plus, Search, Shirt, Star, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { Badge, ConfirmDialog, EmptyState, PageHeader, Pagination, Select, Skeleton } from '@/components/ui';
import { cn, formatDate, formatLKR } from '@/lib/utils';

function ProductsAdmin() {
  const params = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(params.get('category') || 'all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/categories', { params: { all: true } }).then(({ data: d }) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    api
      .get('/products', { params: { includeInactive: true, category, search, sort, page, limit: 15 } })
      .then(({ data: d }) => setData(d))
      .catch((e) => toast.error(getErrorMessage(e)));
  }, [category, search, sort, page]);
  useEffect(load, [load]);

  const flip = async (p, field) => {
    const fd = new FormData();
    fd.append(field, String(!p[field]));
    try {
      await api.patch(`/products/${p._id}`, fd);
      setData((d) => ({ ...d, products: d.products.map((x) => (x._id === p._id ? { ...x, [field]: !p[field] } : x)) }));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const { data: d } = await api.delete(`/products/${deleting._id}`);
      toast.success(d.message);
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Products" text={data ? `${data.total} product(s) in your showcase` : 'Your past work, with prices'} actions={<Link href="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>} />
      <div className="panel mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_200px_180px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Category">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="newest">Newest</option>
          <option value="popular">Most popular</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name A–Z</option>
        </Select>
      </div>

      {!data ? (
        <Skeleton className="h-96" />
      ) : data.products.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Performance</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p._id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p._id}`} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="h-12 w-12 rounded-lg bg-surface-2" />}
                      <span className="min-w-0">
                        <span className="block max-w-[260px] truncate font-semibold hover:text-brand">{p.name}</span>
                        <span className="text-xs text-muted">{p.images?.length || 0} photos · added {formatDate(p.createdAt)}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 tabular-nums">
                    <span className="font-semibold">{formatLKR(p.price)}</span>
                    <span className="block text-xs text-muted">{p.priceNote} · min {p.minOrderQty}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    <span className="block">{p.orderCount || 0} orders</span>
                    <span className="block">{p.views || 0} views</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => flip(p, 'isActive')} title="Toggle published">
                        <Badge tone={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Published' : 'Hidden'}</Badge>
                      </button>
                      <button type="button" onClick={() => flip(p, 'isFeatured')} title="Toggle featured">
                        <Badge tone={p.isFeatured ? 'accent' : 'neutral'}><Star className={cn('h-3 w-3', p.isFeatured && 'fill-current')} /> {p.isFeatured ? 'Featured' : 'Feature'}</Badge>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/products/${p.slug}`} target="_blank" className="btn-icon" aria-label="View on website"><Eye className="h-4 w-4" /></Link>
                      <Link href={`/admin/products/${p._id}`} className="btn-icon" aria-label="Edit"><Pencil className="h-4 w-4" /></Link>
                      <button type="button" className="btn-icon hover:text-danger" onClick={() => setDeleting(p)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4"><Pagination page={data.page} pages={data.pages} onChange={setPage} /></div>
        </div>
      ) : (
        <EmptyState icon={Shirt} title="No products yet" text="Add photos of your past work with prices, materials and a size chart." action={<Link href="/admin/products/new" className="btn-primary">Add product</Link>} />
      )}

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} danger title={`Delete ${deleting?.name}?`} text="Its photos are removed too. Existing orders keep a snapshot of the product." confirmLabel="Delete product" />
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <ProductsAdmin />
    </Suspense>
  );
}
