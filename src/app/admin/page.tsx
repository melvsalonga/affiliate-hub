'use client';

import { useState, useEffect } from 'react';
import { AffiliateLink } from '@/types/affiliate';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { ManualProductAddition } from '@/components/admin/ManualProductAddition';
import { ProductList } from '@/components/admin/ProductList';
import { Product } from '@/types/product';
import { useToast } from '@/components/ui/Toast';

export default function AdminDashboard() {
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'add-product'>('products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch affiliate links and products on component mount
  useEffect(() => {
    fetchAffiliateLinks();
    loadProducts();
  }, []);

  const loadProducts = () => {
    try {
      const savedProducts = localStorage.getItem('admin_products');
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts).map((product: any) => ({
          ...product,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt)
        }));
        setProducts(parsedProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const fetchAffiliateLinks = async () => {
    try {
      setLoading(true);
      
      // TEMPORARY: Mock data for testing without database
      // TODO: Re-enable API call when Supabase is configured
      
      // Mock affiliate links data
      const mockLinks = [
        {
          id: '1',
          originalUrl: 'https://www.lazada.com.ph/products/sample-product-1',
          affiliateUrl: 'https://www.lazada.com.ph/products/sample-product-1?aff_track=123',
          platform: 'lazada',
          trackingId: 'track_123',
          commission: 0.05,
          clicks: 25,
          conversions: 3,
          revenue: 150.00,
          isActive: true,
          tags: ['electronics', 'smartphone'],
          notes: 'Sample Lazada product',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2', 
          originalUrl: 'https://shopee.ph/sample-product-2',
          affiliateUrl: 'https://shopee.ph/sample-product-2?aff_track=456',
          platform: 'shopee',
          trackingId: 'track_456',
          commission: 0.04,
          clicks: 18,
          conversions: 2,
          revenue: 80.00,
          isActive: true,
          tags: ['fashion', 'clothing'],
          notes: 'Sample Shopee product',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAffiliateLinks(mockLinks);
      
      /*
      const response = await fetch('/api/affiliate/links');
      const data = await response.json();
      
      if (data.success) {
        setAffiliateLinks(data.data);
      } else {
        setError(data.error || 'Failed to fetch affiliate links');
      }
      */
    } catch (error) {
      setError('Failed to fetch affiliate links');
      console.error('Error fetching affiliate links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductCreated = (product: Product) => {
    if (selectedProduct) {
      // Update existing product
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      setSelectedProduct(null);
      alert(`Product "${product.name}" updated successfully!`);
    } else {
      // Add new product
      setProducts(prev => [product, ...prev]);
      alert(`Product "${product.name}" created successfully!`);
    }
    setActiveTab('products');
  };

  const handleProductEdit = (product: Product) => {
    setSelectedProduct(product);
    setActiveTab('add-product');
  };

  const handleProductDeleted = (productId: string) => {
    // Update localStorage
    const adminProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
    const updatedProducts = adminProducts.filter((p: any) => p.id !== productId);
    localStorage.setItem('admin_products', JSON.stringify(updatedProducts));
    
    // Update component state
    setProducts(prev => prev.filter(product => product.id !== productId));
  };

  const handleRefreshProducts = () => {
    loadProducts();
  };

  const tabs = [
    { id: 'products', label: 'Products', count: products.length },
    { id: 'analytics', label: 'Analytics', count: null },
    { id: 'add-product', label: selectedProduct ? 'Edit Product' : 'Add Product', count: null }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your affiliate links and track performance</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as 'products' | 'analytics' | 'add-product');
                  if (tab.id !== 'add-product') {
                    setSelectedProduct(null);
                  }
                }}
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'products' && (
            <ProductList
              products={products}
              onEdit={handleProductEdit}
              onDelete={handleProductDeleted}
              onRefresh={handleRefreshProducts}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard links={affiliateLinks} />
          )}

          {activeTab === 'add-product' && (
            <ManualProductAddition
              onProductAdded={handleProductCreated}
              onCancel={() => setActiveTab('products')}
              editingProduct={selectedProduct}
            />
          )}
        </div>
      </div>

    </div>
  );
}
