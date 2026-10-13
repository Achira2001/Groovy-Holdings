import { Suspense } from 'react';
import ProductsBrowser from '@/components/products/ProductsBrowser';
import { PageLoader } from '@/components/ui';

export const metadata = { title: 'Products' };

export default function ProductsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProductsBrowser />
    </Suspense>
  );
}
