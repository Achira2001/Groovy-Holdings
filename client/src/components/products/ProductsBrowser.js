'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PackageSearch, Search, X } from 'lucide-react';
import api from '@/lib/api';
import ProductCard, { ProductCardSkeleton } from './ProductCard';
import { EmptyState, Pagination } from '@/components/ui';
import { cn } from '@/lib/utils';

const SORTS = [
  ['newest', 'Newest'],
  ['popular', 'Most ordered'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['name', 'Name A–Z'],
];

export default function ProductsBrowser() {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get('category') || 'all';
  const sort = params.get('sort') || 'newest';
  const search = params.get('search') || '';
  const page = Number(params.get('page')) || 1;

  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [term, setTerm] = useState(search);

  const setParam = (updates) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => (v && v !== 'all' ? next.set(k, v) : next.delete(k)));
    if (!('page' in updates)) next.delete('page');
    router.push(`/products?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    api.get('/categories').then(({ data: d }) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setData(null);
    api
      .get('/products', { params: { category, sort, search, page, limit: 12 } })
      .then(({ data: d }) => setData(d))
      .catch(() => setData({ products: [], total: 0, pages: 0 }));
  }, [category, sort, search, page]);

  useEffect(() => setTerm(search), [search]);

  const activeCat = categories.find((c) => c.slug === category);

  return (
    <div className="container py-10 lg:py-14">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{activeCat ? activeCat.name : 'Products'}</h1>
        <p className="mt-3 text-muted">
          {activeCat?.description ||
            'Browse our printing and embroidery work with prices, materials and size charts. Open any product to place an order with your design.'}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <CatButton active={category === 'all'} onClick={() => setParam({ category: 'all' })}>
            All
          </CatButton>
          {categories.map((c) => (
            <CatButton key={c._id} active={category === c.slug} onClick={() => setParam({ category: c.slug })}>
              {c.name} <span className="text-muted">{c.productCount}</span>
            </CatButton>
          ))}
        </div>
        <div className="flex gap-2">
          <form
            className="relative flex-1 lg:w-64"
            onSubmit={(e) => {
              e.preventDefault();
              setParam({ search: term.trim() });
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search products" className="input pl-9 pr-9" aria-label="Search products" />
            {term && (
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink" onClick={() => { setTerm(''); setParam({ search: '' }); }} aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
          <select value={sort} onChange={(e) => setParam({ sort: e.target.value })} className="input w-auto" aria-label="Sort products">
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8">
        {data && !data.products.length ? (
          <EmptyState
            icon={PackageSearch}
            title="No products match"
            text={search ? `Nothing found for "${search}". Try another word or category.` : 'This category has no products yet.'}
            action={<button className="btn-outline" onClick={() => router.push('/products')}>Show all products</button>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {data ? data.products.map((p) => <ProductCard key={p._id} product={p} />) : Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        )}
        {data && <Pagination page={page} pages={data.pages} onChange={(p) => setParam({ page: String(p) })} />}
      </div>
    </div>
  );
}

function CatButton({ active, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
        active ? 'border-ink bg-ink text-bg [&>span]:text-bg/60' : 'border-line bg-surface text-ink hover:border-ink/40'
      )}
      {...props}
    >
      {children}
    </button>
  );
}
