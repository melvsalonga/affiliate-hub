'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Category, Tag } from '@/types/database';

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tags')
      ]);

      const [categoriesData, tagsData] = await Promise.all([
        categoriesRes.json(),
        tagsRes.json()
      ]);

      if (categoriesData.success) setCategories(categoriesData.data);
      if (tagsData.success) setTags(tagsData.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Products', href: '/admin/products' },
    { label: 'New Product' }
  ];

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['ADMIN', 'EDITOR']}>
        <AdminLayout title="Create Product" breadcrumbs={breadcrumbs}>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'EDITOR']}>
      <AdminLayout breadcrumbs={breadcrumbs}>
        <ProductForm
          mode="create"
          categories={categories}
          tags={tags}
        />
      </AdminLayout>
    </ProtectedRoute>
  );
}