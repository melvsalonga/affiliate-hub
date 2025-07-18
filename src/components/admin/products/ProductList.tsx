'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Form';
import { ProductWithRelations, Category, Tag } from '@/types/database';
import { ProductStatus } from '@prisma/client';

interface ProductListProps {
  initialProducts?: ProductWithRelations[];
  categories?: Category[];
  tags?: Tag[];
}

interface ProductFilters {
  search: string;
  categoryId: string;
  status: ProductStatus | '';
  isActive: boolean | '';
  minPrice: string;
  maxPrice: string;
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface BulkActions {
  selectedIds: string[];
  action: 'delete' | 'activate' | 'deactivate' | 'archive' | '';
}

export const ProductList: React.FC<ProductListProps> = ({
  initialProducts = [],
  categories = [],
  tags = []
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActions, setBulkActions] = useState<BulkActions>({
    selectedIds: [],
    action: ''
  });

  // Filters state
  const [filters, setFilters] = useState<ProductFilters>({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    status: (searchParams.get('status') as ProductStatus) || '',
    isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  });

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              params.set(key, value.join(','));
            }
          } else {
            params.set(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(','));
          }
        } else {
          params.set(key, value.toString());
        }
      }
    });

    const newUrl = `/admin/products${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
    
    fetchProducts();
  }, [filters]);

  // Handle filter changes
  const updateFilter = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      status: '',
      isActive: '',
      minPrice: '',
      maxPrice: '',
      tags: [],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // Bulk actions
  const toggleSelectAll = () => {
    if (bulkActions.selectedIds.length === products.length) {
      setBulkActions(prev => ({ ...prev, selectedIds: [] }));
    } else {
      setBulkActions(prev => ({ 
        ...prev, 
        selectedIds: products.map(p => p.id) 
      }));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    setBulkActions(prev => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(productId)
        ? prev.selectedIds.filter(id => id !== productId)
        : [...prev.selectedIds, productId]
    }));
  };

  const executeBulkAction = async () => {
    if (!bulkActions.action || bulkActions.selectedIds.length === 0) return;

    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkActions.action,
          productIds: bulkActions.selectedIds
        })
      });

      if (response.ok) {
        fetchProducts();
        setBulkActions({ selectedIds: [], action: '' });
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  // Status badge styling
  const getStatusBadge = (status: ProductStatus, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>;
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Category and tag options
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'INACTIVE', label: 'Inactive' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'title', label: 'Title' },
    { value: 'currentPrice', label: 'Price' },
    { value: 'publishedAt', label: 'Published Date' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your affiliate products and links
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
          
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={() => router.push('/admin/products/new')}
            icon={<Plus className="h-4 w-4" />}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
              
              <Select
                options={categoryOptions}
                value={filters.categoryId}
                onChange={(e) => updateFilter('categoryId', e.target.value)}
                placeholder="Select category"
              />
              
              <Select
                options={statusOptions}
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                placeholder="Select status"
              />
              
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min price"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max price"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <Select
                  options={sortOptions}
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  icon={filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                >
                  {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
              </div>
              
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {bulkActions.selectedIds.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {bulkActions.selectedIds.length} product(s) selected
              </span>
              
              <div className="flex items-center space-x-3">
                <Select
                  options={[
                    { value: '', label: 'Select action' },
                    { value: 'activate', label: 'Activate' },
                    { value: 'deactivate', label: 'Deactivate' },
                    { value: 'archive', label: 'Archive' },
                    { value: 'delete', label: 'Delete' }
                  ]}
                  value={bulkActions.action}
                  onChange={(e) => setBulkActions(prev => ({ ...prev, action: e.target.value as any }))}
                />
                
                <Button
                  onClick={executeBulkAction}
                  disabled={!bulkActions.action}
                  size="sm"
                >
                  Execute
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkActions({ selectedIds: [], action: '' })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by creating your first product.
            </p>
            <Button onClick={() => router.push('/admin/products/new')}>
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        )}>
          {viewMode === 'grid' ? (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selected={bulkActions.selectedIds.includes(product.id)}
                onSelect={() => toggleSelectProduct(product.id)}
                onEdit={() => router.push(`/admin/products/${product.id}/edit`)}
                onView={() => router.push(`/admin/products/${product.id}`)}
                onDelete={() => {/* Handle delete */}}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={toggleSelectAll}
                            className="flex items-center"
                          >
                            {bulkActions.selectedIds.length === products.length ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {products.map((product) => (
                        <ProductRow
                          key={product.id}
                          product={product}
                          selected={bulkActions.selectedIds.includes(product.id)}
                          onSelect={() => toggleSelectProduct(product.id)}
                          onEdit={() => router.push(`/admin/products/${product.id}/edit`)}
                          onView={() => router.push(`/admin/products/${product.id}`)}
                          onDelete={() => {/* Handle delete */}}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// Product Card Component
interface ProductCardProps {
  product: ProductWithRelations;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  selected,
  onSelect,
  onEdit,
  onView,
  onDelete
}) => {
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  
  return (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-200 cursor-pointer',
      selected && 'ring-2 ring-primary-500'
    )}>
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-t-xl overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.alt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* Selection checkbox */}
          <div className="absolute top-3 left-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="w-6 h-6 bg-white dark:bg-gray-800 rounded border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center"
            >
              {selected && <CheckSquare className="h-4 w-4 text-primary-500" />}
            </button>
          </div>
          
          {/* Actions */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button size="sm" variant="secondary" onClick={onView}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
              {product.title}
            </h3>
            <div className="ml-2">
              {getStatusBadge(product.status, product.isActive)}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {product.shortDescription || product.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ${product.currentPrice}
              </span>
              {product.originalPrice && product.originalPrice > product.currentPrice && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>
            
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {product.category.name}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Product Row Component
const ProductRow: React.FC<ProductCardProps> = ({
  product,
  selected,
  onSelect,
  onEdit,
  onView,
  onDelete
}) => {
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  
  return (
    <tr className={cn(
      'hover:bg-gray-50 dark:hover:bg-gray-800',
      selected && 'bg-primary-50 dark:bg-primary-900/20'
    )}>
      <td className="px-6 py-4">
        <button onClick={onSelect} className="flex items-center">
          {selected ? (
            <CheckSquare className="h-4 w-4 text-primary-500" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {product.title}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {product.slug}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
        {product.category.name}
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900 dark:text-white">
            ${product.currentPrice}
          </span>
          {product.originalPrice && product.originalPrice > product.currentPrice && (
            <span className="text-sm text-gray-500 line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4">
        {getStatusBadge(product.status, product.isActive)}
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        {new Date(product.createdAt).toLocaleDateString()}
      </td>
      
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end space-x-2">
          <Button size="sm" variant="ghost" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

// Helper function for status badges
const getStatusBadge = (status: ProductStatus, isActive: boolean) => {
  if (!isActive) {
    return <Badge variant="secondary">Inactive</Badge>;
  }
  
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Active</Badge>;
    case 'DRAFT':
      return <Badge variant="secondary">Draft</Badge>;
    case 'SCHEDULED':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Scheduled</Badge>;
    case 'INACTIVE':
      return <Badge variant="secondary">Inactive</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};