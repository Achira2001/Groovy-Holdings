'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CalendarDays, ChevronRight, MessageCircle, PackageX } from 'lucide-react';
import api from '@/lib/api';
import ProductGallery from '@/components/products/ProductGallery';
import SizeChartTable from '@/components/products/SizeChartTable';
import OrderForm from '@/components/products/OrderForm';
import ProductCard from '@/components/products/ProductCard';
import { EmptyState, PageLoader } from '@/components/ui';
import { formatLKR, whatsappLink } from '@/lib/utils';

export default function ProductPage() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    setState({ loading: true });
    api
      .get(`/products/${slug}`)
      .then(({ data }) => {
        setState({ product: data.product, related: data.related });
        document.title = `${data.product.name} · Groovy Holdings`;
      })
      .catch(() => setState({ notFound: true }));
  }, [slug]);

  if (state.loading) return <PageLoader />;
  if (state.notFound) {
    return (
      <div className="container py-20">
        <EmptyState icon={PackageX} title="Product not found" text="It may have been removed or renamed." action={<Link href="/products" className="btn-primary">Browse products</Link>} />
      </div>
    );
  }

  const p = state.product;

  return (
    <div className="container py-8 lg:py-12">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/products" className="hover:text-ink">Products</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {p.category && (
          <>
            <Link href={`/products?category=${p.category.slug}`} className="hover:text-ink">{p.category.name}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        )}
        <span className="truncate text-ink">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={p.images} name={p.name} />
        </div>

        <div>
          <p className="text-sm font-semibold text-brand">{p.companyName}</p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl">{p.name}</h1>
          {p.shortDescription && <p className="mt-3 text-lg text-muted">{p.shortDescription}</p>}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-extrabold">{formatLKR(p.price)}</span>
            {p.compareAtPrice > p.price && <span className="text-muted line-through">{formatLKR(p.compareAtPrice)}</span>}
            <span className="text-sm text-muted">{p.priceNote}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Minimum order {p.minOrderQty} {p.minOrderQty === 1 ? 'piece' : 'pieces'} · Final price depends on print size, colours and quantity
          </p>

          <dl className="mt-7 divide-y divide-line rounded-2xl border border-line bg-surface">
            {p.materials?.length > 0 && <Spec label="Materials">{p.materials.join(', ')}</Spec>}
            {p.printMethods?.length > 0 && <Spec label="Print methods">{p.printMethods.join(', ')}</Spec>}
            {p.colors?.length > 0 && <Spec label="Colours">{p.colors.join(', ')}</Spec>}
            {p.sizes?.length > 0 && <Spec label="Sizes">{p.sizes.join(', ')}</Spec>}
            {p.customFields?.map((f) => <Spec key={f.label} label={f.label}>{f.value}</Spec>)}
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <a href={whatsappLink(`Hi! I'm interested in "${p.name}". Can you share more details?`)} target="_blank" rel="noreferrer" className="btn-outline">
              <MessageCircle className="h-4 w-4 text-success" /> Ask on WhatsApp
            </a>
            <Link href="/meetings" className="btn-outline">
              <CalendarDays className="h-4 w-4 text-brand" /> Book a meeting
            </Link>
          </div>

          {p.description && (
            <section className="mt-9">
              <h2 className="text-xl font-bold">About this product</h2>
              <div className="mt-3 max-w-prose whitespace-pre-line leading-relaxed text-muted">{p.description}</div>
            </section>
          )}

          <section className="mt-9">
            <h2 className="mb-3 text-xl font-bold">{p.sizeChart?.title || 'Size chart'}</h2>
            <SizeChartTable chart={p.sizeChart} />
          </section>

          <section id="order" className="mt-10 scroll-mt-24">
            <OrderForm product={p} />
          </section>
        </div>
      </div>

      {state.related?.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-extrabold">More in {p.category?.name}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {state.related.map((r) => <ProductCard key={r._id} product={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ label, children }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 px-4 py-3 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
