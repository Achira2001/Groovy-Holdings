'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { getErrorMessage } from '@/lib/api';
import ProductForm from '@/components/admin/ProductForm';
import { PageLoader } from '@/components/ui';

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => setProduct(data.product)).catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  if (error) return <p className="text-danger">{error}</p>;
  if (!product) return <PageLoader />;
  return <ProductForm key={product._id} product={product} />;
}
