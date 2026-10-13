'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProductCard, { ProductCardSkeleton } from '@/components/products/ProductCard';

export default function FeaturedProducts() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    api
      .get('/products', { params: { featured: 'true', limit: 8 } })
      .then(async ({ data }) => {
        if (data.products.length) return setProducts(data.products);
        const res = await api.get('/products', { params: { limit: 8, sort: 'popular' } });
        setProducts(res.data.products);
      })
      .catch(() => setProducts([]));
  }, []);

  if (products && !products.length) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
        Products will appear here once the team adds them. Meanwhile, <Link className="link" href="/contact">send us a message</Link>.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products ? products.map((p) => <ProductCard key={p._id} product={p} />) : Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}
