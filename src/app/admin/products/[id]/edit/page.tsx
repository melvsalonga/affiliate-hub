'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProductWithRelations, Category, Tag } from '@/types/database';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<ProductWithRelations | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchData();
    }
  }, [productId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [productRes, categoriesRes, tagsRes] = await Promise.all([
        fetch(`/api/products/${productId}`),
        fetch('/api/categories'),
        fetch('/api/tags')
      ]);

      const [productData, categoriesData, tagsData] = await Promise.all([
        productRes.json(),
        categoriesRes.json(),
        tagsRes.json()
      ]);

      if (!productRes.ok) {
        throw new Error(productData.error || 'Failed to fetch product');
      }

      if (productData.success) setProduct(productData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
      if (tagsData.success) setTags(tagsData.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Products', href: '/admin/products' },
    { label: product?.title || 'Edit Product' }
  ];

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['ADMIN', 'EDITOR']}>
        <AdminLayout title="Edit Product" breadcrumbs={breadcrumbs}>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (error || !product) {
    return (
      <ProtectedRoute requiredRoles={['ADMIN', 'EDITOR']}>
        <AdminLayout title="Edit Product" breadcrumbs={breadcrumbs}>
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              {error || 'Product not found'}
            </div>
            <button
              onClick={() => window.history.back()}
              className="text-primary-500 hover:text-primary-600"
            >
              Go back
            </button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'EDITOR']}>
      <AdminLayout breadcrumbs={breadcrumbs}>
        <ProductForm
          mode="edit"
          product={product}
          categories={categories}
          tags={tags}
        />
      </AdminLayout>
    </ProtectedRoute>
  );
}