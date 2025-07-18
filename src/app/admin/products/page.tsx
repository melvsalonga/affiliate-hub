'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProductList } from '@/components/admin/products/ProductList';
import { BulkOperations, BulkAction } from '@/components/admin/products/BulkOperations';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProductWithRelations, Category, Tag } from '@/types/database';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, tagsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/tags')
      ]);

      const [productsData, categoriesData, tagsData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
        tagsRes.json()
      ]);

      if (productsData.success) setProducts(productsData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
      if (tagsData.success) setTags(tagsData.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: BulkAction, options?: any) => {
    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action.type,
          productIds: selectedIds,
          options
        })
      });

      if (!response.ok) {
        throw new Error('Bulk action failed');
      }

      // Refresh products list
      await fetchData();
      setSelectedIds([]);
      
      // Show success message (you can implement toast notifications)
      console.log(`${action.label} completed successfully`);
    } catch (error) {
      console.error('Bulk action failed:', error);
      throw error;
    }
  };

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Products' }
  ];

  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'EDITOR']}>
      <AdminLayout title="Products" breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <BulkOperations
            products={products}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onBulkAction={handleBulkAction}
            categories={categories}
            tags={tags}
          />
          
          <ProductList
            initialProducts={products}
            categories={categories}
            tags={tags}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}