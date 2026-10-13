import Link from 'next/link';
import { Shirt } from 'lucide-react';
import { formatLKR } from '@/lib/utils';

export default function ProductCard({ product }) {
  const img = product.images?.[0];
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-surface-2">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="halftone grid h-full w-full place-items-center">
            <Shirt className="h-14 w-14 text-brand/50" strokeWidth={1.2} />
          </div>
        )}
        {product.isFeatured && (
          <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-1 text-[11px] font-bold text-white">Popular</span>
        )}
        {product.images?.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
            {product.images.length} photos
          </span>
        )}
      </div>
      <div className="mt-3 px-0.5">
        {product.category?.name && <p className="text-xs font-semibold text-brand">{product.category.name}</p>}
        <h3 className="mt-0.5 font-display text-[17px] font-bold leading-snug group-hover:text-brand">{product.name}</h3>
        <p className="mt-1 text-sm">
          <span className="font-bold">{formatLKR(product.price)}</span>{' '}
          <span className="text-muted">{product.priceNote}</span>
        </p>
        {product.minOrderQty > 1 && <p className="mt-0.5 text-xs text-muted">Minimum {product.minOrderQty} pieces</p>}
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="aspect-[4/5] animate-pulse rounded-2xl bg-surface-2" />
      <div className="mt-3 h-3 w-16 animate-pulse rounded bg-surface-2" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-surface-2" />
      <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-surface-2" />
    </div>
  );
}
